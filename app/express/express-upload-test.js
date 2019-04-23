'use strict';

const fs = require('fs');

const util2 = require('../base/util2');
const init = require('../base/init');
const fs2 = require('../base/fs2');
const config = require('../base/config');
const expb = require('../express/express-base');
const expu = require('../express/express-upload');
const expl = require('../express/express-local');
const assert = require('assert');
const assert2 = require('../base/assert2');

before(function (done) {
  config.path = 'config/test.json';
  init.run(done);
});

describe('parsing json', function () {
  it('given handler', function () {
    expb.core.post('/api/test/upload-json', expu.handler(function (req, res, done) {
      assert2.e(req.headers['content-type'], 'application/json');
      req.body.files = req.files;
      res.json(req.body);
      done();
    }));
  });
  it('should succeed', function (done) {
    expl.post('/api/test/upload-json').send({'p1': 'abc'}).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      assert2.e(res.body.files, undefined);
      assert2.e(res.body.p1, 'abc');
      done();
    });
  });
});

describe('parsing form', function () {
  it('given handler', function () {
    expb.core.post('/api/test/upload-form', expu.handler(function (req, res, done) {
      // RegExp 기능이 chai-http github 에는 커밋되어 있으나 npm 패키지엔 아직 적용이 안 되어 있다.
      assert(req.header('content-type').includes('multipart'));
      req.body.files = req.files;
      res.json(req.body);
      done();
    }));
  });
  it('field should succeed', function (done) {
    expl.post('/api/test/upload-form').field('p1', 'abc').field('p2', '123').field('p2', '456').end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      assert2.e(res.body.files, undefined);
      assert2.e(res.body.p1, 'abc');
      assert2.de(res.body.p2, ['123', '456']);
      done();
    });
  });
  it('fields should succeed', function (done) {
    var form = {
      p1: 'abc',
      p2: '123',
      p3: ['123', '456']
    }
    expl.post('/api/test/upload-form').fields(form).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      assert2.e(res.body.files, undefined);
      assert2.e(res.body.p1, 'abc');
      assert2.e(res.body.p2, '123');
      assert2.de(res.body.p3, ['123', '456']);
      done();
    });
  });
});

describe('parsing one file', function () {
  var f1 = 'app/express/express-upload-f1.txt';
  var p1;
  it('given handler', function () {
    expb.core.post('/api/test/upload-one', expu.handler(function (req, res, done) {
      p1 = req.files.f1[0].path;
      assert2.path(p1);
      req.body.files = req.files;
      res.json(req.body);
      done();
    }));
  });
  it('should succeed', function (done) {
    expl.post('/api/test/upload-one').field('p1', 'abc').attach('f1', f1).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      assert2.e(res.body.p1, 'abc');
      assert2.e(res.body.files.f1[0].safeFilename, 'express-upload-f1.txt');
      setTimeout(function () {
        assert2.path(p1, false);
        done();
      }, 100);
    });
  });
});

describe('parsing two files', function () {
  var f1 = 'app/express/express-upload-f1.txt';
  var f2 = 'app/express/express-upload-f2.txt';
  var p1, p2;
  it('given handler', function () {
    expb.core.post('/api/test/upload-two', expu.handler(function (req, res, done) {
      p1 = req.files.f1[0].path;
      p2 = req.files.f1[1].path;
      assert2.path(p1);
      assert2.path(p2);
      req.body.files = req.files;
      res.json(req.body);
      done();
    }));
  });
  it('should succeed', function (done) {
    expl.post('/api/test/upload-two').field('p1', 'abc').attach('f1', f1).attach('f1', f2).end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      assert2.e(res.body.p1, 'abc');
      assert2.e(res.body.files.f1[0].safeFilename, 'express-upload-f1.txt');
      assert2.e(res.body.files.f1[1].safeFilename, 'express-upload-f2.txt');
      setTimeout(function () {
        assert2.path(p1, false);
        assert2.path(p2, false);
        done();
      }, 100);
    });
  });
});

describe('parsing irregular filename', function () {
  var f1 = 'app/express/express-upload-f1.txt';
  var p1;
  it('given handler', function () {
    expb.core.post('/api/test/upload-irregular', expu.handler(function (req, res, done) {
      p1 = req.files.f1[0].path;
      assert2.path(p1);
      req.body.files = req.files;
      res.json(req.body);
      done();
    }));
  });
  it('should succeed', function (done) {
    expl.post('/api/test/upload-irregular').field('p1', 'abc').attach('f1', f1, 'file<>()[]_-=.txt.%$#@!&.txt').end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      assert2.e(res.body.files.f1[0].safeFilename, 'file__()[]_-=.txt.%$#@!&.txt');
      assert2.e(res.body.p1, 'abc');
      assert2.path(p1, false);
      done();
    });
  });
});

