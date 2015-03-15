var should = require('should');

var init = require('../base/init');
var local = require('../main/local');

init.add(function () {
  exports.logout = function (done) {
    local.del('/api/sessions', function (err, res) {
      should.not.exist(err);
      res.error.should.false;
      should.not.exist(res.body.err);
      done();
    });
  }

  exports.loginUser = function (done) {
    local.post('/api/sessions').send({ password: '1' }).end(function (err, res) {
      should.not.exist(err);
      res.error.should.false;
      should.not.exist(res.body.err);
      res.body.user.name.should.equal('user');
      done();
    });
  }

  exports.loginAdmin = function (done) {
    local.post('/api/sessions').send({ password: '3' }).end(function (err, res) {
      should.not.exist(err);
      res.error.should.false;
      should.not.exist(res.body.err);
      res.body.user.name.should.equal('admin');
      done();
    });
  }
});
