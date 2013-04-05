var bcrypt = require('bcrypt');

var roleMap = {};

exports.init = function (opt) {
	opt.role.forEach(function (configRole) {
		var role = {
			name: configRole.name,
			hash: configRole.hash,
			category: {},
			readableCategory : [],
			writableCategory : []
		};
		opt.category.forEach(function (configCategory) {
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
