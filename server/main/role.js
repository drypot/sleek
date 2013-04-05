var bcrypt = require('bcrypt');

var l = require('./l');
var config = require('./config');

var roleMap = {};

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
				readable: configCategory.read.indexOf(newRole.name) != -1,
				writable: configCategory.write.indexOf(newRole.name) != -1,
				editable: configCategory.edit.indexOf(newRole.name) != -1
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
