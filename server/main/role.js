var bcrypt = require('bcrypt');

module.exports = function (opt, next) {

	var exports = {};

	var config = opt.config;
	var roleMap = {};

	config.role.forEach(function (configRole) {
		var role = {
			name: configRole.name,
			hash: configRole.hash,
			category: {},
			readableCategory : [],
			writableCategory : []
		};
		config.category.forEach(function (configCategory) {
			var category = {
				id: configCategory.id,
				name: configCategory.name,
				sep: configCategory.sep,
				readable: configCategory.read.indexOf(role.name) != -1,
				writable: configCategory.write.indexOf(role.name) != -1,
				editable: configCategory.edit.indexOf(role.name) != -1
			};
			if (category.readable) {
				role.category[category.id] = category;
				role.readableCategory.push(category);
			}
			if (category.writable) {
				role.writableCategory.push(category);
			}
		});
		roleMap[role.name] = role;
	});

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

	next(exports);
};

