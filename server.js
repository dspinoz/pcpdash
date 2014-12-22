#!/usr/bin/env node

// TODO better logging (with levels and timestamps?)

// modules =============================================================
var express = require('express');
var request = require('request');
var app     = express();
var colors  = require('colors');

// configuration =======================================================
  
var pcpdash = require('./app/pcpdash');
var config = require('./config/pcpdash');
var config_colors = require('./config/colors');
    
config_colors(colors);

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

    
// routes ==============================================================

pcpdash(app);

// services ========================================================
// TODO launch statsd

var statsd = require('./spawn/statsd');
var pmmgr = require('./spawn/pmmgr');
var pmwebd = require('./spawn/pmwebd');
var cube_collector = require('./spawn/cube-collector');
var cube_evaluator = require('./spawn/cube-evaluator');

statsd.launch();
pmmgr.launch();
pmwebd.launch();
cube_collector.launch();
cube_evaluator.launch();

// pcpdash services ====================================================

// TODO launch pcp2cube.js
// TODO provide statsd2cube.js

// start app ===========================================================

app.listen(config.port, function() { // startup our app at http://localhost:port
  console.log(colors.debug("listening..."));
});

console.log(colors.info('Magic happens on port ' + config.port)); // shoutout to the user
exports = module.exports = app; 						   // expose app

// signal handling =====================================================

process.on('SIGINT', function() {

  statsd.kill();
  pmmgr.kill();
  pmwebd.kill();
  cube_collector.kill();
  cube_evaluator.kill();

  //TODO make sure all the services have stopped 
  process.exit(0);
});

process.on('exit', function(code) {
	console.log(colors.debug("Server shut down"));
});
