var request = require('request');

var cube = require('../config/cube-evaluator');

module.exports = function(app) {

  // cube webapi ===========================================
      
  app.get('/types', function(req,res) {
    req.pipe(request('http://' +cube.host +':'+ cube.port+ '/1.0' + req.originalUrl)).pipe(res);
  });

  app.get('/metric', function(req,res) {
    req.pipe(request('http://' +cube.host +':'+ cube.port+ '/1.0' + req.originalUrl)).pipe(res);
  });

  app.get('/event', function(req,res) {
    req.pipe(request('http://' +cube.host +':'+ cube.port+ '/1.0' + req.originalUrl)).pipe(res);
  });

};
