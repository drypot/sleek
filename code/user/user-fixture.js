import * as assert2 from "../base/assert2.js";
import * as init from '../base/init.js';
import * as expl from "../express/express-local.js";

export function login(name, remember, done) {
  if (typeof remember == 'function') {
    done = remember;
    remember = false;
  }
  const password = {user: '1', cheater: '2', admin: '3'}[name];
  expl.post('/api/users/login').send({ password: password, remember: remember }).end(function (err, res) {
    assert2.ifError(err);
    assert2.empty(res.body.err);
    assert2.e(res.body.user.name, name);
    done(err, res);
  });
}

export function logout(done) {
  expl.post('/api/users/logout', function (err, res) {
    assert2.ifError(err);
    assert2.empty(res.body.err);
    done(err, res);
  });
}
