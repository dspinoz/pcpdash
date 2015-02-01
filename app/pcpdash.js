var queue   = require('queue-async'); //TODO create rpm

var config = require('../config/pcpdash');

var utils   = require('../utils/pcpdash');
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

  app.get('/', function(req,res) {
    res.render('index', {title: config.title, current: req.path, pages: config.pages});
  });
  
  app.get('/index', function(req,res) {
    res.render('index', {title: config.title, current: req.path, pages: config.pages});
  });
  
  app.get('/new', function(req,res) {
    console.log('zzz');
    res.render('new', {title: config.title, current: req.path, pages: config.pages}); 

/*
,function(er,ht){
if (er) {console.log('err jjj',er); return er;}
console.log('jjj',ht);
return ht;
});
*/
  });

  app.get('/test', function(req,res) {
    res.render('test', {title: config.title, current: req.path, pages: config.pages});
  });

/*
  app.get('/baby', function(req,res) {
    res.render('baby', {title: config.title, current: req.path, pages: config.pages});
  });
*/
  app.get('/baby', function(req,res) {
    res.sendfile('views/baby.html');
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

  app.get('/statsd', function(req,res) {
    res.render('statsd', {title: config.title, current: req.path, pages: config.pages});
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
    var arr = utils.hosts();
    res.send(JSON.stringify({hosts: arr}));
  });

  app.get('/pcpdash/archives', function(req,res) {
    utils.archives(function(err,arr) {
      res.send(JSON.stringify({archives: arr}));  
    });
  });

};
