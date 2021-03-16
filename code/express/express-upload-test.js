import * as assert2 from "../base/assert2.js";
import * as init from '../base/init.js';
import * as config from '../base/config.js';
import * as expb from '../express/express-base.js';
import * as expl from "../express/express-local.js";
import * as expu from "../express/express-upload.js";

before(function (done) {
  config.setPath('config/test.json');
  init.run(done);
});

before((done) => {
  expb.start();
  done();
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
      assert2.ifError(err);
      assert2.ifError(res.body.err);
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
      assert2.ok(req.header('content-type').includes('multipart'));
      req.body.files = req.files;
      res.json(req.body);
      done();
    }));
  });
  it('field should succeed', function (done) {
    expl.post('/api/test/upload-form').field('p1', 'abc').field('p2', '123').field('p2', '456').end(function (err, res) {
      assert2.ifError(err);
      assert2.ifError(res.body.err);
      assert2.e(res.body.files, undefined);
      assert2.e(res.body.p1, 'abc');
      assert2.deepStrictEqual(res.body.p2, ['123', '456']);
      done();
    });
  });
  it('fields should succeed', function (done) {
    const form = {
      p1: 'abc',
      p2: '123',
      p3: ['123', '456']
    };
    expl.post('/api/test/upload-form').fields(form).end(function (err, res) {
      assert2.ifError(err);
      assert2.ifError(res.body.err);
      assert2.e(res.body.files, undefined);
      assert2.e(res.body.p1, 'abc');
      assert2.e(res.body.p2, '123');
      assert2.deepStrictEqual(res.body.p3, ['123', '456']);
      done();
    });
  });
});

describe('parsing one file', function () {
  const f1 = 'code/express/express-upload-f1.txt';
  let p1;
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
      assert2.ifError(err);
      assert2.ifError(res.body.err);
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
  const f1 = 'code/express/express-upload-f1.txt';
  const f2 = 'code/express/express-upload-f2.txt';
  let p1, p2;
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
      assert2.ifError(err);
      assert2.ifError(res.body.err);
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
  const f1 = 'code/express/express-upload-f1.txt';
  let p1;
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
      assert2.ifError(err);
      assert2.ifError(res.body.err);
      assert2.e(res.body.files.f1[0].safeFilename, 'file__()[]_-=.txt.%$#@!&.txt');
      assert2.e(res.body.p1, 'abc');
      assert2.path(p1, false);
      done();
    });
  });
});

