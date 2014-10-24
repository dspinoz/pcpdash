#!/usr/bin/env node

// modules =================================================
var express = require('express');
var request = require('request');
var app     = express();

// configuration ===========================================
  
var port = process.env.PORT || 8080; // set our port

app.configure(function() {
  
  // the order of app middleware is important - invoked sequentially!
  app.use(express.logger('dev')); // log every request to the console
  
  app.use(express.static(__dirname + '/public')); 	// set the static files location
  //app.use(express.logger('dev')); 					      // log only non-public content
});

// routes to PCP Web API ===========================================

var pcpHost = 'localhost',
    pcpPort = 44323;
    
// static files  ==================================================

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

// start app ===============================================

app.listen(port, function() { // startup our app at http://localhost:port
  console.log("listening...");
});

console.log('Magic happens on port ' + port); // shoutout to the user
exports = module.exports = app; 						  // expose app

