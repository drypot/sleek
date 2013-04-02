var _ = require('underscore');
var bcrypt = require('bcrypt');

var l = require('./l.js');
var config = require('./config.js');

var role = {};

exports.init = function () {
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
		role[newRole.name] = newRole;
	});
};

exports.roleByName = function (roleName) {
	return role[roleName];
};

exports.roleByPassword = function (password) {
	return _.find(role, function (role) {
		return bcrypt.compareSync(password, role.hash);
	});
};
