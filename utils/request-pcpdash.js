// Make requests to self

var request = require('request');
var config = require('../config/pcpdash');

exports.getHosts = function getHosts(info, callback) {
        
  request({url: 'http://localhost:'+config.port+'/pcpdash/hosts', json: true}, function(err,resp,json) {
    
    // TODO error handling
    
    var hosts = [];
    var regex = new RegExp(info.host);
    
    json.hosts.forEach(function(h) {
      var match = regex.exec(h);
      if (match) {
        hosts.push(match[0]);
      }
    });
    
    callback(null,hosts);
  });
};

exports.getArchives = function(hosts, callback) {
  request({url: 'http://localhost:'+config.port+'/pcpdash/archives', json: true}, function(err,resp,json) {
    
    var archives = [];
    
    hosts.forEach(function(h) {
      var a = json.archives[h];
      
      if (!a) {
        return;
      }
      
      // value from newest archive
      archives.push({host: h, file: a[0].name});
    });
    
    callback(null,archives);
  });
};



