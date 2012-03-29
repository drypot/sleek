var _ = require('underscore');
var bcrypt = require('bcrypt');

var l = require('./l.js');
var config = require('./config.js');
var msg = require('./msg.js');

// role

var roleMap = {};

l.addInit(function (next) {
	_.each(config.role, function (r) {
		var role = roleMap[r.name] = {
			name: r.name,
			hash: r.hash,
			category: {}
		}
		_.each(config.category, function (c) {
			var category = {
				id: c.id,
				name: c.name,
				all: c.id == 0,
				sep: c.sep,
				newLine: c.newLine,
				readable: _.include(c.read, role.name),
				writable: _.include(c.write, role.name),
				editable: _.include(c.edit, role.name)
			};
			if (category.readable) role.category[category.id] = category;
		});
	});
	console.log('auth initialized:');
	next();
});

exports.getRoleByName = function (roleName) {
	return roleMap[roleName];
};

exports.getRoleByPassword = function (password) {
	return _.find(roleMap, function (role) {
		return bcrypt.compareSync(password, role.hash);
	});
};

// filter

exports.filter = {};

exports.checkLogin = function () {
	return function (req, res, next) {
		if (!req.session.roleName) {
			return res.json(400, {error: msg.ERR_LOGIN_FIRST});
		}
		next();
	}
}

exports.checkRole = function (roleName) {
	return function(req, res, next) {
		if (req.session.roleName !== roleName) {
			return res.json(400, {error: msg.ERR_NOT_AUTHORIZED});
		}
		next();
	}
}

