var _ = require('underscore');
var should = require('should');

var l = require('./l.js');
var role$ = require('./role.js');
var msg = require('./msg.js');

// filter

exports.loginFilter = function () {
	return function (req, res, next) {
		if (!req.session.roleName) {
			return res.json(400, {error: msg.ERR_LOGIN_FIRST});
		}
		next();
	}
}

exports.roleFilter = function (roleName) {
	return function(req, res, next) {
		if (req.session.roleName !== roleName) {
			return res.json(400, {error: msg.ERR_NOT_AUTHORIZED});
		}
		next();
	}
}

// api

exports.register = function (ex) {
	ex.post('/api/login', function (req, res) {
		var role = role$.getByPassword(req.body.password);
		if (!role) {
			return res.json(400, { error: msg.ERR_LOGIN_FAILED });
		}
		req.session.roleName = role.name;
		req.session.post = [];
		if (req.cookies && req.cookies.lv3) {
			res.clearCookie('lv3');
			res.clearCookie('lv');
			res.clearCookie('ph');
			res.clearCookie('uname');
		}
		res.json({ role: { name: role.name } });
	});

	ex.post('/api/logout', function (req, res) {
		req.session.destroy();
		res.json('ok');
	});
}
