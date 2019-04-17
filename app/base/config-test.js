'use strict';

var init = require('../base/init');
var config = require('../base/config')({ path: 'config/test.json' });
var assert = require('assert');
var assert2 = require('../base/assert2');

describe('config with valid path', function () {
  it('should succeed', function (done) {
    init.run(function (err) {
      assert.ifError(err);
      assert(config.appName !== undefined);
      assert(config.xxx === undefined);
      done();
    });
  });
});

