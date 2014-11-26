#!/usr/bin/env node

// TODO better logging (with levels and timestamps?)

// modules =============================================================
var express = require('express');
var request = require('request');
var app     = express();
var spawn   = require('child_process').spawn;
var colors  = require('colors');

// configuration =======================================================
  
var pcpdash = require('./app/pcpdash');
var config = require('./config/pcpdash');
    
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
  
  pmmgr: 'magenta',
  pmwebd: 'red',
  cube_collector: 'blue',
  cube_evaluator: 'cyan'
});
    
// routes ==============================================================

pcpdash(app);

// pcp services ========================================================

console.log(colors.info('Launching pmmgr'));

// TODO check pmlogger.log files for errors
// TODO check pmlogger.log files for full list of available metrics 
//      within the PMNS(4)
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

//TODO specify collector port, see config
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

//TODO specify evaluator port, see config
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

// start app ===========================================================

app.listen(config.port, function() { // startup our app at http://localhost:port
  console.log(colors.debug("listening..."));
});

console.log(colors.info('Magic happens on port ' + config.port)); // shoutout to the user
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
