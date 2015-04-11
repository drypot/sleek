var expect = require('../base/chai').expect;

var init = require('../base/init');
var error = require('../base/error');
var config = require('../base/config')({ path: 'config/test.json' });
var exp = require('../express/express');
var userb = require('../user/user-base');
var userf = require('../user/user-fixture');
var local = require('../express/local');

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
      expect(error.find(res.body.err, error.NOT_AUTHENTICATED)).true;
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
      expect(error.find(res.body.err, error.NOT_AUTHENTICATED)).true;
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
      expect(error.find(res.body.err, error.USER_NOT_FOUND)).true;
      done();
    });
  });  
});

describe('categories', function () {
  var user;
  function findc(id) {
    for (var i = 0; i < user.categories.length; i++) {
      var c = user.categories[i];
      if (c.id === id) return c;
    }
    return null;
  }
  it('given user', function (done) {
    userf.login('user', function (err, res) {
      user = res.body.user;
      done();
    });
  });
  it('user should not be admin', function () {
    expect(user.admin).false;
  });
  it('user can access freetalk', function () {
    expect(findc(100).name).equal('freetalk');
  });
  it('can not access cheat', function () {
    expect(findc(60)).not.exist;
  });
  it('can not access recycle bin', function () {
    expect(findc(40)).not.exist;
  });

  it('given cheater', function (done) {
    userf.login('cheater', function (err, res) {
      user = res.body.user;
      done();
    });
  });
  it('should not be admin', function () {
    expect(user.admin).false;
  });
  it('can access freetalk', function () {
    expect(findc(100).name).equal('freetalk');
  });
  it('can access cheat', function () {
    expect(findc(60).name).equal('cheat');
  });
  it('can not access recycle bin', function () {
    expect(findc(40)).not.exist;
  });

  it('given admin', function (done) {
    userf.login('admin', function (err, res) {
      user = res.body.user;
      done();
    });
  });
  it('should be admin', function () {
    expect(user.admin).true;
  });
  it('can access freetalk', function () {
    expect(findc(100).name).equal('freetalk');
  });
  it('can access cheat', function () {
    expect(findc(60).name).equal('cheat');
  });
  it('can access recycle bin', function () {
    expect(findc(40).name).equal('recycle bin');
  });
});

describe('login info', function () {
  it('given logged out', function (done) {
    userf.logout(done);
  });
  it('should fail', function (done) {
    local.get('/api/users/login', function (err, res) {
      expect(err).not.exist;
      expect(error.find(res.body.err, error.NOT_AUTHENTICATED)).true;
      done();
    });
  });
  it('given login', function (done) {
    userf.login('user', done);
  });
  it('should success', function (done) {
    local.get('/api/users/login', function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      expect(res.body.user.name).equal('user');
      expect(res.body.user.categories).exist;
      done();
    });
  });
});

describe('accessing user resource', function () {
  it('given logged out', function (done) {
    userf.logout(done);
  });
  it('should fail', function (done) {
    local.get('/api/test/user', function (err, res) {
      expect(err).not.exist;
      expect(error.find(res.body.err, error.NOT_AUTHENTICATED)).true;
      done();
    });
  });
  it('given user session', function (done) {
    userf.login('user', done);
  });
  it('should success', function (done) {
    local.get('/api/test/user', function (err, res) {
      expect(err).not.exist;
      expect(res.body.err).not.exist;
      done();
    });
  });
  it('given logged out', function (done) {
    userf.logout(done);
  });
  it('should fail', function (done) {
    local.get('/api/test/user', function (err, res) {
      expect(err).not.exist;
      expect(error.find(res.body.err, error.NOT_AUTHENTICATED)).true;
      done();
    });
  });
});

describe('accessing admin resource', function () {
  it('given logged out', function (done) {
    userf.logout(done);
  });
  it('should fail', function (done) {
    local.get('/api/test/admin', function (err, res) {
      expect(err).not.exist;
      expect(error.find(res.body.err, error.NOT_AUTHENTICATED)).true;
      done();
    });
  });
  it('given user session', function (done) {
    userf.login('user', done);
  });
  it('should fail', function (done) {
    local.get('/api/test/admin', function (err, res) {
      expect(err).not.exist;
      expect(error.find(res.body.err, error.NOT_AUTHORIZED)).true;
      done();
    });
  });
  it('given admin session', function (done) {
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
  it('given logged out', function (done) {
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
