var colors = require('colors');
var spawn  = require('child_process').spawn;

var pmmgr = undefined;
  
module.exports.launch = function(app) {
  
  console.log(colors.info('Launching pmmgr'));

  // TODO check pmlogger.log files for errors
  // TODO check pmlogger.log files for full list of available metrics 
  //      within the PMNS(4)
  pmmgr = spawn('./run', [], {cwd: './config/pmmgr'});

  pmmgr.on('close', function(code) {
    console.log(colors.info("pmmgr exited " + code));
  });
  
  pmmgr.on('error', function(err) {
    console.log(colors.error('PMMGR: ') + colors.error(err));
  });

  pmmgr.stderr.on('data', function(d) {
    console.log(colors.debug(d.toString().replace(/(\r\n|\n|\r)/gm,"")));
  });

  pmmgr.stdout.on('data', function(d) {
    console.log(colors.pmmgr(d.toString().replace(/(\r\n|\n|\r)/gm,"")));
  });

};

module.exports.kill = function(signal) {
  if (pmmgr) {
    pmmgr.kill(signal ? signal : "SIGINT");
  }
};
