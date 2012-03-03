var _ = require('underscore');
var _should = require('should');
var _request = require('request');

var _lang = require('../main/lang');
var _config = require('../main/config');
var _role = require('../main/role');
var _auth = require('../main/auth');

before(function (done) {
	_lang.addBeforeInit(function (callback) {
		_config.initParam = { configPath: "config-dev/config-dev.xml" }
		callback();
	});	_lang.runInit(done);
});

describe('auth', function () {
	it('should fail with wrong password', function () {
		var req = { session: {} };
		_auth.loginByPassword(req, 'xxx').should.not.ok;
	});
	it('should return user', function () {
		var req = { session: {} };
		_auth.loginByPassword(req, '1').should.ok;
		req.session.role.should.equal(_role.getByName('user'));
	});
	it('can login as admin', function () {
		var req = { session: {} };
		_auth.loginAsAdmin(req);
		req.session.role.should.equal(_role.getByName('admin'));
	});
});