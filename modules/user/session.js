var init = require('../base/init');
var userb = require('../user/user-base');

init.add(function () {

  console.log('session:');

  exports.initSession = function (req, user, done) {
    req.session.regenerate(function (err) {
      if (err) return done(err);
      req.session.uname = user.name;
      req.session.posts = [];
      done();
    });
  }

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
    exports.initSession(req, user, done);
  };

});
