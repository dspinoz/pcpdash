var fs = require('fs');

var fswalk  = require('./fswalk');

var config_pmmgr = require('../config/pmmgr');

// Provide a list of hosts
module.exports.hosts = function() {
  // TODO catch errors when reading file
  var data = fs.readFileSync(config_pmmgr.config+ '/target-host', {encoding: 'ascii'});
  var arr = data.split(/\n/g);
  arr = arr.filter(function(i) {
    return i != '';
  });
  
  return arr;
};

// Provide a list of archives in order to create PMWEBAPI contexts
module.exports.archives = function(callback) {
  fswalk.walkSync(config_pmmgr.archives, function(err, files) {

    if (err) {
      callback(err,null);
      return;
    }

    var hostData = {};
    var hosts = [];

    var regexMeta = /(.*)\/(.*)\/(.*?)(\.meta)$/g;

    files.forEach(function(f) {
      var match = regexMeta.exec(f);
      if (match) {
        var h = {
          name: match[2], 
          archive: {name: match[3], path: match[2]+'/'+match[3]+match[4]}
        };
        
        // TODO use pmdumplog -l to show archive information

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
    
    callback(null,hostData);
  });
};


