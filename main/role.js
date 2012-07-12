var _ = require('underscore');
var bcrypt = require('bcrypt');
var l = require('./l.js');

require('./config.js');

l.init.init(function () {

	l.role = {};

	var roleMap = {};

	l.role.getRoleByName = function (roleName) {
		return roleMap[roleName];
	};

	l.role.getRoleByPassword = function (password) {
		return _.find(roleMap, function (role) {
			return bcrypt.compareSync(password, role.hash);
		});
	};

	_.each(l.config.role, function (r) {
		var role = roleMap[r.name] = {
			name: r.name,
			hash: r.hash,
			category: {},
			categoryAsArray : []
		}
		_.each(l.config.category, function (c) {
			var category = {
				id: c.id,
				name: c.name,
				sep: c.sep,
				readable: _.include(c.read, role.name),
				writable: _.include(c.write, role.name),
				editable: _.include(c.edit, role.name)
			};
			if (category.readable) {
				role.category[category.id] = category;
				role.categoryAsArray.push(category);
			}
		});
	});

	l.log('auth initialized:');

});
