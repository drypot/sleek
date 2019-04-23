'use strict';

const init = require('../base/init');
const expl = require('../express/express-local');
const assert = require('assert');
const assert2 = require('../base/assert2');
const userf = exports;

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
