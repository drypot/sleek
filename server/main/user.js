var bcrypt = require('bcrypt');

var init = require('../main/init');
var config = require('../main/config');

init.add(function () {

	console.log('user:');

	var users = {};

	config.data.users.forEach(function (user0) {
		var user = {
			name: user0.name,
			hash: user0.hash,
			admin: user0.admin ? true : false,
			categories: {},
			categoriesOrdered : []
		};
		users[user.name] = user;
		config.data.categories.forEach(function (category0) {
			var category = {
				id: category0.id,
				name: category0.name
			};
			if (user.admin || category0.users.indexOf(user.name) != -1) {
				user.categories[category.id] = category;
				user.categoriesOrdered.push(category);
			}
		});
	});

	exports.findUserByName = function (uname) {
		return users[uname];
	};

	exports.findUserByPassword = function (password) {
		for (var uname in users) {
			var user = users[uname];
			if (bcrypt.compareSync(password, user.hash)) {
				return user;
			}
		}
		return null;
	};

});
