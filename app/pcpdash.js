var fs      = require('fs');
var queue   = require('queue-async'); //TODO create rpm

var config = require('../config/pcpdash');
var config_pmmgr = require('../config/pmmgr');

var fswalk  = require('../utils/fswalk');
var pmweb   = require('../utils/request-pmweb');
var request_pcpdash = require('../utils/request-pcpdash');

var bower_resources = require('./bower_resources');
var cube = require('./cube');
var pmwebd = require('./pmwebd');
var apiv1 = require('./apiv1');

module.exports = function(app) {

  bower_resources(app);
  cube(app);
  pmwebd(app);
  apiv1(app);

  // jade-templated pages ==============================================
  // for client-side rendering

  app.get('/index', function(req,res) {
    res.render('index', {title: config.title, current: req.path, pages: config.pages});
  });

  app.get('/test', function(req,res) {
    res.render('test', {title: config.title, current: req.path, pages: config.pages});
  });

  app.get('/fetch', function(req,res) {
    res.render('fetch', {title: config.title, current: req.path, pages: config.pages});
  });

  app.get('/bar', function(req,res) {
    res.render('bar', {title: config.title, current: req.path, pages: config.pages});
  });

  app.get('/arcs', function(req,res) {
    res.render('arcs', {title: config.title, current: req.path, pages: config.pages});
  });

  app.get('/eventtypes', function(req,res) {
    res.render('eventtypes', {title: config.title, current: req.path, pages: config.pages});
  });

  app.get('/heatmap', function(req,res) {
    res.render('heatmap', {title: config.title, current: req.path, pages: config.pages});
  });

  app.get('/filesys', function(req,res) {
    res.render('filesys', {title: config.title, current: req.path, pages: config.pages});
  });
  
  // pcpdash =============================================================
  // Provides dashboard-specific requests 
  // Often utilities in order to provide some extra metadata for 
  // generating queries, etc

  // TODO api to see which metrics are available
  // TODO private API for dash utilities

  app.get('/pcpdash/metric', function(req,res) {

    // Easily request the values of particular metrics
    // Optionally provide a host, by default will do all hosts
    
    if (!req.query.q) {
      res.send('Invalid query');
      return;
    }
    
    var q = queue();

    var ctx = {
      metric: req.query.q,
      host: !req.query.h ? '.*' : req.query.h
    };

    q.defer(request_pcpdash.getHosts, ctx);

    q.await(function(err, hosts) {
      
      if (err) {
        //TODO better error handling?
        res.send(err);
        console.log(colors.error(err));
        return;
      }
      
      //console.log('hosts', hosts);

      q = queue();
      
      q.defer(request_pcpdash.getArchives, hosts);
      
      q.await(function (err, archives) {
          
        if (err) {
          //TODO better error handling?
          res.send(err);
          return;
        }
        
        //console.log('archives', archives);
        
        q = queue();
        
        q.defer(pmweb.getContexts, archives);
        
        q.await(function(err, contexts) {
          //console.log('contexts', contexts);
          
          q = queue();
          
          q.defer(pmweb.getMetrics, {metric: ctx.metric, archives: archives});
          
          q.await(function(err, metrics) {
            //console.log('metrics', metrics);
            res.send(metrics);
          });
        });
      });
    });
  });


  app.get('/pcpdash/hosts', function(req,res) {
    // TODO move to pcpdash file
    // TODO catch errors when reading file
    var data = fs.readFileSync(config_pmmgr.config+ '/target-host', {encoding: 'ascii'});
    var arr = data.split(/\n/g);
    arr = arr.filter(function(i) {
      return i != '';
    });
    
    res.send(JSON.stringify({hosts: arr}));
  });

  // Provide a list of archives in order to create PMWEBAPI contexts
  app.get('/pcpdash/archives', function(req,res) {
    fswalk.walkSync(config_pmmgr.archives, function(err, files) {
      if (err) {
        res.send(err);
        return;
      }
      
      var hostData = {};
      var hosts = [];
      
      var regexMeta = /(.*)\/(.*)\/(.*?)(\.meta)$/g;
      
      files.forEach(function(f) {
        var match = regexMeta.exec(f);
        if (match) {
            var h = {name: match[2], 
                     archive: {name: match[3], path: match[2]+'/'+match[3]+match[4]}
                    };
                     
            var st = fs.statSync(f);
            
            h.date = st.mtime;
        
      if (hostData[h.name] == undefined) {
        hostData[h.name] = [];
        hosts.push(h.name);
      }
      
      hostData[h.name].push({name: h.archive.path, date: h.date});
        }
      });
      
      hosts.forEach(function(h) {
      // sorted from newest to oldest
      hostData[h].sort(function(a,b) {
        return b.date.valueOf() - a.date.valueOf();
      });
    });
      
      res.send(JSON.stringify({"archives": hostData}));
    });
  });

};
