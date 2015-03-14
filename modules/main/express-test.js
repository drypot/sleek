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
  var app = express.app;

  app.get('/test/no-action', function (req, res, done) {
    done();
  });

  app.get('/test/send-hello', function (req, res) {
    res.send('hello');
  });

  app.get('/test/send-invalid-data', function (req, res) {
    res.jsonErr(error(error.INVALID_DATA));
  });

  app.get('/api/send-empty', function (req, res) {
    res.json({});
  });

  express.listen();

  done();
});

describe("no end point test", function () {
  it("should return not found", function (done) {
    express.get('/no-action', function (err, res) {
      should(!err);
      res.should.status(404);
      done();
    });
  });
});

describe("return text test", function () {
  it("should return 'hello'", function (done) {
    express.get('/test/send-hello', function (err, res) {
      should(!err);
      should(!res.error);
      res.text.should.equal('hello');
      done();
    });
  });
});

describe("return error test", function () {
  it("should return rc", function (done) {
    express.get('/test/send-invalid-data').end(function (err, res) {
      should(!err);
      should(!res.error);
      res.should.be.json;
      res.body.err.rc.should.equal(error.INVALID_DATA);
      res.body.err.message.should.equal(error.msg[error.INVALID_DATA]);
      should(res.body.err.stack);
      done();
    });
  });
});

describe("Cache-Control test", function () {
  describe("/test/send-hello", function () {
    it("should return private", function (done) {
      express.get('/test/send-hello', function (err, res) {
        should(!err);
        should(!res.error);
        res.get('Cache-Control').should.equal('private');
        done();
      });
    });
  });
  describe("/api/send-empty", function () {
    it("should return private", function (done) {
      express.get('/api/send-empty', function (err, res) {
        should(!err);
        should(!res.error);
        res.get('Cache-Control').should.equal('no-cache');
        done();
      });
    });
  });
});