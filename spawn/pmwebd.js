var colors = require('colors');
var spawn  = require('child_process').spawn;

var pmwebd = undefined;
  
module.exports.launch = function(app) {
  
  console.log(colors.info('Launching pmwebd'));

  pmwebd = spawn('./run', [], {cwd: './config/pmwebd'});

  pmwebd.on('close', function(code) {
    console.log(colors.info("pmwebd exited " + code));
  });

  pmwebd.stderr.on('data', function(d) {
    console.log(colors.debug(d.toString().replace(/(\r\n|\n|\r)/gm,"")));
  });

  pmwebd.stdout.on('data', function(d) {
    console.log(colors.pmwebd(d.toString().replace(/(\r\n|\n|\r)/gm,"")));
  });
  
  pmwebd.on('error', function(err) {
    console.log(colors.error('PMWEBD: ') + colors.error(err));
  });

};

module.exports.kill = function(signal) {
  if (pmwebd) {
    pmwebd.kill(signal ? signal : "SIGINT");
  }
};
