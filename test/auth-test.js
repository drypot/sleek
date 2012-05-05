var _ = require('underscore');
var should = require('should');

var l = require('../main/l');
var auth = require('../main/auth.js');
var test = require('../main/test.js');

before(function (next) {
	test.prepare('config', next);
});

describe('role', function () {
	describe('getRoleByName', function () {
		it('can find role by name', function () {
			auth.getRoleByName('user').name.should.equal('user');
			auth.getRoleByName('cheater').name.should.equal('cheater');
			auth.getRoleByName('admin').name.should.equal('admin');
			should(!auth.getRoleByName('xxx'));
		});
	});
	describe('getRoleByPassword', function () {
		it('can find role by password', function () {
			auth.getRoleByPassword('1').name.should.equal('user');
			auth.getRoleByPassword('2').name.should.equal('cheater');
			auth.getRoleByPassword('3').name.should.equal('admin');
			should(!auth.getRoleByPassword('x'));
		})
	});
});

describe('category', function () {
	describe('for user', function () {
		var role;
		before(function () {
			role = auth.getRoleByName('user');
		});
		it('has all category', function () {
			var c = role.category[0];
			c.should.ok;
			c.name.should.equal('all');
			c.readable.should.ok;
			c.writable.should.not.ok;
			c.editable.should.not.ok;
		});
		it('has freetalk', function () {
			var c = role.category[100];
			c.should.ok;
			c.name.should.equal('freetalk');
			c.readable.should.ok;
			c.writable.should.ok;
			c.editable.should.not.ok;
		});
		it('has not cheat', function () {
			var c = role.category[60];
			should(!c);
		});
	});
	describe('category for admin', function () {
		var role;
		before(function () {
			role = auth.getRoleByName('admin');
		});
		it('has all category', function () {
			var c = role.category[0];
			c.should.ok;
			c.name.should.equal('all');
			c.readable.should.ok;
			c.writable.should.not.ok;
			c.editable.should.not.ok;
		});
		it('has freetalk', function () {
			var c = role.category[100];
			c.should.ok;
			c.name.should.equal('freetalk');
			c.readable.should.ok;
			c.writable.should.ok;
			c.editable.should.ok;
		});
		it('has cheat', function () {
			var c = role.category[60];
			c.should.ok;
			c.name.should.equal('cheat');
			c.readable.should.ok;
			c.writable.should.ok;
			c.editable.should.ok;
		});
	});
});

