var _ = require('underscore');
var bcrypt = require('bcrypt');
var l = require('./l.js');

require('./config.js');

l.role = {};

l.init(function () {

	var role = {};

	_.each(l.config.role, function (role0) {
		var role1 = {
			name: role0.name,
			hash: role0.hash,
			category: {},
			unsortedCategory : []
		}
		role[role1.name] = role1;
		_.each(l.config.category, function (category0) {
			var category1 = {
				id: category0.id,
				name: category0.name,
				sep: category0.sep,
				readable: _.include(category0.read, role1.name),
				writable: _.include(category0.write, role1.name),
				editable: _.include(category0.edit, role1.name)
			};
			if (category1.readable) {
				role1.category[category1.id] = category1;
				role1.unsortedCategory.push(category1);
			}
		});
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
