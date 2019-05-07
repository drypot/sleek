'use strict';

const fs = require('fs');
const minimist = require('minimist');
const init = require('../base/init');
const config = exports;

config.dev = process.env.NODE_ENV != 'production';

init.add((done) => {
  config.argv = minimist(process.argv.slice(2));
  var path = config.path || config.argv.config || config.argv.c;
  if (typeof path == 'string') {
    console.log('config: path=' + path);
    fs.readFile(path, 'utf8', function (err, data) {
      if (err) return done(err);
      var _config = JSON.parse(data);
      for(var p in _config) {
        config[p] = _config[p];
      }
      done();
    });
  } else {
    process.stdout.write('config file not found.\n');
    process.stdout.write('\n');
    process.stdout.write('node some.js --config config.json\n');
    process.stdout.write('node some.js -c config.json\n');
    process.exit(-1);
  }
});
