var should = require('should');

var init = require('../base/init');
var error = require('../base/error');
var config = require('../base/config')({ path: 'config/sleek-test.json' });
var express = require('../main/express');

require('../main/hello-api');

before(function (done) {
  init.run(done);
});

before(function(done) {
  express.listen();
  done();
});

describe("/api/hello", function () {
  it("should return 'hello'", function (done) {
    express.get('/api/hello', function (err, res) {
      should(!err);
      should(!res.error);
      res.should.be.json;
      res.body.name.should.equal(config.data.appName);
      var stime = parseInt(res.body.time || 0);
      var ctime = Date.now();
      should(stime <= ctime);
      should(stime >= ctime - 100);
      done();
    });
  });
});
