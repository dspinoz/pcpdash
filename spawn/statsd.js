var colors = require('colors');
var spawn  = require('child_process').spawn;

var cube = undefined;
  
module.exports.launch = function(app) {
  
  //TODO use the cube library and instantiate here
  //TODO specify collector port, see config
  
  var cube = spawn('/usr/bin/cube-collector'); //TODO use system or in node_modules

  cube.on('close', function(code) {
    console.log(colors.info("cube-collector exited " + code));
  });

  cube.stderr.on('data', function(d) {
    console.log(colors.debug(d.toString().replace(/(\r\n|\n|\r)/gm,"")));
  });

  cube.stdout.on('data', function(d) {
    console.log(colors.cube_collector(d.toString().replace(/(\r\n|\n|\r)/gm,"")));
  });
  
  cube.on('error', function(err) {
    console.log(colors.error('CUBE COLLECTOR: ') + colors.error(err));
  });

};

module.exports.kill = function(signal) {
  if (cube) {
    cube.kill(signal ? signal : "SIGINT");
  }
};
/usr/lib/node_modules/statsd/bin/statsd config/statsd.js
