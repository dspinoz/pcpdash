var colors = require('colors');
var spawn  = require('child_process').spawn;

var cube = undefined;
  
module.exports.launch = function(app) {
  
  //TODO use the cube library and instantiate here
  //TODO specify evaluator port, see config
  
  cube = spawn('/usr/bin/cube-evaluator'); //TODO use system or in node_modules

  cube.on('close', function(code) {
    console.log(colors.info("cube-evaluator exited " + code));
  });

  cube.stderr.on('data', function(d) {
    console.log(colors.debug(d.toString().replace(/(\r\n|\n|\r)/gm,"")));
  });

  cube.stdout.on('data', function(d) {
    console.log(colors.cube_evaluator(d.toString().replace(/(\r\n|\n|\r)/gm,"")));
  });

};

module.exports.kill = function(signal) {
  if (cube) {
    cube.kill(signal ? signal : "SIGINT");
  }
};
