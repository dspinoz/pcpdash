var spawn = require('child_process').spawn;
var dgram = require('dgram');

var utils = require('../utils/pcpdash');
var statsd = require('../config/statsd');

var root = '/api/v1';

module.exports = function(app) {

  // REST API v1.0 ===========================================
  //TODO support express 4 router
  
  app.get(root + '/hello', function(req,res) {
    res.send('HELLO WORLD');
  });
  
  app.get(root + '/hello/:id/:name', function(req,res) {
    res.send('HELLO '+ req.params.name + ' ('+req.params.id+')');
  });
  
  app.delete(root+'/hello/:id', function(req,res) {
    res.send('GOODBYE ' + req.params.id);
  });


  // send events to statsd listener
  // TODO consistent interface for submitting events via various schemes, ie statsd, cube, database
  // TODO interface for database
  
  // TODO support range of metric types as defined by statsd
  //   https://github.com/etsy/statsd/
  app.post(root+'/add/statsd/:name/:type/:val', function(req,res){
    //TODO support statsd host ip
    var statsdHOST = '127.0.0.1';

    var message = new Buffer(req.params.name+':'+req.params.val+'|'+req.params.type);

    var client = dgram.createSocket('udp4');
    client.send(message, 0, message.length, statsd.port, statsdHOST, function(err, bytes) {
        if (err) throw err;
        console.log('UDP message sent to ' + statsdHOST +':'+ statsd.port);
        client.close();
    });

    res.send('ok');
  });
  
  
  app.get(root+'/hosts', function(req,res) {
    var arr = utils.hosts();
    res.send(JSON.stringify({hosts: arr}));
  });
  
  app.get(root+'/archives', function(req,res) {
    utils.archives(function(err,arr) {
      if(err) {
        res.send(err);
        return;
      }
      
      res.send(JSON.stringify({archives: arr}));
    });
  });
  
  //TODO /metrics/:host/:metric (auto get latest archive)
  
  app.get(root+'/metrics/:host', function(req,res) {
    utils.metrics(req.params.host, null, null, function(err,data) {
      if (err) {
        res.status(err.code);
        res.send(err);
        return;
      }
      
      res.send(JSON.stringify({metrics: data}));
    });
  });
  
  app.get(root+'/metrics/:host/:archive', function(req,res) {
    utils.metrics(req.params.host, req.params.archive, null, function(err,data) {
      if (err) {
        res.status(err.code);
        res.send(err);
        return;
      }
      
      res.send(JSON.stringify({metrics: data}));
    });
  });
  
  app.get(root+'/metrics/:host/:archive/:metric', function(req,res) {
    utils.metrics(req.params.host, req.params.archive, req.params.metric, function(err,data) {
      if (err) {
        res.status(err.code);
        res.send(err);
        return;
      }
      
      res.send(JSON.stringify({metrics: data}));
    });
  });
  
  // TODO allow specifying instance. careful with instances that contain slashes - eg. filesys.free["/dev/sda1"]
  
  
  app.get(root+'/summary/:host/:metric', function(req,res) {
    
    utils.summary(req.params.host, null, req.params.metric, function(err,data) {
      if (err) {
        res.status(err.code);
        res.send(err);
        return;
      }
      
      res.send(data);
    });
  });

  app.get(root+'/values/:host/:metric', function(req,res) {
    
    utils.values(req.params.host, null, req.params.metric, function(err,data) {
      if (err) {
        res.status(err.code);
        res.send(err);
        return;
      }
      
      res.send(data);
    });
  });
  
  // TODO allow specifying instance. careful with instances that contain slashes - eg. filesys.free["/dev/sda1"]
  
  app.get(root+'/values/:host/:archive/:metric', function(req,res) {
    
    console.log(req.params, req.query);
    
    utils.values(req.params.host, req.params.archive, req.params.metric, function(err,data) {
      if (err) {
        res.status(err.code);
        res.send(err);
        return;
      }
      
      res.send(data);
    });
  });
  
  //TODO allow /values/:metric - get metrics for all hosts
  
  //TODO statsd socket.io interface for streaming statsd packets

};
