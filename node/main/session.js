var _ = require('underscore');
var bcrypt = require('bcrypt');
var l = require('./l.js');

require('./const.js');
require('./express.js');

l.session = {};

l.init(function () {

	var api = /^\/api\//;

	l.session.authorized = function (res, roleName, next) {
		var role = res.locals.role;
		if (!role) {
			if (api.test(res.req.path)) {
				res.json({ rc: l.rc.NOT_AUTHENTICATED });
			} else {
				res.redirect('/');
			}
		} else {
			if (_.isString(roleName)) {
				if (role.name !== roleName) {
					return res.json({ rc: l.rc.NOT_AUTHORIZED});
				} else {
					next();
				}
			} else {
				next = roleName;
				next();
			}
		}
	}

});
