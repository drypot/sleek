var _ = require('underscore');
var _should = require('should');

var _lang = require('../main/lang');
var _config = require("../main/config");
var _role = require('../main/role');

_config.initParam = { configPath: "config-dev/config-dev.xml" }

before(function (done) {
	_lang.runInit(done);
});

describe('role object', function () {
	it('can be created', function () {
		var role = _role.make({name: 'user1', hash: 'xxx'});
		role.should.ok;
		role.name.should.equal('user1');
		role.hash.should.equal('xxx');
	});
})

describe('role list', function () {
	it('can return role by name', function () {
		_role.getByName('user').should.be.ok;
		_role.getByName('cheater').should.be.ok;
		_role.getByName('admin').should.be.ok;
		_should.ok(!_role.getByName('xxx'));
	});
	it('have user role', function () {
		var role = _role.getByName('user');
		role.name.should.equal('user');
		role.checkPassword('1').should.ok;
		role.checkPassword('x').should.not.ok;
	});
	it('have cheater role', function () {
		var role = _role.getByName('cheater');
		role.name.should.equal('cheater');
		role.checkPassword('2').should.ok;
		role.checkPassword('x').should.not.ok;
	});
	it('have admin role', function () {
		var role = _role.getByName('admin');
		role.name.should.equal('admin');
		role.checkPassword('3').should.ok;
		role.checkPassword('x').should.not.ok;
	});
	it('can return role by password', function () {
		_role.getByPassword('1').name.should.equal('user');
		_role.getByPassword('2').name.should.equal('cheater');
		_role.getByPassword('3').name.should.equal('admin');
		_should.ok(!_role.getByPassword('x'));
	})
});