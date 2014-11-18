#!/usr/bin/env node

// TODO better logging (with levels and timestamps?)

// modules =============================================================
var express = require('express');
var request = require('request');
var fs      = require('fs');
var path    = require('path');
var app     = express();
var fswalk  = require('./utils/fswalk');
var pmweb   = require('./utils/request-pmweb');
var pcpdash = require('./utils/request-pcpdash');
var spawn   = require('child_process').spawn;
var queue   = require('queue-async'); //TODO create rpm
var colors  = require('colors');

// configuration =======================================================
  
var port = process.env.PORT || 8080; // set our port

var pcpHost = process.env.PCPHOST || 'localhost', 
    pcpPort = process.env.PCPPORT || 44324; // custom pcp web service
    
var archiveDir = process.env.ARCHIVE_DIR || 'logs/pmmgr',
    configDir  = process.env.PMMGR_CONFIG_DIR || 'config/pmmgr';
    
var pcpdash_pages = [ {title: 'Index', href:'/index'}, 
					  {title: 'Testing', href:'/test'},
					  {title: 'Fetch', href:'/fetch'}, 
					  {title: 'Bar Chart', href:'/bar'} ];
    
app.configure(function() {
  
  // the order of app middleware is important - invoked sequentially!
  app.use(express.logger('dev')); // log every request to the console
  
  app.use(express.static(__dirname + '/public')); 	// set the static files location
  //app.use(express.logger('dev')); 					      // log only non-public content
  //app.use(express.errorHandler());
  
  //pretty print templated resources
  app.locals.pretty = true;
  
  app.set('view engine', 'jade');
  app.set('views', __dirname + '/views');
});

colors.setTheme({
  silly: 'rainbow',
  input: 'grey',
  verbose: 'cyan',
  prompt: 'grey',
  info: 'green',
  data: 'grey',
  help: 'cyan',
  warn: 'yellow',
  debug: 'blue',
  error: 'red',
  
  pmmgr: 'white',
  pmwebd: 'white',
  cube_collector: 'white',
  cube_evaluator: 'white'
});
    
// jade-templated files  ====================================================

app.get('/index', function(req,res) {
	res.render('index', {title: 'PCPDash', current: req.path, pages: pcpdash_pages});
});

app.get('/test', function(req,res) {
	res.render('test', {title: 'PCPDash', current: req.path, pages: pcpdash_pages});
});

app.get('/fetch', function(req,res) {
	res.render('fetch', {title: 'PCPDash', current: req.path, pages: pcpdash_pages});
});

app.get('/bar', function(req,res) {
	res.render('bar', {title: 'PCPDash', current: req.path, pages: pcpdash_pages});
});

    
// static files  =======================================================

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

console.log(colors.info('Launching pmmgr'));

var pmmgr = spawn('./run', [], {cwd: './config/pmmgr'});

pmmgr.on('close', function(code) {
	console.log(colors.info("pmmgr exited " + code));
	process.kill(process.pid, 'SIGINT'); //kill self
});

pmmgr.stderr.on('data', function(d) {
	console.log(colors.debug(d.toString().replace(/(\r\n|\n|\r)/gm,"")));
});

pmmgr.stdout.on('data', function(d) {
	console.log(colors.pmmgr(d.toString().replace(/(\r\n|\n|\r)/gm,"")));
});

console.log(colors.info('Launching pmwebd'));

var pmwebd = spawn('./run', [], {cwd: './config/pmwebd'});

pmwebd.on('close', function(code) {
	console.log(colors.info("pmwebd exited " + code));
	process.kill(process.pid, 'SIGINT'); //kill self
});

pmwebd.stderr.on('data', function(d) {
	console.log(colors.debug(d.toString().replace(/(\r\n|\n|\r)/gm,"")));
});

pmwebd.stdout.on('data', function(d) {
	console.log(colors.pmwebd(d.toString().replace(/(\r\n|\n|\r)/gm,"")));
});

// cube services =======================================================

//TODO use the cube library and instantiate here

var cube_collector = spawn('/usr/bin/cube-collector');

cube_collector.on('close', function(code) {
	console.log(colors.info("cube-collector exited " + code));
	process.kill(process.pid, 'SIGINT'); //kill self
});

cube_collector.stderr.on('data', function(d) {
	console.log(colors.debug(d.toString().replace(/(\r\n|\n|\r)/gm,"")));
});

cube_collector.stdout.on('data', function(d) {
	console.log(colors.cube_collector(d.toString().replace(/(\r\n|\n|\r)/gm,"")));
});

var cube_evaluator = spawn('/usr/bin/cube-evaluator');

cube_evaluator.on('close', function(code) {
	console.log(colors.info("cube-collector exited " + code));
	process.kill(process.pid, 'SIGINT'); //kill self
});

cube_evaluator.stderr.on('data', function(d) {
	console.log(colors.debug(d.toString().replace(/(\r\n|\n|\r)/gm,"")));
});

cube_evaluator.stdout.on('data', function(d) {
	console.log(colors.cube_evaluator(d.toString().replace(/(\r\n|\n|\r)/gm,"")));
});

// pcpdash services ====================================================

// TODO launch pcp2cube.js

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

	q.defer(pcpdash.getHosts, ctx);

	q.await(function(err, hosts) {
	  
    if (err) {
      //TODO better error handling?
      res.send(err);
      console.log(colors.error(err));
      return;
    }
    
	  //console.log('hosts', hosts);

    q = queue();
    
    q.defer(pcpdash.getArchives, hosts);
    
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
  console.log(colors.debug("listening..."));
});

console.log(colors.info('Magic happens on port ' + port)); // shoutout to the user
exports = module.exports = app; 						   // expose app

// signal handling =====================================================

process.on('SIGINT', function() {

  pmmgr.kill("SIGINT");
  pmwebd.kill("SIGINT");

  //TODO make sure all the services have stopped 
  process.exit(0);
});

process.on('exit', function(code) {
	console.log(colors.debug("Server shut down"));
});
