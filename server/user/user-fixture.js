var expect = require('chai').expect;

var init = require('../base/init');
var local = require('../express/local');
var userf = exports;

userf.login = function (name, remember, done) {
  if (typeof remember == 'function') {
    done = remember;
    remember = false;
  }
  var password = { user: '1', cheater: '2', admin: '3' }[name];
  local.post('/api/users/login').send({ password: password, remember: remember }).end(function (err, res) {
    expect(err).not.exist;
    expect(res.body.err).not.exist;
    expect(res.body.user.name).equal(name);
    done(err, res);
  });
}

userf.logout = function (done) {
  local.post('/api/users/logout', function (err, res) {
    expect(err).not.exist;
    expect(res.body.err).not.exist;
    done(err, res);
  });
}
