var rcx = require('./rcx');

exports.authorized = function (res, roleName, next) {
	var role = res.locals.role;
	if (!role) {
		res.sendRc(rcx.NOT_AUTHENTICATED);
	} else {
		if (typeof roleName === 'string') {
			if (role.name !== roleName) {
				res.sendRc(rcx.NOT_AUTHORIZED);
			} else {
				next();
			}
		} else {
			next = roleName;
			next();
		}
	}
};