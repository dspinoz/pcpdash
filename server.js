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

// start app ===============================================

app.listen(port, function() { // startup our app at http://localhost:port
  console.log("listening...");
});

console.log('Magic happens on port ' + port); // shoutout to the user
exports = module.exports = app; 						  // expose app

