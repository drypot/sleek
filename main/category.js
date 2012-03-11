var _ = require('underscore');
var _should = require('should');

var _l = require('./l');
var _config = require('./config');
var _role = require('./role');

// init

_l.addInit(function (next) {
	_.each(_config.categoryList, function (el) {
		_role.each(function (role) {
			var c = make(el, role.name);
			if (c.readable) role.category[c.id] = c;
		});
	});
	next();
});

// Category.*

var make = exports.make = function (obj, roleName) {
	var id = parseInt(obj.id || obj.categoryId)
	return {
		id: id,
		name: obj.name,
		all: id == 0,
		sep: !!obj.sep,
		newLine: !!obj.newLine,
		readable: _.include((obj.read || '').split(' '), roleName),
		writable: _.include((obj.write || '').split(' '), roleName),
		editable: _.include((obj.edit || '').split(' '), roleName)
	};
}
