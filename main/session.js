var _ = require('underscore');
var bcrypt = require('bcrypt');
var l = require('./l.js');

require('./const.js');

l.session = {};

l.init.init(function () {

	l.session.checkLogin = function () {
		return function (req, res, next) {
			if (!req.session.roleName) {
				return res.json({ rc: l.rc.NOT_AUTHENTICATED});
			}
			next();
		}
	};

	l.session.checkRole = function (roleName) {
		return function(req, res, next) {
			if (req.session.roleName !== roleName) {
				return res.json({ rc: l.rc.NOT_AUTHORIZED});
			}
			next();
		}
	};

});
