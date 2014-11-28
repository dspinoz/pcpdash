var utils = require('../utils/pcpdash');

var root = '/api/v1';

module.exports = function(app) {

  // REST API v1.0 ===========================================
  //TODO support express 4 router
  
  app.get(root + '/hello', function(req,res) {
    res.send('HELLO WORLD');
  });
  
  app.get(root + '/hello/:id/:name', function(req,res) {
    res.send('HELLO '+ req.params.name + ' ('+req.params.id+')');
  });
  
  app.delete(root+'/hello/:id', function(req,res) {
    res.send('GOODBYE ' + req.params.id);
  });
  
  
  app.get(root+'/hosts', function(req,res) {
    var arr = utils.hosts();
    res.send(JSON.stringify({hosts: arr}));
  });
  
  app.get(root+'/archives', function(req,res) {
    utils.archives(function(err,arr) {
      if(err) {
        res.send(err);
        return;
      }
      
      res.send(JSON.stringify({archives: arr}));
    });
  });

};
