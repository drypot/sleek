var _ = require('underscore');
var _should = require('should');

var _lang = require('./lang');
var _role = require('./role');

exports.loginByPassword = function (req, password) {
	var role = _role.getByPassword(password);
	if (!role) {
		return false;
	}
	req.session.role = role;
	req.session.postList = [];
	if (req.cookies.lv3) {
		res.clearCookie('lv3');
		res.clearCookie('lv');
		res.clearCookie('ph');
		res.clearCookie('uname');
	}
	return true;
}

exports.loginAsAdmin = function (req) {
	req.session.role = _role.getAdmin();
}

exports.logout = function (req) {
	req.session.destroy();
}

