var _ = require('underscore');
var _should = require('should');

var _lang = require('./lang');
var _config = require('./config');
var _role = require('./role');

// init

_lang.addInit(function (callback) {
	_.each(_config.categoryList, function (el) {
		_.each(_role.roleList, function (role) {
			var c = new Category(el, role.name);
			if (c.readable) role.categoryList[c.id] = c;
		});
	});
	callback();
});

// Category.*

exports.make = function (obj, roleName) {
	return new Category(obj, roleName);
}

var Category = exports.Category = function (obj, roleName) {
	this.id = parseInt(obj.id || obj.categoryId);
	this.name = obj.name;
	this.all = this.id == 0;
	this.sep = !!obj.sep;
	this.newLine = !!obj.newLine;
	this.readable = (obj.read || '').split(' ').indexOf(roleName) >= 0;
	this.writable = (obj.write || '').split(' ').indexOf(roleName) >= 0;
	this.editable = (obj.edit || '').split(' ').indexOf(roleName) >= 0;
}
