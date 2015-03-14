var should = require('should');

var init = require('../base/init');
var error = require('../base/error');
var config = require('../base/config')({ path: 'config/sleek-test.json' });
var express = require('../main/express');
var ufix = require('../user/user-fixture');

require('../user/user-auth-api');

before(function (done) {
  init.run(done);
});

before(function () {

  var app = express.app;

  app.put('/test/session', function (req, res) {
    for (var key in req.body) {
      req.session[key] = req.body[key];
    }
    res.json('ok');
  });

  app.get('/test/session', function (req, res) {
    var obj = {};
    for (var i = 0; i < req.body.length; i++) {
      var key = req.body[i];
      obj[key] = req.session[key];
    }
    res.json(obj);
  });

  app.get('/test/any', function (req, res) {
    req.findUser(function (err) {
      if (err) return res.jsonErr(err);
      res.json({});
    })
  });

  app.get('/test/user', function (req, res) {
    req.findUser('user', function (err) {
      if (err) return res.jsonErr(err);
      res.json({});
    });
  });

  app.get('/test/admin', function (req, res) {
    req.findUser('admin', function (err) {
      if (err) return res.jsonErr(err);
      res.json({});
    });
  });

  app.del('/test/del-session', function (req, res) {
    req.session.destroy();
    res.json({});
  });

  express.listen();
});

describe("getting session var", function () {
  it("given session var", function (done) {
    express.put('/test/session').send({ book: 'book217', price: 112 }).end(function (err, res) {
      should(!res.error);
      res.body.should.equal('ok');
      done();
    });
  });
  it("should success", function (done) {
    express.get('/test/session').send([ 'book', 'price' ]).end(function (err, res) {
      should(!res.error);
      res.body.should.have.property('book', 'book217');
      res.body.should.have.property('price', 112);
      done();
    });
  });
  it("given logged out", function (done) {
    ufix.logout(done);
  });
  it("should fail", function (done) {
    express.get('/test/session').send([ 'book', 'price' ]).end(function (err, res) {
      should(!res.error);
      res.body.should.not.have.property('book');
      res.body.should.not.have.property('price');
      done();
    });
  });
});

describe("making session", function () {
  it("should success for user", function (done) {
    ufix.loginUser(done);
  });
  it("should success for admin", function (done) {
    ufix.loginAdmin(done);
  });
  it("should fail with wrong password", function (done) {
    express.post('/api/sessions').send({ password: 'xxx' }).end(function (err, res) {
      should(!res.error);
      res.body.err.rc.should.equal(error.ERROR_SET);
      res.body.err.errors[0].name.should.equal('password');
      res.body.err.errors[0].msg.should.equal(error.msg.USER_NOT_FOUND);
      done();
    });
  });
});

describe("getting session info", function () {
  it("given logged out", function (done) {
    ufix.logout(done);
  });
  it("should fail", function (done) {
    express.get('/api/sessions', function (err, res) {
      should(!res.error);
      res.body.err.rc.should.equal(error.NOT_AUTHENTICATED);
      done();
    });
  });
  it("given user session", function (done) {
    ufix.loginUser(done);
  });
  it("should success", function (done) {
    express.get('/api/sessions', function (err, res) {
      should(!res.error);
      should(!res.body.err);
      res.body.user.name.should.equal('user');
      should.exist(res.body.user.categoriesOrdered);
      done();
    });
  });
});

describe("accessing /test/any", function () {
  it("given logged out", function (done) {
    ufix.logout(done);
  });
  it("should fail", function (done) {
    express.get('/test/any', function (err, res) {
      should(!res.error);
      res.body.err.rc.should.equal(error.NOT_AUTHENTICATED);
      done();
    });
  });
  it("given user session", function (done) {
    ufix.loginUser(done);
  });
  it("should success", function (done) {
    express.get('/test/any', function (err, res) {
      should(!res.error);
      should(!res.body.err);
      done();
    });
  });
  it("given logged out", function (done) {
    ufix.logout(done);
  });
  it("should fail", function (done) {
    express.get('/test/any', function (err, res) {
      should(!res.error);
      res.body.err.rc.should.equal(error.NOT_AUTHENTICATED);
      done();
    });
  });
});

