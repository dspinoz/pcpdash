var colors = require('colors');
var spawn  = require('child_process').spawn;

var statsd = null;

module.exports.launch = function(app) {
  
  statsd = spawn('/usr/lib/node_modules/statsd/bin/statsd', ['config/statsd.js']);

  statsd.on('close', function(code) {
    console.log(colors.info("statsd exited " + code));
  });

  statsd.stderr.on('data', function(d) {
    console.log(colors.debug(d.toString().replace(/(\r\n|\n|\r)/gm,"")));
  });

  statsd.stdout.on('data', function(d) {
    console.log(colors.statsd(d.toString().replace(/(\r\n|\n|\r)/gm,"")));
  });
  
  statsd.on('error', function(err) {
    console.log(colors.error('STATSD: ') + colors.error(err));
  });

};

module.exports.kill = function(signal) {
  if (statsd) {
    statsd.kill(signal ? signal : "SIGINT");
  }
};
