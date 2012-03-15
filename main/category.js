var _ = require('underscore');

var l = require('./l.js');
var config = require('./config.js');
var Role = require('./role.js');

// init

l.init.add(function (next) {
	_.each(config.category, function (cx) {
		Role.each(function (role) {
			var c = new Category(cx, role.name);
			if (c.readable) role.category[c.id] = c;
		});
	});
	next();
});

// Category

var Category = module.exports = function (c, roleName) {
	this.id = parseInt(c.id || c.categoryId);
	this.name = c.name;
	this.all = this.id == 0;
	this.sep = !!c.sep;
	this.newLine = !!c.newLine;
	this.readable = _.include((c.read || '').split(' '), roleName);
	this.writable = _.include((c.write || '').split(' '), roleName);
	this.editable = _.include((c.edit || '').split(' '), roleName);
}
