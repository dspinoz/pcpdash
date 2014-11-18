#!/usr/bin/env node

// modules =============================================================
var request = require('request');
var cube    = require('cube');
var queue   = require('queue-async'); //TODO create rpm
var pmweb   = require('./utils/request-pmweb');
var pcpdash = require('./utils/request-pcpdash');

// configuration =======================================================

var port = process.env.PORT || 8080; // set our port 
                                     // TODO pmwebd port
                                         
var ctx = {
  h: ".*", //TODO configurable host
  q: "kernel.all.load" //TODO configurable metric
};

var client = cube.emitter("ws://localhost:1080"); //TODO specify cube host/port
    
var getData = function() {

  var q = queue();

  q.defer(function(info, callback) {
    
    var events = [];
    
    //TODO request to pmwebd not local server
    //TODO use private api to only pull the latest metrics
    request({url: 'http://localhost:'+port+"/pcpdash/metric?q="+ctx.q+"&h="+ctx.h, json: true}, 
            function(err,resp,json) {
              
      if (err) {
        console.log(err);
        callback(err, null);
        return;
      }
      
      if (!json) {
        callback({message: 'no json'}, null);
        return;
      }
      
      json.forEach(function(archive) {
        
        if (!archive.metric.values) {
          console.log('No values for ' + archive.host + ':' + archive.metric.name);
          return;
        }
        
        archive.metric.values.forEach(function(value) {
          
          // host-specific
          events.push({
            type: archive.host,
            time: new Date(value.timestamp.date),
            data: {
              metric: archive.metric.info.name,
              values: value.values[0].instances, //TODO support more values
              instances: archive.metric.instances
            }
          });
          
          // metric-specific
          events.push({
            type: archive.metric.info.name,
            time: new Date(value.timestamp.date),
            data: {
              host: archive.host,
              values: value.values[0].instances, //TODO support more values
              instances: archive.metric.instances
            }
          });
          
          events.push({
            type: "random",
            time: new Date(),
            data: {random: Math.random()}
          });
        });
      });
    
      callback(null, events);
    });
    
  }, null);

  q.await(function(err, events) {
    
    if (err) {
      console.log(err);
      return;
    }
    
    if (!events.length) {
      console.log("No PCP events for cube");
      return;
    }
    
    console.log("Writing " + events.length + " events to cube..."); //TODO log consistent with cube emitter (put timestamp)
    
    events.forEach(function(e) {
      //console.log(JSON.stringify(e, false, ' '));
      client.send(e);
    });
  });
};

var interval = setInterval(getData, 10000);


// signal handling =====================================================

process.on('SIGINT', function() {

  clearInterval(interval);
  client.close();

  process.exit(0);
});

