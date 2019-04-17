var init = require('../base/init');
var expl = require('../express/express-local');
var assert = require('assert');
var assert2 = require('../base/assert2');
var userf = exports;

userf.login = function (name, remember, done) {
  if (typeof remember == 'function') {
    done = remember;
    remember = false;
  }
  var password = { user: '1', cheater: '2', admin: '3' }[name];
  expl.post('/api/users/login').send({ password: password, remember: remember }).end(function (err, res) {
    assert.ifError(err);
    assert2.empty(res.body.err);
    assert2.e(res.body.user.name, name);
    done(err, res);
  });
}

userf.logout = function (done) {
  expl.post('/api/users/logout', function (err, res) {
    assert.ifError(err);
    assert2.empty(res.body.err);
    done(err, res);
  });
}
