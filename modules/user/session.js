var init = require('../base/init');
var userb = require('../user/user-base');

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
			res.locals.user = userb.findUserByName(req.session.uname);
			return next();
		}
		if (res.locals.api) {
			return next();
		}
		var password = req.cookies.password;
		if (!password) {
			return next();
		}
		var user = userb.findUserByPassword(password);
		if (!user) {
			res.clearCookie(password);
			return next();
		}
		res.locals.user = user;
		exports.initSession(req, user, next);
	};

});
