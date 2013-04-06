var rcs = require('./rcs');

exports.authorized = function (res, roleName, next) {
	var role = res.locals.role;
	if (!role) {
		res.sendRc(rcs.NOT_AUTHENTICATED);
	} else {
		if (typeof roleName === 'string') {
			if (role.name !== roleName) {
				res.sendRc(rcs.NOT_AUTHORIZED);
			} else {
				next();
			}
		} else {
			next = roleName;
			next();
		}
	}
};