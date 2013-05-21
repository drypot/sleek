var init = require('../main/init');
var user9 = require('../main/user');

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
			res.locals.user = user9.findUserByName(req.session.uname);
			return next();
		}
		if (res.locals.api) {
			return next();
		}
		autoLogin(req, res, function (err, user) {
			if (err) return next(err);
			if (user) {
				res.locals.user = user;
			}
			next();
		});
	};

	function autoLogin(req, res, next) {
		var password = req.cookies.password;
		if (!password) {
			return next();
		}
		var user = user9.findUserByPassword(password);
		if (!user) {
			res.clearCookie(password);
			return next();
		}
		exports.initSession(req, user, function (err) {
			if (err) return next(err);
			next(null, user);
		});
	}

});
