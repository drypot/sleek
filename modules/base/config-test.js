var should = require('should');

var init = require('../base/init');
var config = require('../base/config');

describe("config with invalid path", function () {
  it("should fail", function (done) {
    config({ reset: true, path: 'config/config-none.json' });
    init.run(function (err) {
      should.exists(err);
      err.code.should.equal('ENOENT');
      done();
    });
  });
});

describe("config with test: true", function () {
  it("should success", function (done) {
    config({ reset: true, test: true });
    init.run(function (err) {
      should.not.exists(err);
      config.data.appName.should.equal("sleek test");
      done();
    });
  });
});

describe("config with valid path", function () {
  it("should success", function (done) {
    config({ reset: true, path: 'config/config-test.json' });
    init.run(function (err) {
      should.not.exists(err);
      config.data.appName.should.equal("sleek test");
      done();
    });
  });
});