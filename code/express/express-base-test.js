import * as assert2 from "../base/assert2.js";
import * as init from '../base/init.js';
import * as error from '../base/error.js';
import * as config from '../base/config.js';
import * as expb from '../express/express-base.js';
import * as expl from "../express/express-local.js";

before(function (done) {
  config.setPath('config/test.json');
  init.run(done);
});

before((done) => {
  expb.start();
  done();
});

describe('api res.json', function () {
  describe('object', function () {
    before(function () {
      expb.core.get('/api/test/object', function (req, res, done) {
        res.json({ msg: 'valid json' });
      });
    });
    it('should return object', function (done) {
      expl.get('/api/test/object').end(function (err, res) {
        assert2.ifError(err);
        assert2.e(res.type, 'application/json');
        assert2.e(res.body.msg, 'valid json');
        done();
      });
    });
  });
  describe('string', function () {
    before(function () {
      expb.core.get('/api/test/string', function (req, res, done) {
        res.json('hi');
      });
    });
    it('should return string', function (done) {
      expl.get('/api/test/string').end(function (err, res) {
        assert2.ifError(err);
        assert2.e(res.type, 'application/json');
        assert2.e(res.body, 'hi');
        done();
      });
    });
  });
  describe('null', function () {
    before(function () {
      expb.core.get('/api/test/null', function (req, res, done) {
        res.json(null);
      });
    });
    it('should return null', function (done) {
      expl.get('/api/test/null').end(function (err, res) {
        assert2.ifError(err);
        assert2.e(res.type, 'application/json');
        assert2.e(res.body, null);
        done();
      });
    });
  });
});

describe('api done(error)', function () {
  before(function () {
    expb.core.get('/api/test/invalid-data', function (req, res, done) {
       done(error.newError('INVALID_DATA'));
    });
  });
  it('should return json', function (done) {
    expl.get('/api/test/invalid-data').end(function (err, res) {
      assert2.ifError(err);
      assert2.e(res.type, 'application/json');
      assert2.ok(res.body.err);
      assert2.ok(error.find(res.body.err, 'INVALID_DATA'));
      done();
    });
  });
});

describe('api no-action', function () {
  before(function () {
    expb.core.get('/api/test/no-action', function (req, res, done) {
      done();
    });
  });
  it('should return 404', function (done) {
    expl.get('/api/test/no-action').end(function (err, res) {
      assert2.ok(err !== null);
      assert2.e(res.status, 404); // Not Found
      done();
    });
  });
});

describe('undefined api', function () {
  it('should return 404', function (done) {
    expl.get('/api/test/undefined-url').end(function (err, res) {
      assert2.ok(err !== null);
      assert2.e(res.status, 404); // Not Found
      done();
    });
  });
});

describe('html res.send', function () {
  before(function () {
    expb.core.get('/test/html', function (req, res, done) {
      res.send('<p>some text</p>');
    });
  });
  it('should return html', function (done) {
    expl.get('/test/html').end(function (err, res) {
      assert2.ifError(err);
      assert2.e(res.type, 'text/html');
      assert2.e(res.text, '<p>some text</p>');
      done();
    });
  });
});

describe('html done(error)', function () {
  before(function () {
    expb.core.get('/test/invalid-data', function (req, res, done) {
      done(error.newError('INVALID_DATA'));
    });
  });
  it('should return html', function (done) {
    expl.get('/test/invalid-data').end(function (err, res) {
      assert2.ifError(err);
      assert2.e(res.type, 'text/html');
      assert2.ok(/.*INVALID_DATA.*/.test(res.text));
      done();
    });
  });
});

describe('cache control', function () {
  before(function () {
    expb.core.get('/test/cache-test', function (req, res, done) {
       res.send('<p>muse be cached</p>');
     });
  });
  describe('none api request', function () {
    it('should return Cache-Control: private', function (done) {
      expl.get('/test/cache-test').end(function (err, res) {
        assert2.ifError(err);
        assert2.e(res.get('Cache-Control'), 'private');
        done();
      });
    });
  });
  describe('api request', function () {
    it('should return Cache-Control: no-cache', function (done) {
      expl.get('/api/hello').end(function (err, res) {
        assert2.ifError(err);
        assert2.e(res.get('Cache-Control'), 'no-cache');
        done();
      });
    });
  });
});

