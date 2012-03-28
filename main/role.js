var _ = require('underscore');
var bcrypt = require('bcrypt');

var l = require('./l.js');
var config = require('./config.js');

// for init role.category
var Category = require('./category.js');

// init

l.init.add(function (next) {
	_.each(config.role, function (r) {
		Role.list[r.name] = new Role(r);
	});
	next();
});

// Role

var Role = module.exports = function (r) {
	this.name = r.name;
	this.hash = r.hash;
	this.category = {};
}

var proto = Role.prototype;

proto.checkPassword = function (password) {
	return bcrypt.compareSync(password, this.hash);
};

Role.list = {};

Role.getByName = function (roleName) {
	return this.list[roleName];
};

Role.getByPassword = function (password) {
	return _.find(this.list, function (role) {
		return role.checkPassword(password);
	});
};

Role.each = function (func) {
	_.each(this.list, func);
}