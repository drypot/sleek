import crypto from "crypto";
import bcrypt from "bcryptjs";
import * as init from '../base/init.js';
import * as error from '../base/error.js';
import * as config from '../base/config.js';
import * as expb from '../express/express-base.js';

error.define('NOT_AUTHENTICATED', '먼저 로그인해 주십시오.');
error.define('NOT_AUTHORIZED', '사용 권한이 없습니다.');

error.define('PASSWORD_WRONG', '비밀번호가 틀렸습니다.', 'password');

// users table

export const users = {};

init.add((done) => {
  config.prop.users.forEach(function (user) {
    user.admin = !!user.admin;
    users[user.name] = user;
  });
  done();
});

function findByPassword(password) {
  for (let name in users) {
    let user = users[name];
    if (bcrypt.compareSync(password, user.hash)) {
      return user;
    }
  }
  for (let name in users) {
    let user = users[name];
    const buf = Buffer.from(password, 'ucs2');
    const hash = crypto.createHash('sha256');
    hash.update(buf);
    if (hash.digest('base64') === user.hash) {
      return user;
    }
  }
  return null;
}

// authentication

export function checkUser(res, done) {
  const user = res.locals.user;
  if (!user) {
    return done(error.from('NOT_AUTHENTICATED'));
  }
  done(null, user);
}

export function checkAdmin(res, done) {
  const user = res.locals.user;
  if (!user) {
    return done(error.from('NOT_AUTHENTICATED'));
  }
  if (!user.admin) {
    return done(error.from('NOT_AUTHORIZED'));
  }
  done(null, user);
}

// login

expb.setRedirectToLogin(function (err, req, res, done) {
  if (!res.locals.api && err.code === error.get('NOT_AUTHENTICATED').code) {
    res.redirect('/users/login');
  } else {
    done(err);
  }
});

expb.core.get('/users/login', function (req, res, done) {
  res.render('user/user-base-login');
});

expb.core.post('/api/users/login', function (req, res, done) {
  const user = findByPassword(req.body.password || '');
  if (!user) {
    return done(error.from('PASSWORD_WRONG'));
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

expb.setAutoLogin(function (req, res, done) {
  if (req.session.uname) {
    res.locals.user = users[req.session.uname];
    return done();
  }
  const password = req.cookies.password;
  if (!password) {
    return done();
  }
  const user = findByPassword(password);
  if (!user) {
    res.clearCookie('password');
    return done();
  }
  createSession(req, res, user, done);
});

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
  checkUser(res, function (err, user) {
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
