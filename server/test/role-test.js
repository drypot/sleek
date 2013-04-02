var _ = require('underscore');
var should = require('should');

var l = require('../main/l.js');
var config = require('../main/config.js');
var role = require('../main/role.js');

before(function (next) {
	config.init({ test: true }, next);
});

before(function (next) {
	role.init(next);
});

describe('roleByName()', function () {
	it('can find role by name', function () {
		role.roleByName('user').name.should.equal('user');
		role.roleByName('cheater').name.should.equal('cheater');
		role.roleByName('admin').name.should.equal('admin');
		should.not.exist(role.roleByName('xxx'));
	});
});

describe('roleByPassword()', function () {
	it('can find role by password', function () {
		role.roleByPassword('1').name.should.equal('user');
		role.roleByPassword('2').name.should.equal('cheater');
		role.roleByPassword('3').name.should.equal('admin');
		should.not.exist(role.roleByPassword('x'));
	})
});

describe('user role', function () {
	var roleX;
	before(function () {
		roleX = role.roleByName('user');
	});
	it('should have all category', function () {
		var c = roleX.category[0];
		c.should.ok;
		c.name.should.equal('all');
		c.readable.should.ok;
		c.writable.should.not.ok;
		c.editable.should.not.ok;
	});
	it('should have freetalk', function () {
		var c = roleX.category[100];
		c.should.ok;
		c.name.should.equal('freetalk');
		c.readable.should.ok;
		c.writable.should.ok;
		c.editable.should.not.ok;
	});
	it('should not have cheat', function () {
		var c = roleX.category[60];
		should(!c);
	});
});

describe('admin role', function () {
	var roleX;
	before(function () {
		roleX = role.roleByName('admin');
	});
	it('should have all category', function () {
		var c = roleX.category[0];
		c.should.ok;
		c.name.should.equal('all');
		c.readable.should.ok;
		c.writable.should.not.ok;
		c.editable.should.not.ok;
	});
	it('should have freetalk', function () {
		var c = roleX.category[100];
		c.should.ok;
		c.name.should.equal('freetalk');
		c.readable.should.ok;
		c.writable.should.ok;
		c.editable.should.ok;
	});
	it('should have cheat', function () {
		var c = roleX.category[60];
		c.should.ok;
		c.name.should.equal('cheat');
		c.readable.should.ok;
		c.writable.should.ok;
		c.editable.should.ok;
	});
});
