var init = require('../base/init');
var error = require('../base/error');
var config = require('../base/config')({ path: 'config/test.json' });
var exp = require('../express/express');
var userb = require('../user/user-base');
var userf = require('../user/user-fixture');
var local = require('../express/local');
var expect = require('../base/assert').expect

before(function (done) {
  init.run(done);
});

before(function () {
  exp.core.get('/api/test/user', function (req, res, done) {
    userb.checkUser(res, function (err, user) {
      if (err) return done(err);
      res.json({});
    });
  });

  exp.core.get('/api/test/admin', function (req, res, done) {
    userb.checkAdmin(res, function (err, user) {
      if (err) return done(err);
      res.json({});
    });
  });
});

describe('login', function () {
  it('session should be clear', function (done) {
    local.get('/api/users/login').end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).exist;
      expect(res.body.err).error('NOT_AUTHENTICATED');
      done();
    });
  });
  it('user should success', function (done) {
    userf.login('user', done);
  });
  it('session should be filled', function (done) {
    local.get('/api/users/login').end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      expect(res.body.user.name).equal('user');
      done();
    });
  });
  it('logout should success', function (done) {
    userf.logout(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      done();
    })
  });
  it('session should be clear', function (done) {
    local.get('/api/users/login').end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).exist;
      expect(res.body.err).error('NOT_AUTHENTICATED');
      done();
    });
  });
  it('admin should success', function (done) {
    userf.login('admin', done);
  });
  it('session should be filled', function (done) {
    local.get('/api/users/login').end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      expect(res.body.user.name).equal('admin');
      done();
    });
  });
  it('wrong password should fail', function (done) {
    local.post('/api/users/login').send({ password: 'xxx' }).end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).exist;
      expect(res.body.err).error('PASSWORD_WRONG');
      done();
    });
  });  
});

describe('accessing user resource', function () {
  it('given no user', function (done) {
    userf.logout(done);
  });
  it('should fail', function (done) {
    local.get('/api/test/user', function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).error('NOT_AUTHENTICATED');
      done();
    });
  });
  it('given user', function (done) {
    userf.login('user', done);
  });
  it('should success', function (done) {
    local.get('/api/test/user', function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      done();
    });
  });
  it('given no user', function (done) {
    userf.logout(done);
  });
  it('should fail', function (done) {
    local.get('/api/test/user', function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).error('NOT_AUTHENTICATED');
      done();
    });
  });
});

describe('accessing admin resource', function () {
  it('given no user', function (done) {
    userf.logout(done);
  });
  it('should fail', function (done) {
    local.get('/api/test/admin', function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).error('NOT_AUTHENTICATED');
      done();
    });
  });
  it('given user', function (done) {
    userf.login('user', done);
  });
  it('should fail', function (done) {
    local.get('/api/test/admin', function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).error('NOT_AUTHORIZED');
      done();
    });
  });
  it('given admin', function (done) {
    userf.login('admin', done);
  });
  it('should success', function (done) {
    local.get('/api/test/admin', function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      done();
    });
  });
});

describe('auto login', function () {
  it('given new (cookie clean) agent', function () {
    local.newAgent();
  });
  it('access should fail', function (done) {
    local.get('/api/test/user').end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).exist;
      done();
    });
  });
  it('given login with auto login', function (done) {
    userf.login('user', true, done);    
  });
  it('access should success', function (done) {
    local.get('/api/test/user').end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      done();
    });
  });
  it('given new session', function (done) {
    local.post('/api/test/destroy-session').end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      done();
    });
  });
  it('access should success', function (done) {
    local.get('/api/test/user').end(function (err, res) {
      expect(res.body.err).not.exist;
      done();
    })
  });
  it('given no user', function (done) {
    userf.logout(done);
  });
  it('access should fail', function (done) {
    local.get('/api/test/user').end(function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).exist;
      done();
    })
  });
});
