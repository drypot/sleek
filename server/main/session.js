var init = require('../main/init');
var uesrl = require('../main/user');

init.add(function () {

	console.log('session:');

	exports.initSession = function (req, user, next) {
		req.session.regenerate(function (err) {
			if (err) return next(err);
			req.session.uname = user.name;
			req.session.posts = [];
			next();
		});
	}

	exports.setLocals = function (req, res, next) {
		if (req.session.uname) {
			res.locals.user = uesrl.findUserByName(req.session.uname);
			return next();
		}
		if (res.locals.api) {
			return next();
		}
		var password = req.cookies.password;
		if (!password) {
			return next();
		}
		var user = uesrl.findUserByPassword(password);
		if (!user) {
			res.clearCookie(password);
			return next();
		}
		res.locals.user = user;
		exports.initSession(req, user, next);
	};

});
