var _ = require('underscore');
var should = require('should');
var l = require('../main/l.js');

require('../main/role.js');
require('../main/test.js');

before(function (next) {
	l.init.run(next);
});

describe('getRoleByName()', function () {
	it('can find role by name', function () {
		l.role.getRoleByName('user').name.should.equal('user');
		l.role.getRoleByName('cheater').name.should.equal('cheater');
		l.role.getRoleByName('admin').name.should.equal('admin');
		should(!l.role.getRoleByName('xxx'));
	});
});

describe('getRoleByPassword()', function () {
	it('can find role by password', function () {
		l.role.getRoleByPassword('1').name.should.equal('user');
		l.role.getRoleByPassword('2').name.should.equal('cheater');
		l.role.getRoleByPassword('3').name.should.equal('admin');
		should(!l.role.getRoleByPassword('x'));
	})
});

describe('category', function () {
	var role;
	it('given user role', function () {
		role = l.role.getRoleByName('user');
	});
	it('should have all category', function () {
		var c = role.category[0];
		c.should.ok;
		c.name.should.equal('all');
		c.readable.should.ok;
		c.writable.should.not.ok;
		c.editable.should.not.ok;
	});
	it('should have freetalk', function () {
		var c = role.category[100];
		c.should.ok;
		c.name.should.equal('freetalk');
		c.readable.should.ok;
		c.writable.should.ok;
		c.editable.should.not.ok;
	});
	it('should not have cheat', function () {
		var c = role.category[60];
		should(!c);
	});
	it('given admin role', function () {
		role = l.role.getRoleByName('admin');
	});
	it('should have all category', function () {
		var c = role.category[0];
		c.should.ok;
		c.name.should.equal('all');
		c.readable.should.ok;
		c.writable.should.not.ok;
		c.editable.should.not.ok;
	});
	it('should have freetalk', function () {
		var c = role.category[100];
		c.should.ok;
		c.name.should.equal('freetalk');
		c.readable.should.ok;
		c.writable.should.ok;
		c.editable.should.ok;
	});
	it('should have cheat', function () {
		var c = role.category[60];
		c.should.ok;
		c.name.should.equal('cheat');
		c.readable.should.ok;
		c.writable.should.ok;
		c.editable.should.ok;
	});
});