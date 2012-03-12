var _ = require('underscore');
var _should = require('should');

var _l = require('./l');
var _role = require('./role');

exports.loginByPassword = function (req, password) {
	var role = _role.getByPassword(password);
	if (!role) {
		return false;
	}
	req.session.roleName = role.name;
	req.session.post = [];
	if (req.cookies && req.cookies.lv3) {
		res.clearCookie('lv3');
		res.clearCookie('lv');
		res.clearCookie('ph');
		res.clearCookie('uname');
	}
	return true;
}

exports.loginAsAdmin = function (req) {
	req.session.roleName = _role.getByName('admin').name;
}

exports.logout = function (req) {
	req.session.destroy();
}

