var request = require('request');

var pmwebd = require('../config/pmwebd');

module.exports = function(app) {

  // pcp webapi ==========================================================

  // TODO authentication 
  // TODO provide "easy" API for browser code to get metrics from archive
  // TODO remove security violation in config/pmwebd/run
  //      manage the available archives/hosts/metrics

  app.get('/pmapi/*', function(req,res) {
    // TODO log proxy requests to cube
    req.pipe(request('http://' +pmwebd.host +':'+ pmwebd.port + req.originalUrl)).pipe(res);
  });

};
