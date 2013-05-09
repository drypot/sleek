var should = require('should');

var init = require('../main/init');
var config = require('../main/config')({ test: true });
var user9 = require('../main/user');

before(function (next) {
	init.run(next);
});

describe("finding user by name", function () {
	it("should success", function () {
		user9.findUserByName('user').name.should.equal('user');
		user9.findUserByName('cheater').name.should.equal('cheater');
		user9.findUserByName('admin').name.should.equal('admin');
		should(!user9.findUserByName('xxx'));
	});
});

describe("finding user by password", function () {
	it("should success", function () {
		user9.findUserByPassword('1').name.should.equal('user');
		user9.findUserByPassword('2').name.should.equal('cheater');
		user9.findUserByPassword('3').name.should.equal('admin');
		should(!user9.findUserByPassword('x'));
	})
});

describe("user", function () {
	var user;
	before(function () {
		user = user9.findUserByName('user');
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
		user = user9.findUserByName('cheater');
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
		user = user9.findUserByName('admin');
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
