var _ = require('underscore');
var bcrypt = require('bcrypt');

var l = require('./l.js');
var config = require('./config.js');

var roleMap = {};

exports.init = function (next) {
	config.role.forEach(function (configRole) {
		var newRole = {
			name: configRole.name,
			hash: configRole.hash,
			category: {},
			readableCategory : [],
			writableCategory : []
		};
		config.category.forEach(function (configCategory) {
			var newCategory = {
				id: configCategory.id,
				name: configCategory.name,
				sep: configCategory.sep,
				readable: _.include(configCategory.read, newRole.name),
				writable: _.include(configCategory.write, newRole.name),
				editable: _.include(configCategory.edit, newRole.name)
			};
			if (newCategory.readable) {
				newRole.category[newCategory.id] = newCategory;
				newRole.readableCategory.push(newCategory);
			}
			if (newCategory.writable) {
				newRole.writableCategory.push(newCategory);
			}
		});
		roleMap[newRole.name] = newRole;
	});
	next();
};

exports.roleByName = function (roleName) {
	return roleMap[roleName];
};

exports.roleByPassword = function (password) {
	for (var roleName in roleMap) {
		var role = roleMap[roleName];
		if (bcrypt.compareSync(password, role.hash)) {
			return role;
		}
	}
	return null;
};
