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
			categories: {},
			categoriesForMenu : [],
			categoriesForNew : []
		};
		config.data.categories.forEach(function (category0) {
			var category = {
				id: category0.id,
				name: category0.name,
				sep: category0.sep,
				readable: category0.read.indexOf(user.name) != -1,
				writable: category0.write.indexOf(user.name) != -1,
				editable: category0.edit.indexOf(user.name) != -1
			};
			if (category.readable) {
				user.categories[category.id] = category;
				user.categoriesForMenu.push(category);
			}
			if (category.writable) {
				user.categoriesForNew.push(category);
			}
		});
		users[user.name] = user;
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
