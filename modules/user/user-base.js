var crypto = require('crypto');
var bcrypt = require('bcrypt');

var init = require('../base/init');
var error = require('../base/error');
var config = require('../base/config');
var exp = require('../express/express');
var userb = exports;

error.define('NOT_AUTHENTICATED', '먼저 로그인해 주십시오.');
error.define('NOT_AUTHORIZED', '사용 권한이 없습니다.');
error.define('USER_NOT_FOUND', '사용자를 찾을 수 없습니다.');

// users table

var users = {};

init.add(function () {
  config.users.forEach(function (_user) {
    var user = users[_user.name] = {
      name: _user.name,
      hash: _user.hash,
      admin: !!_user.admin,   
      categories : [],
      categoryIndex: []
    };
    config.categories.forEach(function (category) {
      if (user.admin || ~category.users.indexOf(user.name)) {
        user.categories.push(category);
        user.categoryIndex[category.id] = category;
      }
    });
  });
});

function findByName(uname) {
  return users[uname];
};

function findByPassword(password) {
  for (var uname in users) {
    var user = users[uname];
    if (bcrypt.compareSync(password, user.hash)) {
      return user;
    }
  }
  for (var uname in users) {
    var user = users[uname];
    var buf = new Buffer(password, 'ucs2');
    var hash = crypto.createHash('sha256');
    hash.update(buf);
    if (hash.digest('base64') == user.hash) {
      return user;
    }
  }
  return null;
};

// login

exp.core.post('/api/users/login', function (req, res, done) {
  login(req, res, function (err, user) {
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

exp.core.get('/api/users/login', function (req, res, done) {
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

exp.core.post('/api/users/logout', function (req, res, done) {
  res.clearCookie('password');
  req.session.destroy();
  res.json({});
});

exp.core.get('/users/login', function (req, res, done) {
  res.render('user/user-base-login');
});

exp.autoLogin = function (req, res, done) {
  autoLogin(req, res, done);
};

exp.redirectToLogin = function (err, req, res, done) {
  if (!res.locals.api && err.code == error.NOT_AUTHENTICATED.code) {
    res.redirect('/users/login');
  } else {
    done(err);
  }
};

function autoLogin(req, res, done) {
  if (req.session.uname) {
    res.locals.user = findByName(req.session.uname);
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
}

function login(req, res, done) {
  var user = findByPassword(req.body.password || '');
  if (!user) {
    return done(error(error.USER_NOT_FOUND));
  }
  if (req.body.remember) {
    res.cookie('password', req.body.password, {
      maxAge: 99 * 365 * 24 * 60 * 60 * 1000,
      httpOnly: true
    });
  }
  createSession(req, res, user, done);
};

function createSession(req, res, user, done) {
  req.session.regenerate(function (err) {
    if (err) return done(err);
    req.session.uname = user.name;
    req.session.posts = [];
    res.locals.user = user;
    done(null, user);
  });
}

userb.checkUser = function (res, done) {
  var user = res.locals.user;
  if (!user) {
    return done(error(error.NOT_AUTHENTICATED));
  }
  done(null, user);
};

userb.checkAdmin = function (res, done) {
  var user = res.locals.user;
  if (!user) {
    return done(error(error.NOT_AUTHENTICATED));
  }
  if (!user.admin) {
    return done(error(error.NOT_AUTHORIZED));
  }
  done(null, user);
};
