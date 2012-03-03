var _ = require('underscore');
var _should = require('should');
var _bcrypt = require('bcrypt');

var _lang = require('./lang');
var _config = require("./config");

var roleList = exports.roleList = {};

// init

_lang.addInit(function (next) {
	_.each(_config.roleList, function (role) {
		roleList[role.name] = new Role(role);
	});
	next();
});

// Role.*

exports.make = function (obj) {
	return new Role(obj);
}

var Role = function (obj) {
	this.name = obj.name;
	this.hash = obj.hash;
	this.categoryList = {};
}

var role = Role.prototype;

role.checkPassword = function (password) {
	return _bcrypt.compareSync(password, this.hash);
};

// _role.*

exports.getByName = function (roleName) {
	return _.find(roleList, function (role) {
		return role.name === roleName;
	});
};

exports.getByPassword = function (password) {
	return _.find(roleList, function (role) {
		return role.checkPassword(password);
	});
};
