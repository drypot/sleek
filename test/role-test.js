var _ = require('underscore');
var should = require('should');

var l = require('../main/l');
var Role = require('../main/role.js');
var test = require('./test.js');

console.log(typeof Role);
before(function (next) {
	test.prepare('config', next);
});

describe('Role', function () {
	it('can be created', function () {
		var r = new Role({name: 'user1', hash: 'xxx'});
		r.should.ok;
		r.name.should.equal('user1');
		r.hash.should.equal('xxx');
	});
});

describe('getByName', function () {
	it('can find role by name', function () {
		Role.getByName('user').should.be.ok;
		Role.getByName('cheater').should.be.ok;
		Role.getByName('admin').should.be.ok;
		should(!Role.getByName('xxx'));
	});
	it('can find user role', function () {
		var role = Role.getByName('user');
		role.name.should.equal('user');
		role.checkPassword('1').should.ok;
		role.checkPassword('x').should.not.ok;
	});
	it('can find cheater role', function () {
		var role = Role.getByName('cheater');
		role.name.should.equal('cheater');
		role.checkPassword('2').should.ok;
		role.checkPassword('x').should.not.ok;
	});
	it('can find admin role', function () {
		var role = Role.getByName('admin');
		role.name.should.equal('admin');
		role.checkPassword('3').should.ok;
		role.checkPassword('x').should.not.ok;
	});
});

describe('getByPassword', function () {
	it('can return role by password', function () {
		Role.getByPassword('1').name.should.equal('user');
		Role.getByPassword('2').name.should.equal('cheater');
		Role.getByPassword('3').name.should.equal('admin');
		should(!Role.getByPassword('x'));
	})
});