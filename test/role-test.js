var _ = require('underscore');
var should = require('should');

var l = require('../main/l');
var config = require("../main/config");
var role = require('../main/role.js');

before(function (next) {
	l.addBeforeInit(function (next) {
		config.param = { configPath: "config-dev/config-dev.xml" }
		next();
	});
	l.runInit(next);
});

describe('role.make', function () {
	it('can created role', function () {
		var r = role.make({name: 'user1', hash: 'xxx'});
		r.should.ok;
		r.name.should.equal('user1');
		r.hash.should.equal('xxx');
	});
});

describe('role.getByName', function () {
	it('can find role by name', function () {
		role.getByName('user').should.be.ok;
		role.getByName('cheater').should.be.ok;
		role.getByName('admin').should.be.ok;
		should(!role.getByName('xxx'));
	});
	it('can find user role', function () {
		var r = role.getByName('user');
		r.name.should.equal('user');
		r.checkPassword('1').should.ok;
		r.checkPassword('x').should.not.ok;
	});
	it('can find cheater role', function () {
		var r = role.getByName('cheater');
		r.name.should.equal('cheater');
		r.checkPassword('2').should.ok;
		r.checkPassword('x').should.not.ok;
	});
	it('can find admin role', function () {
		var r = role.getByName('admin');
		r.name.should.equal('admin');
		r.checkPassword('3').should.ok;
		r.checkPassword('x').should.not.ok;
	});
});

describe('role.getByPassword', function () {
	it('can return role by password', function () {
		role.getByPassword('1').name.should.equal('user');
		role.getByPassword('2').name.should.equal('cheater');
		role.getByPassword('3').name.should.equal('admin');
		should(!role.getByPassword('x'));
	})
});