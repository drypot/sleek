var _ = require('underscore');
var bcrypt = require('bcrypt');
var l = require('./l.js');

require('./config.js');

l.role = {};

l.init(function () {

	var role = {};

	_.each(l.config.role, function (rawRole) {
		var newRole = {
			name: rawRole.name,
			hash: rawRole.hash,
			category: {},
			readableCategory : [],
			writableCategory : []
		};
		_.each(l.config.category, function (rawCategory) {
			var newCategory = {
				id: rawCategory.id,
				name: rawCategory.name,
				sep: rawCategory.sep,
				readable: _.include(rawCategory.read, newRole.name),
				writable: _.include(rawCategory.write, newRole.name),
				editable: _.include(rawCategory.edit, newRole.name)
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

	console.log('role initialized:');

	l.role.roleByName = function (roleName) {
		return role[roleName];
	};

	l.role.roleByPassword = function (password) {
		return _.find(role, function (role) {
			return bcrypt.compareSync(password, role.hash);
		});
	};

});
