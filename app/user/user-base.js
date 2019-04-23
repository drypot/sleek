'use strict';

const crypto = require('crypto');
const bcrypt = require('bcrypt');

const init = require('../base/init');
const error = require('../base/error');
const config = require('../base/config');
const expb = require('../express/express-base');
const userb = exports;

error.define('NOT_AUTHENTICATED', '먼저 로그인해 주십시오.');
error.define('NOT_AUTHORIZED', '사용 권한이 없습니다.');

error.define('PASSWORD_WRONG', '비밀번호가 틀렸습니다.', 'password');

// users table

var users = userb.users = {};

init.add(function (done) {
  config.users.forEach(function (user) {
    user.admin = !!user.admin;
    users[user.name] = user;
  });
  done()
});

function findByPassword(password) {
  for (var name in users) {
    var user = users[name];
    if (bcrypt.compareSync(password, user.hash)) {
      return user;
    }
  }
  for (var name in users) {
    var user = users[name];
    var buf = Buffer.from(password, 'ucs2');
    var hash = crypto.createHash('sha256');
    hash.update(buf);
    if (hash.digest('base64') == user.hash) {
      return user;
    }
  }
  return null;
};

// authentication

userb.checkUser = function (res, done) {
  var user = res.locals.user;
  if (!user) {
    return done(error('NOT_AUTHENTICATED'));
  }
  done(null, user);
};

userb.checkAdmin = function (res, done) {
  var user = res.locals.user;
  if (!user) {
    return done(error('NOT_AUTHENTICATED'));
  }
  if (!user.admin) {
    return done(error('NOT_AUTHORIZED'));
  }
  done(null, user);
};

// login

expb.redirectToLogin = function (err, req, res, done) {
  if (!res.locals.api && err.code == error.NOT_AUTHENTICATED.code) {
    res.redirect('/users/login');
  } else {
    done(err);
  }
};

expb.core.get('/users/login', function (req, res, done) {
  res.render('user/user-base-login');
});

expb.core.post('/api/users/login', function (req, res, done) {
  var user = findByPassword(req.body.password || '');
  if (!user) {
    return done(error('PASSWORD_WRONG'));
  }
  if (req.body.remember) {
    res.cookie('password', req.body.password, {
      maxAge: 99 * 365 * 24 * 60 * 60 * 1000,
      httpOnly: true
    });
  }
  createSession(req, res, user, function (err) {
    if (err) return done(err);
    res.json({
      user: {
        name: user.name,
        admin: user.admin,
        categories: user.categories
      },
      uploadSite: config.uploadSite
    });
  });
});

expb.autoLogin = function (req, res, done) {
  if (req.session.uname) {
    res.locals.user = users[req.session.uname];
    return done();
  }
  var password = req.cookies.password;
  if (!password) {
    return done();
  }
  var user = findByPassword(password);
  if (!user) {
    res.clearCookie('password');
    return done();
  }
  createSession(req, res, user, done);
};

function createSession(req, res, user, done) {
  req.session.regenerate(function (err) {
    if (err) return done(err);
    req.session.uname = user.name;
    req.session.pids = [];
    res.locals.user = user;
    done();
  });
}

// used for login test.
expb.core.get('/api/users/login', function (req, res, done) {
  userb.checkUser(res, function (err, user) {
    if (err) return done(err);
    res.json({
      user: {
        name: user.name,
        admin: user.admin,
        categories: user.categories
      },
      uploadSite: config.uploadSite
    });
  });
});

// logout

expb.core.post('/api/users/logout', function (req, res, done) {
  res.clearCookie('password');
  req.session.destroy();
  res.json({});
});
