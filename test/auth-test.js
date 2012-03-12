var _ = require('underscore');
var _should = require('should');
var _request = require('request');

var _l = require('../main/l');
var _config = require('../main/config');
var _role = require('../main/role');
var _auth = require('../main/auth');

before(function (next) {
	_l.addBeforeInit(function (next) {
		_config.initParam = { configPath: "config-dev/config-dev.xml" }
		next();
	});	_l.runInit(next);
});

describe('loginByPassword', function () {
	it('should success with user password', function () {
		var req = { session: {} };
		_auth.loginByPassword(req, '1').should.ok;
		req.session.roleName.should.equal(_role.getByName('user').name);
	});
	it('should fail with wrong password', function () {
		var req = { session: {} };
		_auth.loginByPassword(req, 'xxx').should.not.ok;
	});
});

describe('loginAsAdmin', function () {
	it('should success', function () {
		var req = { session: {} };
		_auth.loginAsAdmin(req);
		req.session.roleName.should.equal(_role.getByName('admin').name);
	});
});