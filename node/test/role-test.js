var _ = require('underscore');
var should = require('should');
var l = require('../main/l.js');

require('../main/role.js');
require('../main/test.js');

before(function (next) {
	l.init.run(next);
});

describe('roleByName()', function () {
	it('can find role by name', function () {
		l.role.roleByName('user').name.should.equal('user');
		l.role.roleByName('cheater').name.should.equal('cheater');
		l.role.roleByName('admin').name.should.equal('admin');
		should(!l.role.roleByName('xxx'));
	});
});

describe('roleByPassword()', function () {
	it('can find role by password', function () {
		l.role.roleByPassword('1').name.should.equal('user');
		l.role.roleByPassword('2').name.should.equal('cheater');
		l.role.roleByPassword('3').name.should.equal('admin');
		should(!l.role.roleByPassword('x'));
	})
});

describe('category', function () {
	var role;
	it('given user role', function () {
		role = l.role.roleByName('user');
	});
	it('should have all category', function () {
		var c = role.categories[0];
		c.should.ok;
		c.name.should.equal('all');
		c.readable.should.ok;
		c.writable.should.not.ok;
		c.editable.should.not.ok;
	});
	it('should have freetalk', function () {
		var c = role.categories[100];
		c.should.ok;
		c.name.should.equal('freetalk');
		c.readable.should.ok;
		c.writable.should.ok;
		c.editable.should.not.ok;
	});
	it('should not have cheat', function () {
		var c = role.categories[60];
		should(!c);
	});
	it('given admin role', function () {
		role = l.role.roleByName('admin');
	});
	it('should have all category', function () {
		var c = role.categories[0];
		c.should.ok;
		c.name.should.equal('all');
		c.readable.should.ok;
		c.writable.should.not.ok;
		c.editable.should.not.ok;
	});
	it('should have freetalk', function () {
		var c = role.categories[100];
		c.should.ok;
		c.name.should.equal('freetalk');
		c.readable.should.ok;
		c.writable.should.ok;
		c.editable.should.ok;
	});
	it('should have cheat', function () {
		var c = role.categories[60];
		c.should.ok;
		c.name.should.equal('cheat');
		c.readable.should.ok;
		c.writable.should.ok;
		c.editable.should.ok;
	});
});