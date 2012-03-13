var _ = require('underscore');

var l = require('./l.js');
var config = require('./config.js');
var role = require('./role.js');

// init

l.addInit(function (next) {
	_.each(config.category, function (cx) {
		role.each(function (r) {
			var c = new Category(cx, r.name);
			if (c.readable) r.category[c.id] = c;
		});
	});
	next();
});

// Category.*

var Category = function (c, roleName) {
	this.id = parseInt(c.id || c.categoryId);
	this.name = c.name;
	this.all = this.id == 0;
	this.sep = !!c.sep;
	this.newLine = !!c.newLine;
	this.readable = _.include((c.read || '').split(' '), roleName);
	this.writable = _.include((c.write || '').split(' '), roleName);
	this.editable = _.include((c.edit || '').split(' '), roleName);
}

// category$.*

exports.make = function (c, roleName) {
	return new Category(c, roleName);
}
