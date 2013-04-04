var _ = require('underscore');
var bcrypt = require('bcrypt');
var l = require('./l');

require('./msg');
require('./express');

l.session = {};

l.init(function () {

	l.session.authorized = function (res, roleName, next) {
		var role = res.locals.role;
		if (!role) {
			l.resError(res, l.rc.NOT_AUTHENTICATED);
		} else {
			var checkRoleName = _.isString(roleName);
			if (checkRoleName) {
				if (role.name !== roleName) {
					l.resError(res, l.rc.NOT_AUTHORIZED);
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
