var should = require('should');

var init = require('../base/init');
var config = require('../base/config')({ path: 'config/sleek-test.json' });
var userb = require('../user/user-base');

before(function (done) {
  init.run(done);
});

describe("finding user by name", function () {
  it("should success", function () {
    userb.findUserByName('user').name.should.equal('user');
    userb.findUserByName('cheater').name.should.equal('cheater');
    userb.findUserByName('admin').name.should.equal('admin');
    should.not.exist(userb.findUserByName('xxx'));
  });
});

describe("finding user by password", function () {
  it("should success", function () {
    userb.findUserByPassword('1').name.should.equal('user');
    userb.findUserByPassword('2').name.should.equal('cheater');
    userb.findUserByPassword('3').name.should.equal('admin');
    should.not.exist(userb.findUserByPassword('x'));
  })
});

describe("user", function () {
  var user;
  it("given user", function () {
    user = userb.findUserByName('user');
    should.exist(user);
  });
  it("should not be admin", function () {
    user.admin.should.false;
  });
  it("can access freetalk", function () {
    var c = user.categoryIndex[100];
    c.name.should.equal('freetalk');
  });
  it("can not access cheat", function () {
    var c = user.categoryIndex[60];
    should.not.exist(c);
  });
  it("can not access recycle bin", function () {
    var c = user.categoryIndex[40];
    should.not.exist(c);
  });
});

describe("cheater", function () {
  var user;
  it("given cheater", function () {
    user = userb.findUserByName('cheater');
    should.exist(user);
  });
  it("should not be admin", function () {
    user.admin.should.false;
  });
  it("can access freetalk", function () {
    var c = user.categoryIndex[100];
    c.name.should.equal('freetalk');
  });
  it("can access cheat", function () {
    var c = user.categoryIndex[60];
    c.name.should.equal('cheat');
  });
  it("can not access recycle bin", function () {
    var c = user.categoryIndex[40];
    should.not.exist(c);
  });
});

describe("admin", function () {
  var user;
  it("given admin", function () {
    user = userb.findUserByName('admin');
  });
  it("should be admin", function () {
    user.admin.should.true;
  });
  it("can access freetalk", function () {
    var c = user.categoryIndex[100];
    c.name.should.equal('freetalk');
  });
  it("can access cheat", function () {
    var c = user.categoryIndex[60];
    c.name.should.equal('cheat');
  });
  it("can access recycle bin", function () {
    var c = user.categoryIndex[40];
    c.name.should.equal('recycle bin');
  });
});
