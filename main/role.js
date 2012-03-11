var _ = require('underscore');
var _should = require('should');
var _bcrypt = require('bcrypt');

var _l = require('./l');
var _config = require("./config");

var roleList = {};

// init

_l.addInit(function (next) {
	_.each(_config.roleList, function (role) {
		roleList[role.name] = make(role);
	});
	next();
});

// _role.*

var make = exports.make = function (obj) {
	return {
		name: obj.name,
		hash: obj.hash,
		category: {}
	}
}

var checkPassword = exports.checkPassword = function (role, password) {
	return _bcrypt.compareSync(password, role.hash);
};

exports.getByName = function (rolename) {
	return roleList[rolename];
};

exports.getByPassword = function (password) {
	return _.find(roleList, function (role) {
		return checkPassword(role, password);
	});
};

exports.each = function (func) {
	_.each(roleList, func);
}