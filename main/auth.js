var _ = require('underscore');
var should = require('should');

var l = require('./l.js');
var msg = require('./msg.js');

exports.filter = {};

exports.filter.login = function () {
	return function (req, res, next) {
		if (!req.session.roleName) {
			return res.json(400, {error: msg.ERR_LOGIN_FIRST});
		}
		next();
	}
}

exports.filter.role = function (roleName) {
	return function(req, res, next) {
		if (req.session.roleName !== roleName) {
			return res.json(400, {error: msg.ERR_NOT_AUTHORIZED});
		}
		next();
	}
}

