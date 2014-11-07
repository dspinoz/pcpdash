#!/usr/bin/env node

// modules =============================================================
var express = require('express');
var request = require('request');
var fs      = require('fs');
var app     = express();
var fswalk  = require('./utils/fswalk');
var spawn   = require('child_process').spawn;

// configuration =======================================================
  
var port = process.env.PORT || 8080; // set our port

var pcpHost = process.env.PCPHOST || 'localhost', 
    pcpPort = process.env.PCPPORT || 44324; // custom pcp web service
    
var archiveDir = process.env.ARCHIVE_DIR || 'logs/pmmgr',
    configDir  = process.env.PMMGR_CONFIG_DIR || 'config/pmmgr';
    
app.configure(function() {
  
  // the order of app middleware is important - invoked sequentially!
  app.use(express.logger('dev')); // log every request to the console
  
  app.use(express.static(__dirname + '/public')); 	// set the static files location
  //app.use(express.logger('dev')); 					      // log only non-public content
});

    
// static files  =======================================================

app.get('/test', function(req,res) {
  res.sendfile('test.json');
});

// TODO load minified in production environment

app.get('/jquery.js', function(req,res) {
  res.sendfile('bower_components/jquery/dist/jquery.js');
});

app.get('/bootstrap.js', function(req,res) {
  res.sendfile('bower_components/bootstrap/dist/js/bootstrap.js');
});

app.get('/bootstrap.css', function(req,res) {
  res.sendfile('bower_components/bootstrap/dist/css/bootstrap.css');
});

app.get('/bootstrap.css.map', function(req,res) {
  res.sendfile('bower_components/bootstrap/dist/css/bootstrap.css.map');
});

app.get('/fonts/glyphicons-halflings-regular.svg', function(req,res) {
  res.sendfile('bower_components/bootstrap/dist/fonts/glyphicons-halflings-regular.svg');
});

app.get('/fonts/glyphicons-halflings-regular.ttf', function(req,res) {
  res.sendfile('bower_components/bootstrap/dist/fonts/glyphicons-halflings-regular.ttf');
});

app.get('/fonts/glyphicons-halflings-regular.woff', function(req,res) {
  res.sendfile('bower_components/bootstrap/dist/fonts/glyphicons-halflings-regular.woff');
});

app.get('/d3.js', function(req, res) {
  res.sendfile('bower_components/d3/d3.js')
});

app.get('/queue.js', function(req, res) {
  res.sendfile('bower_components/queue-async/queue.js')
});

// pcp services ========================================================

var pmmgr = spawn('./run', [], {cwd: './config/pmmgr'});

pmmgr.on('close', function(code) {
	console.log("PMMGR exited " + code);
	process.kill(process.pid, 'SIGINT'); //kill self
});

var pmwebd = spawn('./run', [], {cwd: './config/pmwebd'});

pmwebd.on('close', function(code) {
	console.log("PMWEBD exited " + code);
	process.kill(process.pid, 'SIGINT'); //kill self
});

// pcpdash =============================================================
// Provides dashboard-specific requests 
// Often utilities in order to provide some extra metadata for 
// generating queries, etc

app.get('/pcpdash/hosts', function(req,res) {
  // TODO catch errors when reading file
  var data = fs.readFileSync(configDir+ '/target-host', {encoding: 'ascii'});
  var arr = data.split(/\n/g);
  arr = arr.filter(function(i) {
    return i != '';
  });
  
  res.send(JSON.stringify({hosts: arr}));
});

// Provide a list of archives in order to create PMWEBAPI contexts
app.get('/pcpdash/archives', function(req,res) {
  fswalk.walkSync(archiveDir, function(err, files) {
    if (err) {
      res.send(err);
      return;
    }
    
    var hostData = {};
    var hosts = [];
    
    var regexMeta = /(.*)\/(.*)\/(.*?)\.meta$/g;
    
    files.forEach(function(f) {
      var match = regexMeta.exec(f);
      if (match) {
          var h = {name: match[2], 
                   archive: {name: match[3], path: match[2]+'/'+match[3]}
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

// pcp webapi ==========================================================

// TODO authentication 
// TODO provide "easy" API for browser code to get metrics from archive
// TODO remove security violation in config/pmwebd/run
//      manage the available archives/hosts/metrics

app.get('/pmapi/*', function(req,res) {
  req.pipe(request('http://' +pcpHost +':'+ pcpPort + req.originalUrl)).pipe(res);
});

// start app ===========================================================

app.listen(port, function() { // startup our app at http://localhost:port
  console.log("listening...");
});

console.log('Magic happens on port ' + port); // shoutout to the user
exports = module.exports = app; 						  // expose app

// signal handling =====================================================

process.on('SIGINT', function() {

  pmmgr.kill("SIGINT");
  pmwebd.kill("SIGINT");

  process.exit(0);
});

process.on('exit', function(code) {
	console.log("Server shut down");
});
