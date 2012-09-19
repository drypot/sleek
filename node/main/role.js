var _ = require('underscore');
var bcrypt = require('bcrypt');
var l = require('./l.js');

require('./config.js');

l.init(function () {

	l.role = {};

	var roles = {};

	_.each(l.config.roles, function (r) {
		var role = {
			name: r.name,
			hash: r.hash,
			categories: {},
			categoriesUnsorted : []
		}
		roles[r.name] = role;
		_.each(l.config.categories, function (c) {
			var category = {
				id: c.id,
				name: c.name,
				sep: c.sep,
				readable: _.include(c.read, role.name),
				writable: _.include(c.write, role.name),
				editable: _.include(c.edit, role.name)
			};
			if (category.readable) {
				role.categories[category.id] = category;
				role.categoriesUnsorted.push(category);
			}
		});
	});

	console.log('role initialized:');

	l.role.roleByName = function (roleName) {
		return roles[roleName];
	};

	l.role.roleByPassword = function (password) {
		return _.find(roles, function (role) {
			return bcrypt.compareSync(password, role.hash);
		});
	};

});
