'use strict';

const fs = require('fs');
const minimist = require('minimist');
const init = require('../base/init');
const config = exports;

config.dev = process.env.NODE_ENV != 'production';

init.add(function (done) {
  config.argv = minimist(process.argv.slice(2));
  var path = config.path || config.argv.config || config.argv.c;
  if (path) {
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
    done();
  }
});
