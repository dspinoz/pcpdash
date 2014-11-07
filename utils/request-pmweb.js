// Make requests to pmwebd 
// TODO modify server.js to query this file

var request = require('request');
var queue   = require('queue-async');

exports.port = process.env.PORT || 8080; // set our port 
                                         // TODO pmwebd port

exports.getContext = function(archive, callback) {

  //TODO request to pmwebd not local server
  request({url: 'http://localhost:'+exports.port+"/pmapi/context?archivefile=" + archive.file, json: true}, function(err,resp,json) {
    
    archive.context = json.context;
    
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
    console.log("ERROR: No metric info for " + archive.metric.name);
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
      
exports.getMetricValue = function(archive, callback) {
  request({url: 'http://localhost:'+exports.port+"/pmapi/"+archive.context+"/_fetch?names=" + archive.metric.name, json: true}, function(err,resp,json) {
    
    if (err) {
      console.log("ERROR: Invalid metric name");
      callback(null, archive);
      return;
    }
    
    if (json) {
      archive.metric.timestamp = json.timestamp;
      archive.metric.values = json.values;
    }
    
    callback(null,archive);
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
    q.defer(exports.getMetricValue, a);
  });
  
  q.awaitAll(function(err, metrics) {
    //console.log('all metric info', metrics);
    
    // cleanup the results, as multiple objects per archive will be present
    var metricsClean = [];
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


