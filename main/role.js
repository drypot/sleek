var _ = require('underscore');
var _should = require('should');
var _bcrypt = require('bcrypt');

var _lang = require('./lang');
var _config = require("./config");

var roleList = exports.roleList = {};

// init

_lang.addInit(function (callback) {
	_.each(_config.roleList, function (role) {
		roleList[role.name] = new Role(role);
	});
	callback();
});

// role 의 init 등록 이후에 category 의 init 가 등록되어야 한다.

var _category = require('./category');

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


role.getCategory = function (categoryId) {
	return this.categoryList[categoryId] || _category.dummyCategory;
}

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
