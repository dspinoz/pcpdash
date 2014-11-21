// Make requests to pmwebd 
// TODO modify server.js to query this file

var request = require('request');
var queue   = require('queue-async');

exports.port = process.env.PORT || 8080; // set our port 
                                         // TODO pmwebd port
                                         
exports.contexts = {}; // global mapping for PMWEBAPI contexts
                                         
exports.getContext = function(archive, callback) {
  
  if (exports.contexts[archive.file]) {
    archive.context = exports.contexts[archive.file];
    callback(null,archive);
    return;
  }
  
  //TODO request to pmwebd not local server
  request({url: 'http://localhost:'+exports.port+"/pmapi/context?archivefile=" + archive.file, json: true}, function(err,resp,json) {
  
    if(err) {
      callback(err,null);
      return;
    }
    
    archive.context = json.context;
    exports.contexts[archive.file] = json.context;
    
    callback(null,archive);
  });
};

exports.getContexts = function(archives, callback) {
        
  var q = queue();
  
  archives.forEach(function (a) {
    
    q.defer(exports.getContext, a);
    
  });
  
  q.awaitAll(function(err, all) {
    //console.log('contexts', all);
    callback(null,all);
  });
};


exports.getMetricInstanceInfo = function(archive, callback) {
        
  if (!archive.metric.info)
  {
    console.log("ERROR: No metric info for " + archive.metric.name + ", host " + archive.host);
    callback(archive);
    return;
  }
  
  request({url: 'http://localhost:'+exports.port+"/pmapi/"+archive.context+"/_indom?indom=" + archive.metric.info.indom, json: true}, function(err,resp,json) {
    
    if(err) {
      console.log("ERROR: Invalid indom for metric instance info");
      callback(null,archive);
      return;
    }
    
    if (json && json.instances) {
      archive.metric.instances = json.instances;
    }
    
    callback(null,archive);
  });
};
      
exports.getMetricInfo = function(archive, callback) {
        
  var url = "/pmapi/"+archive.context+"/_metric";
  
  if (archive.metric && archive.metric.name) {
    url += "?prefix=" + archive.metric.name;
  }
  
  request({url: 'http://localhost:'+exports.port+ url, json: true}, function(err,resp,json) {
    
    var notMatched = [];
    
    if(err)
    {
      console.log('ERROR getMetricInfo:', err);
      delete exports.contexts[archive.file];
      callback(err,null);
      return;
    }
    
    if (!json.metrics || json.metrics.length == 0)
    {
      err = {message: 'no metrics available from _metric'};
      console.log("ERROR getMetricInfo:", err);
      
      delete exports.contexts[archive.file];
      
      callback(err, null);
      return;
    }
    
    json.metrics.forEach(function(m) {
      if (m.name === archive.metric.name)
      {
        archive.metric.info = m;
      }
      else
      {
        notMatched.push(m);
      }
    });
    
    archive.metric.extras = notMatched;
    
    var q = queue();
    q.defer(exports.getMetricInstanceInfo, archive);
    q.await(function(err, instInfo) {
      callback(null,instInfo);
    });
  });
};
      
exports.getMetricValue = function(ctx, callback) {
  request({url: 'http://localhost:'+exports.port+"/pmapi/"+ctx.archive.context+"/_fetch?names=" + ctx.archive.metric.name, json: true}, function(err,resp,json) {
    
    if (err) {
      console.log("ERROR: Invalid metric name");
      delete exports.contexts[ctx.archive.file];
      callback(null, ctx.archive);
      return;
    }
    
    if (json.timestamp && json.values) {
      
      if (!ctx.archive.metric.values) {
        ctx.archive.metric.values = [];
      }
      
      var info = { timestamp: json.timestamp };
      
      var now = new Date();
      var date = new Date((json.timestamp.s *1000) + (json.timestamp.us / 1000));
      
      // convert to local timezone?
      //date.setHours(date.getHours() + (now.getTimezoneOffset() / 60)); 
      
      info.timestamp.date = date.toString();
      
      //console.log(ctx.archive.host + ' got ' + info.timestamp.date);
      
      info.values = json.values;
      
      ctx.archive.metric.values.push(info);
      
      // get the next value from the archive
      ctx.q.defer(exports.getMetricValue, ctx);
    }
    else if (ctx.archive.metric.values && ctx.archive.metric.values.length)
    {
      console.log(ctx.archive.host + " got " + ctx.archive.metric.values.length + " metric values");
    }
    
    callback(null,ctx);
  });
};

exports.getMetricValues = function(archive, callback) {
  var q = queue();
  
  var ctx = { q: q, archive: archive };
  
  q.defer(exports.getMetricValue, ctx);
  
  q.awaitAll(function(err, values) {
    // ctx modifies the archive passed in
    callback(null, null);
  });
};
      
exports.getMetrics = function(info, callback) {
        
  var q = queue();
  
  info.archives.forEach(function (a) {
    
    // TODO support multiple metrics
    a.metric = {name: info.metric};
    
    // multiple queries on the queue will generate multiple results
    // see awaitAll
    q.defer(exports.getMetricInfo, a); //TODO client optimisation, info may not required
    q.defer(exports.getMetricValues, a);
  });
  
  q.awaitAll(function(err, metrics) {
    
    if (err)
    {
      callback(err, null);
      return;
    }
    
    //console.log('all metric info', metrics);
    
    // cleanup the results, as multiple objects per archive will be present
    var unique = {};
    
    metrics = metrics.filter(function(m) {
      if (!m || !m.file)
      {
        return false;
      }
      
      // use file to uniqely identify the archive
      // they have the same attributes/values
      if (unique[m.file] == undefined) {
        unique[m.file] = 1;
        return true;
      }
      return false;
    });
    
    callback(null,metrics);
  });
};


