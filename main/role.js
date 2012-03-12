var _ = require('underscore');
var _should = require('should');
var _bcrypt = require('bcrypt');

var _l = require('./l');
var _config = require("./config");

var role = {};

// init

_l.addInit(function (next) {
	_.each(_config.role, function (x) {
		role[x.name] = new Role(x);
	});
	next();
});

// Role

var Role = function (obj) {
	this.name = obj.name;
	this.hash = obj.hash;
	this.category = {};
}

var proto = Role.prototype;

proto.checkPassword = function (password) {
	return _bcrypt.compareSync(password, this.hash);
};

// _role.*

exports.make = function (x) {
	return new Role(x);
}

exports.getByName = function (roleName) {
	return role[roleName];
};

exports.getByPassword = function (password) {
	return _.find(role, function (role) {
		return role.checkPassword(password);
	});
};

exports.each = function (func) {
	_.each(role, func);
}