var _ = require('underscore');
var should = require('should');

var l = require('./l.js');
var Role = require('./role.js');
var msg = require('./msg.js');
var auth = require('./auth.js');

exports.register = function (e) {
	e.post('/api/login', function (req, res) {
		var role = Role.getByPassword(req.body.password);
		if (!role) {
			return res.json(400, { error: msg.ERR_LOGIN_FAILED });
		}
		req.session.roleName = role.name;
		req.session.post = [];
		if (req.cookies && req.cookies.lv3) {
			res.clearCookie('lv3');
			res.clearCookie('lv');
			res.clearCookie('ph');
			res.clearCookie('uname');
		}
		res.json({ role: { name: role.name } });
	});

	e.post('/api/logout', function (req, res) {
		req.session.destroy();
		res.json('ok');
	});

	e.configure('development', function () {
		e.post('/api/test/assert-role-any', auth.filter.login(), function (req, res) {
			res.json('ok');
		});

		e.post('/api/test/assert-role-user', auth.filter.login(), auth.filter.role('user'), function (req, res) {
			res.json('ok');
		});

		e.post('/api/test/assert-role-admin', auth.filter.login(), auth.filter.role('admin'), function (req, res) {
			res.json('ok');
		});
	});
}

