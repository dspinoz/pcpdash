var fs = require('fs');
var spawn = require('child_process').spawn;
var readline = require('readline');
var queue   = require('queue-async');

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

module.exports.archives = function(callback) {
  fswalk.walkSync(config_pmmgr.archives, function(err, files) {

    if (err) {
      callback(err,null);
      return;
    }

    var q = queue();
    var regexMeta = /(.*)\/(.*)\/(.*?)(\.meta)$/g;

    files.forEach(function(f) {
      var match = regexMeta.exec(f);
      if (match) {
        q.defer(
          function(arch, callback) {
            
            var path = config_pmmgr.archives + '/' + arch.path;
            
            var pmdumplog = spawn('pmdumplog', ['-l', path]);
            
            readline.createInterface(
              {
                input: pmdumplog.stdout,
                terminal: false
              }).on('line', function(line) {
                
                // TODO optimize with only one regex per line
                var match = /Performance metrics from host (.*)$/.exec(line);
                if (match) {
                  arch.host = match[1];
                  return;
                }
                
                var match = /commencing\s+(.*)$/.exec(line);
                if (match) {
                  arch.start = new Date(match[1]);
                  return;
                }
                
                var match = /ending\s+(.*)$/.exec(line);
                if (match) {
                  arch.end = new Date(match[1]);
                  return;
                }
              });
    
            pmdumplog.stderr.on('data', function(data) {
              console.log('PMDUMPLOG: ' + data);
            });
    
            pmdumplog.on('close', function(code) {
              if (code != 0) {
                callback({error: 'error running pmdumplog', code: code}, null);
                return;
              }
              
              callback(null,arch);
            });
          }, 
          {
            host: match[2],
            name: match[3], 
            path: match[2]+'/'+match[3]+match[4]
          });
      }
    });
    
    q.awaitAll(function(err, all) {
      callback(null,all);
    });

  });
};

function priv_get_metrics(host,archive,metric,callback) {
  
  var path = config_pmmgr.archives + '/' + host + '/' + archive + '.meta';
  
  try {
    // verify exists, throws Error
    var st = fs.statSync(path);
    
    var out = '';
    
    var args = ['-a', path];
    
    if (metric) {
      args.push(metric);
    }
    
    var pminfo = spawn('pminfo', args);
    
    pminfo.stdout.on('data', function(data) {
      out += data;
    });
    
    pminfo.stderr.on('data', function(data) {
      console.log('PMINFO: ' + data);
    });
    
    pminfo.on('close', function(code) {
      if (code != 0) {
        callback({error: 'error running pminfo', code: code}, null);
        return;
      }
      
      var lines = out.split(/\n/g);
      
      lines = lines.filter(function(i) {
        return i != '';
      });
      
      callback(null,lines);
    });
    
  } catch (Error) {
    callback({code:404, message:Error},null);
  }
};

module.exports.metrics = function(host,archive,metric,callback) {
  
  if (!archive) {
    // determine latest available archive for the host
    
    var arch = null;
    
    module.exports.archives(function(err,archives) {
      archives.forEach(function(a) {
        if (a.host == host) {
          if (!arch) {
            arch = a;
            arch.end_d = new Date(arch.end);
          }
          else
          {
            a.end_d = new Date(a.end);
            
            if (arch.end_d.valueOf() < a.end_d.valueOf()) {
              arch = a;
            }
          }
        }
      });
      
      if (!arch) {
        callback({message: "No archive available", code: 304},null);
        return;
      }
      
      archive = arch.name;
      
      //TODO reuse code
      priv_get_metrics(host,archive,metric,callback);
    });
      
    return;
  }

  priv_get_metrics(host,archive,metric,callback);
};

function priv_get_values(host,archive,metric,callback) {
  
  var path = config_pmmgr.archives + '/' + host + '/' + archive + '.meta';
  
  try {
    // verify exists, throws Error
    var st = fs.statSync(path);
    
    var out = '';
    
    var pmdumptext = spawn('pmdumptext', ['-H', '-d', ',', '-a', path, metric]);
    
    pmdumptext.stdout.on('data', function(data) {
      out += data;
    });
    
    pmdumptext.stderr.on('data', function(data) {
      console.log('PMDUMPTEXT: ' + data);
    });
    
    pmdumptext.on('close', function(code) {
      if (code != 0) {
        callback({error: 'error running pmdumptext', code: code}, null);
        return;
      }
      
      //TODO just get the latest value from the archive
      //TODO allow multiple metrics to get values from (not just sub-types)
      //TODO parse the first line and remove archive path
      //TODO show host name? show archive when pulled values from many
      var reg = new RegExp(path+'/',"g");
      out = out.replace(reg,''); 
      
      callback(null,out);
    });
    
  } catch (Error) {
    callback({code:404, message:Error},null);
  }
};

// get the latest values for provided metric in CSV format
//TODO api to get latest values
// pmlogsummary -H -F logs/pmmgr/localhost.localdomain/archive-20141204.134329.meta filesys



module.exports.values = function(host,archive,metric,callback) {
  
  if (!archive) {
    // determine latest available archive for the host
    
    var arch = null;
    
    module.exports.archives(function(err,archives) {
      archives.forEach(function(a) {
        if (a.host == host) {
          if (!arch) {
            arch = a;
            arch.end_d = new Date(arch.end);
          }
          else
          {
            a.end_d = new Date(a.end);
            
            if (arch.end_d.valueOf() < a.end_d.valueOf()) {
              arch = a;
            }
          }
        }
      });
      
      if (!arch) {
        callback({message: "No archive available", code: 304},null);
        return;
      }
      
      archive = arch.name;
      
      priv_get_values(host,archive,metric,callback);
    });
    
    return;
  }
  
  priv_get_values(host,archive,metric,callback);
};

// Provide a list of archives in order to create PMWEBAPI contexts
module.exports.archives_by_host = function(callback) {
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


