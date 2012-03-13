var _ = require('underscore');
var bcrypt = require('bcrypt');

var l = require('./l.js');
var config = require('./config.js');

var role = {};

// init

l.addInit(function (next) {
	_.each(config.role, function (r) {
		role[r.name] = new Role(r);
	});
	next();
});

// Role

var Role = function (r) {
	this.name = r.name;
	this.hash = r.hash;
	this.category = {};
}

var proto = Role.prototype;

proto.checkPassword = function (password) {
	return bcrypt.compareSync(password, this.hash);
};

// role$.*

exports.make = function (r) {
	return new Role(r);
}

exports.getByName = function (roleName) {
	return role[roleName];
};

exports.getByPassword = function (password) {
	return _.find(role, function (r) {
		return r.checkPassword(password);
	});
};

exports.each = function (func) {
	_.each(role, func);
}