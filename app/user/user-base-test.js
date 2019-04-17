var init = require('../base/init');
var error = require('../base/error');
var config = require('../base/config')({ path: 'config/test.json' });
var expb = require('../express/express-base');
var userb = require('../user/user-base');
var userf = require('../user/user-fixture');
var expl = require('../express/express-local');
var assert = require('assert');
var assert2 = require('../base/assert2');

before(function (done) {
  init.run(done);
});

before(function () {
  expb.core.get('/api/test/user', function (req, res, done) {
    userb.checkUser(res, function (err, user) {
      if (err) return done(err);
      res.json({});
    });
  });

  expb.core.get('/api/test/admin', function (req, res, done) {
    userb.checkAdmin(res, function (err, user) {
      if (err) return done(err);
      res.json({});
    });
  });
});

describe('login', function () {
  it('session should be clear', function (done) {
    expl.get('/api/users/login').end(function (err, res) {
      assert.ifError(err);
      assert2.ne(res.body.err, undefined); 
      assert(error.find(res.body.err, 'NOT_AUTHENTICATED'));
      done();
    });
  });
  it('user should success', function (done) {
    userf.login('user', done);
  });
  it('session should be filled', function (done) {
    expl.get('/api/users/login').end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      assert2.e(res.body.user.name, 'user');
      done();
    });
  });
  it('logout should success', function (done) {
    userf.logout(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      done();
    })
  });
  it('session should be clear', function (done) {
    expl.get('/api/users/login').end(function (err, res) {
      assert.ifError(err);
      assert2.ne(res.body.err, undefined); 
      assert(error.find(res.body.err, 'NOT_AUTHENTICATED'));
      done();
    });
  });
  it('admin should success', function (done) {
    userf.login('admin', done);
  });
  it('session should be filled', function (done) {
    expl.get('/api/users/login').end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      assert2.e(res.body.user.name, 'admin');
      done();
    });
  });
  it('wrong password should fail', function (done) {
    expl.post('/api/users/login').send({ password: 'xxx' }).end(function (err, res) {
      assert.ifError(err);
      assert2.ne(res.body.err, undefined); 
      assert(error.find(res.body.err, 'PASSWORD_WRONG'));
      done();
    });
  });  
});

describe('accessing user resource', function () {
  it('given no user', function (done) {
    userf.logout(done);
  });
  it('should fail', function (done) {
    expl.get('/api/test/user', function (err, res) {
      assert.ifError(err);
      assert(error.find(res.body.err, 'NOT_AUTHENTICATED'));
      done();
    });
  });
  it('given user', function (done) {
    userf.login('user', done);
  });
  it('should success', function (done) {
    expl.get('/api/test/user', function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      done();
    });
  });
  it('given no user', function (done) {
    userf.logout(done);
  });
  it('should fail', function (done) {
    expl.get('/api/test/user', function (err, res) {
      assert.ifError(err);
      assert(error.find(res.body.err, 'NOT_AUTHENTICATED'));
      done();
    });
  });
});

describe('accessing admin resource', function () {
  it('given no user', function (done) {
    userf.logout(done);
  });
  it('should fail', function (done) {
    expl.get('/api/test/admin', function (err, res) {
      assert.ifError(err);
      assert(error.find(res.body.err, 'NOT_AUTHENTICATED'));
      done();
    });
  });
  it('given user', function (done) {
    userf.login('user', done);
  });
  it('should fail', function (done) {
    expl.get('/api/test/admin', function (err, res) {
      assert.ifError(err);
      assert(error.find(res.body.err, 'NOT_AUTHORIZED'));
      done();
    });
  });
  it('given admin', function (done) {
    userf.login('admin', done);
  });
  it('should success', function (done) {
    expl.get('/api/test/admin', function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      done();
    });
  });
});

describe('auto login', function () {
  it('given new (cookie clean) agent', function () {
    expl.newAgent();
  });
  it('access should fail', function (done) {
    expl.get('/api/test/user').end(function (err, res) {
      assert.ifError(err);
      assert2.ne(res.body.err, undefined); 
      done();
    });
  });
  it('given login with auto login', function (done) {
    userf.login('user', true, done);    
  });
  it('access should success', function (done) {
    expl.get('/api/test/user').end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      done();
    });
  });
  it('given new session', function (done) {
    expl.post('/api/destroy-session').end(function (err, res) {
      assert.ifError(err);
      assert2.empty(res.body.err);
      done();
    });
  });
  it('access should success', function (done) {
    expl.get('/api/test/user').end(function (err, res) {
      assert2.empty(res.body.err);
      done();
    })
  });
  it('given no user', function (done) {
    userf.logout(done);
  });
  it('access should fail', function (done) {
    expl.get('/api/test/user').end(function (err, res) {
      assert.ifError(err);
      assert2.ne(res.body.err, undefined); 
      done();
    })
  });
});
