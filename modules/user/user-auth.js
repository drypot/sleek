var init = require('../base/init');
var error = require('../base/error');
var express2 = require('../main/express');
var userb = require('../user/user-base');

init.add(function () {
  var app = express2.app;

  app.post('/api/sessions', function (req, res) {
    var user = userb.findUserByPassword(req.body.password || '');
    if (!user) {
      return res.jsonErr(error(error.USER_NOT_FOUND));
    }
    if (req.body.remember) {
      res.cookie('password', req.body.password, {
        maxAge: 99 * 365 * 24 * 60 * 60 * 1000,
        httpOnly: true
      });
    }
    session.createSession(req, user, function (err) {
      if (err) return res.jsonErr(err);
      res.json({
        user: {
          name: user.name
        }
      });
    });
  });

  app.get('/api/sessions', function (req, res) {
    req.findUser(function (err, user) {
      if (err) return res.jsonErr(err);
      res.json({
        user: {
          name: user.name,
          categories: user.categories
        },
        uploadSite: config.uploadSite
      });
    });
  });

  app.del('/api/sessions', function (req, res) {
    res.clearCookie('password');
    req.session.destroy();
    res.json({});
  });

  app.get('/', function (req, res) {
    if (res.locals.user) {
      res.redirect('/threads');
    } else {
      res.render('user/user-auth-login');
    }
  });
}

function createSession(req, user, done) {
  req.session.regenerate(function (err) {
    if (err) return done(err);
    req.session.uname = user.name;
    req.session.posts = [];
    done();
  });
}

// 세션 작업하고 있었고
// exports.restoreLocalsUser 를 등록하는 법을 개선해야 함.

exports.setLocals = function (req, res, done) {
  if (req.session.uname) {
    res.locals.user = userb.findUserByName(req.session.uname);
    return done();
  }
  if (res.locals.api) {
    return done();
  }
  var password = req.cookies.password;
  if (!password) {
    return done();
  }
  var user = userb.findUserByPassword(password);
  if (!user) {
    res.clearCookie(password);
    return done();
  }
  res.locals.user = user;
  exports.createSession(req, user, done);
};

exports.getUser = function (res, done) {
   app.request.findUser = function (uname, done) {
    if (typeof uname === 'function') {
      done = uname;
      uname = null;
    }
    var req = this;
    var res = this.res;
    var user = res.locals.user;
    if (!user) {
      return done(error(error.NOT_AUTHENTICATED));
    }
    if (uname && uname !== user.name) {
      return done(error(error.NOT_AUTHORIZED));
    }
    done(null, user);
  };