describe("accessing /test/user", function () {
  it("given logged out", function (done) {
    ufix.logout(done);
  });
  it("should fail", function (done) {
    express.get('/test/user', function (err, res) {
      should(!res.error);
      res.body.err.rc.should.equal(error.NOT_AUTHENTICATED);
      done();
    });
  });
  it("given user session", function (done) {
    ufix.loginUser(done);
  });
  it("should success", function (done) {
    express.get('/test/user', function (err, res) {
      should(!res.error);
      should(!res.body.err);
      done();
    });
  });
});

describe("accessing /test/admin", function () {
  it("given logged out", function (done) {
    ufix.logout(done);
  });
  it("should fail", function (done) {
    express.get('/test/admin', function (err, res) {
      should(!res.error);
      res.body.err.rc.should.equal(error.NOT_AUTHENTICATED);
      done();
    });
  });
  it("given user session", function (done) {
    ufix.loginUser(done);
  });
  it("should fail", function (done) {
    express.get('/test/admin', function (err, res) {
      should(!res.error);
      res.body.err.rc.should.equal(error.NOT_AUTHORIZED);
      done();
    });
  });
  it("given admin session", function (done) {
    ufix.loginAdmin(done);
  });
  it("should success", function (done) {
    express.get('/test/admin', function (err, res) {
      should(!res.error);
      should(!res.body.err);
      done();
    });
  });
});

describe("accessing /test/user with auto login", function () {
  it("given new test session", function (done) {
    express.newTestSession();
    done();
  });
  it("should fail", function (done) {
    express.get('/test/user').end(function (err, res) {
      should(res.body.err);
      done();
    });
  });
  it("given user session", function (done) {
    express.post('/api/sessions').send({ password: '1' }).end(function (err, res) {
      should(!err);
      should(!res.error);
      should(!res.body.err);
      res.body.user.name.should.equal('user');
      done();
    });
  });
  it("should success", function (done) {
    express.get('/test/user').end(function (err, res) {
      should(!res.body.err);
      done();
    })
  });
  it("given new test sesssion", function (done) {
    express.newTestSession();
    done();
  });
  it("should fail", function (done) {
    express.get('/test/user').end(function (err, res) {
      should(res.body.err);
      done();
    })
  });
  it("given user session with auto login", function (done) {
    express.post('/api/sessions').send({ password: '1', remember: true }).end(function (err, res) {
      should(!err);
      should(!res.error);
      should(!res.body.err);
      res.body.user.name.should.equal('user');
      done();
    });
  });
  it("should success", function (done) {
    express.get('/test/user').end(function (err, res) {
      should(!err);
      should(!res.error);
      should(!res.body.err);
      done();
    });
  });
  it("given new session", function (done) {
    express.del('/test/del-session').end(function (err, res) {
      should(!err);
      should(!res.error);
      should(!res.body.err);
      done();
    });
  });
  it("should success", function (done) {
    express.get('/test/user').end(function (err, res) {
      should(!res.body.err);
      done();
    })
  });
  it("given logged out", function (done) {
    ufix.logout(done);
  });
  it("should fail", function (done) {
    express.get('/test/user').end(function (err, res) {
      should(res.body.err);
      done();
    })
  });
});

describe("user.categoriesOrdered", function () {
  var categories;
  it("given user session", function (done) {
    ufix.loginUser(done);
  });
  it("given categoriesOrdered", function (done) {
    express.get('/api/sessions', function (err, res) {
      categories = res.body.user.categoriesOrdered;
      done();
    });
  });
  function find(id) {
    for (var i = 0; i < categories.length; i++) {
      var c = categories[i];
      if (c.id == id) return c;
    }
    return null;
  }
  it("should have categroy 100", function () {
    var cx = find(100);
    should.exist(cx);
    cx.should.property('name');
  });
  it("should not have category 40", function () {
    var cx = find(40);
    should.not.exist(cx);
  });
  it("given admin session", function (done) {
    ufix.loginAdmin(done);
  });
  it("given categoriesOrdered", function (done) {
    express.get('/api/sessions', function (err, res) {
      categories = res.body.user.categoriesOrdered;
      done();
    });
  });
  it("should have category 100", function () {
    var cx = find(100);
    should.exist(cx);
    cx.should.property('name');
  });
  it("should have category 40", function () {
    var cx = find(40);
    should.exist(cx);
  });
});
