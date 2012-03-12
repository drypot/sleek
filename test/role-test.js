var _ = require('underscore');
var _should = require('should');

var _l = require('../main/l');
var _config = require("../main/config");
var _role = require('../main/role');

before(function (next) {
	_l.addBeforeInit(function (next) {
		_config.initParam = { configPath: "config-dev/config-dev.xml" }
		next();
	});
	_l.runInit(next);
});

describe('_role.make', function () {
	it('can created role', function () {
		var role = _role.make({name: 'user1', hash: 'xxx'});
		role.should.ok;
		role.name.should.equal('user1');
		role.hash.should.equal('xxx');
	});
});

describe('_role.getByName', function () {
	it('can find role by name', function () {
		_role.getByName('user').should.be.ok;
		_role.getByName('cheater').should.be.ok;
		_role.getByName('admin').should.be.ok;
		_should(!_role.getByName('xxx'));
	});
	it('can find user role', function () {
		var role = _role.getByName('user');
		role.name.should.equal('user');
		role.checkPassword('1').should.ok;
		role.checkPassword('x').should.not.ok;
	});
	it('can find cheater role', function () {
		var role = _role.getByName('cheater');
		role.name.should.equal('cheater');
		role.checkPassword('2').should.ok;
		role.checkPassword('x').should.not.ok;
	});
	it('can find admin role', function () {
		var role = _role.getByName('admin');
		role.name.should.equal('admin');
		role.checkPassword('3').should.ok;
		role.checkPassword('x').should.not.ok;
	});
});

describe('_role.getByPassword', function () {
	it('can return role by password', function () {
		_role.getByPassword('1').name.should.equal('user');
		_role.getByPassword('2').name.should.equal('cheater');
		_role.getByPassword('3').name.should.equal('admin');
		_should(!_role.getByPassword('x'));
	})
});