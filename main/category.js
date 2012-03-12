var _ = require('underscore');
var _should = require('should');

var _l = require('./l');
var _config = require('./config');
var _role = require('./role');

// init

_l.addInit(function (next) {
	_.each(_config.category, function (cx) {
		_role.each(function (rx) {
			var c = new Category(cx, rx.name);
			if (c.readable) rx.category[c.id] = c;
		});
	});
	next();
});

// Category.*

var Category = function (x, roleName) {
	this.id = parseInt(x.id || x.categoryId);
	this.name = x.name;
	this.all = this.id == 0;
	this.sep = !!x.sep;
	this.newLine = !!x.newLine;
	this.readable = _.include((x.read || '').split(' '), roleName);
	this.writable = _.include((x.write || '').split(' '), roleName);
	this.editable = _.include((x.edit || '').split(' '), roleName);
}

// _category.*

exports.make = function (x, roleName) {
	return new Category(x, roleName);
}