describe('session var', function () {
  before(function () {
    expb.core.put('/api/test/session', function (req, res) {
      for (let key in req.body) {
        req.session[key] = req.body[key];
      }
      res.json({});
    });
    expb.core.get('/api/test/session', function (req, res) {
      const obj = {};
      for (let i = 0; i < req.body.length; i++) {
        const key = req.body[i];
        obj[key] = req.session[key];
      }
      res.json(obj);
    });
  });
  it('should succeed', function (done) {
    expl.put('/api/test/session').send({ book: 'book1', price: 11 }).end(function (err, res) {
      assert2.ifError(err);
      assert2.ifError(res.body.err);
      expl.get('/api/test/session').send([ 'book', 'price' ]).end(function (err, res) {
        assert2.ifError(err);
        assert2.e(res.body.book, 'book1');
        assert2.e(res.body.price, 11);
        done();
      });
    });
  });
  it('should fail when session destroied', function (done) {
    expl.put('/api/test/session').send({ book: 'book1', price: 11 }).end(function (err, res) {
      assert2.ifError(err);
      assert2.ifError(res.body.err);
      expl.post('/api/destroy-session').end(function (err, res) {
        assert2.ifError(err);
        assert2.ifError(res.body.err);
        expl.get('/api/test/session').send([ 'book', 'price' ]).end(function (err, res) {
          assert2.ifError(err);
          assert2.e(res.body.book, undefined);
          assert2.e(res.body.price, undefined);
          done();
        });
      });
    });
  });
});

describe('middleware', function () {
  let result;
  before(function () {
    function mid1(req, res, done) {
      result.mid1 = 'ok';
      done();
    }

    function mid2(req, res, done) {
      result.mid2 = 'ok';
      done();
    }

    function midErr(req, res, done) {
      done(new Error('some error'));
    }

    expb.core.get('/api/test/mw-1-2', mid1, mid2, function (req, res, done) {
      result.mid3 = 'ok';
      res.json({});
    });

    expb.core.get('/api/test/mw-1-err-2', mid1, midErr, mid2, function (req, res, done) {
      result.mid3 = 'ok';
      res.json({});
    });
  });
  describe('mw-1-2 ', function () {
    it('should return 1, 2', function (done) {
      result = {};
      expl.get('/api/test/mw-1-2').end(function (err, res) {
        assert2.ifError(err);
        assert2.ne(result.mid1, undefined);
        assert2.ne(result.mid2, undefined);
        assert2.ne(result.mid3, undefined);
        done();
      });
    });
  });
  describe('mw-1-err-2', function () {
    it('should return 1, 2', function (done) {
      result = {};
      expl.get('/api/test/mw-1-err-2').end(function (err, res) {
        assert2.ifError(err);
        assert2.ne(result.mid1, undefined);
        assert2.e(result.mid2, undefined);
        assert2.e(result.mid3, undefined);
        done();
      });
    });
  });
});

describe('hello', function () {
  it('should return appName', function (done) {
    expl.get('/api/hello').end(function (err, res) {
      assert2.ifError(err);
      assert2.e(res.type, 'application/json');
      assert2.e(res.body.name, config.prop.appName);
      const stime = parseInt(res.body.time || 0);
      const ctime = Date.now();
      assert2.e(stime <= ctime, true);
      assert2.e(stime >= ctime - 100, true);
      done();
    });
  });
});

describe('echo', function () {
  describe('get', function () {
    it('should succeed', function (done) {
      expl.get('/api/echo?p1&p2=123').end(function (err, res) {
        assert2.ifError(err);
        assert2.e(res.body.method, 'GET');
        assert2.deepStrictEqual(res.body.query, { p1: '', p2: '123' });
        done();
      });
    });
  });
  describe('post', function () {
    it('should succeed', function (done) {
      expl.post('/api/echo').send({ p1: '', p2: '123' }).end(function (err, res) {
        assert2.ifError(err);
        assert2.e(res.body.method, 'POST');
        assert2.deepStrictEqual(res.body.body, { p1: '', p2: '123' });
        done();
      });
    });
  });
  describe('delete', function () {
    it('should succeed', function (done) {
      expl.del('/api/echo').end(function (err, res) {
        assert2.ifError(err);
        assert2.e(res.body.method, 'DELETE');
        done();
      });
    });
  });
});
