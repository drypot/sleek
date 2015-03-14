var should = require('should');

var init = require('../base/init');
var config = require('../base/config')({ path: 'config/sleek-test.json' });
var userb = require('../user/user-base');

before(function (next) {
	init.run(next);
});

describe("finding user by name", function () {
	it("should success", function () {
		userb.findUserByName('user').name.should.equal('user');
		userb.findUserByName('cheater').name.should.equal('cheater');
		userb.findUserByName('admin').name.should.equal('admin');
		should(!userb.findUserByName('xxx'));
	});
});

describe("finding user by password", function () {
	it("should success", function () {
		userb.findUserByPassword('1').name.should.equal('user');
		userb.findUserByPassword('2').name.should.equal('cheater');
		userb.findUserByPassword('3').name.should.equal('admin');
		should(!userb.findUserByPassword('x'));
	})
});

describe("user", function () {
	var user;
	before(function () {
		user = userb.findUserByName('user');
		should(user);
	});
	it("should not be admin", function () {
		should(!user.admin);
	});
	it("can access freetalk", function () {
		var c = user.categories[100];
		c.name.should.equal('freetalk');
	});
	it("can not access cheat", function () {
		var c = user.categories[60];
		should(!c);
	});
	it("can not access recycle bin", function () {
		var c = user.categories[40];
		should(!c);
	});
});

describe("cheater", function () {
	var user;
	before(function () {
		user = userb.findUserByName('cheater');
		should(user);
	});
	it("should not be admin", function () {
		should(!user.admin);
	});
	it("can access freetalk", function () {
		var c = user.categories[100];
		c.name.should.equal('freetalk');
	});
	it("can access cheat", function () {
		var c = user.categories[60];
		c.name.should.equal('cheat');
	});
	it("can not access recycle bin", function () {
		var c = user.categories[40];
		should(!c);
	});
});

describe("admin", function () {
	var user;
	before(function () {
		user = userb.findUserByName('admin');
	});
	it("should be admin", function () {
		should(user.admin);
	});
	it("can access freetalk", function () {
		var c = user.categories[100];
		c.name.should.equal('freetalk');
	});
	it("can access cheat", function () {
		var c = user.categories[60];
		c.name.should.equal('cheat');
	});
	it("can access recycle bin", function () {
		var c = user.categories[40];
		c.name.should.equal('recycle bin');
	});
});
