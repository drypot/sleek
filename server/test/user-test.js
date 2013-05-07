var should = require('should');

var init = require('../main/init');
var config = require('../main/config')({ test: true });
var user9 = require('../main/user');

before(function (next) {
	init.run(next);
});

describe("findUserByName()", function () {
	it("can find user by name", function () {
		user9.findUserByName('user').name.should.equal('user');
		user9.findUserByName('cheater').name.should.equal('cheater');
		user9.findUserByName('admin').name.should.equal('admin');
		should.not.exist(user9.findUserByName('xxx'));
	});
});

describe("findUserByPassword()", function () {
	it("can find user by password", function () {
		user9.findUserByPassword('1').name.should.equal('user');
		user9.findUserByPassword('2').name.should.equal('cheater');
		user9.findUserByPassword('3').name.should.equal('admin');
		should.not.exist(user9.findUserByPassword('x'));
	})
});

describe("user", function () {
	var user;
	before(function () {
		user = user9.findUserByName('user');
	});
	it("should have all category", function () {
		var c = user.categories[0];
		c.should.ok;
		c.name.should.equal('all');
		c.readable.should.ok;
		c.writable.should.not.ok;
		c.editable.should.not.ok;
	});
	it("should have freetalk", function () {
		var c = user.categories[100];
		c.should.ok;
		c.name.should.equal('freetalk');
		c.readable.should.ok;
		c.writable.should.ok;
		c.editable.should.not.ok;
	});
	it("should not have cheat", function () {
		var c = user.categories[60];
		should(!c);
	});
});

describe("admin", function () {
	var user;
	before(function () {
		user = user9.findUserByName('admin');
	});
	it("should have all category", function () {
		var c = user.categories[0];
		c.should.ok;
		c.name.should.equal('all');
		c.readable.should.ok;
		c.writable.should.not.ok;
		c.editable.should.not.ok;
	});
	it("should have freetalk", function () {
		var c = user.categories[100];
		c.should.ok;
		c.name.should.equal('freetalk');
		c.readable.should.ok;
		c.writable.should.ok;
		c.editable.should.ok;
	});
	it("should have cheat", function () {
		var c = user.categories[60];
		c.should.ok;
		c.name.should.equal('cheat');
		c.readable.should.ok;
		c.writable.should.ok;
		c.editable.should.ok;
	});
});
