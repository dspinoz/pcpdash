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
     
//TODO configurable contexts to fetch and submit
//TODO configurable host
//TODO configurable metrics
var ctxs = [{
  h: ".*", 
  q: "filesys.free" 
},
{
  h: ".*",
  q: "filesys.capacity"
},
{
  h: ".*",
  q: "filesys.mountdir"
},
{
  h: ".*",
  q: "filesys.blocksize"
},
{
  h: ".*",
  q: "kernel.all.load"
}];

var client = cube.emitter("ws://localhost:1080"); //TODO specify cube host/port
    
function getMetrics(ctx, callback) {
  
  var events = [];
  
  //TODO request to pmwebd not local server
  //TODO use private api to only pull the latest metrics
  //TODO handle same events at the same time (duplicates!? - matching multiple contexts)
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
        
        // just for fun
        events.push({
          type: "random",
          time: new Date(),
          data: {random: Math.random()}
        });
      });
    });
  
    callback(null, events);
  });
}
    
var getData = function() {

  var q = queue();
  
  ctxs.forEach(function(ctx) {
    q.defer(getMetrics, ctx);
  });

  q.awaitAll(function(err, eventSets) {
    
    if (err) {
      console.log(err);
      return;
    }
    
    if (!eventSets.length) {
      console.log("No PCP event sets for cube");
      return;
    }
    
    eventSets.forEach(function(events) {
      
      if (!events.length) {
        console.log("No PCP events for cube");
        return;
      }
    
      var map = {};
      
      events.forEach(function(e) {
        if (!map[e.type]) {
          map[e.type] = 1;
        }
        else
        {
          map[e.type]++;
        }
      });
      
      Object.keys(map).forEach(function(t) {
        console.log("Writing " + map[t] + " " + t + " events to cube..."); //TODO log consistent with cube emitter (put timestamp)
      });
      
      events.forEach(function(e) {
        //console.log(JSON.stringify(e, false, ' '));
        client.send(e);
      });
    });
  });
};

// TODO match interval to pmlogger interval
getData();
var interval = setInterval(getData, 10000);


// signal handling =====================================================

process.on('SIGINT', function() {

  clearInterval(interval);
  client.close();

  process.exit(0);
});

