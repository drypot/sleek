var _ = require('underscore');

var l = require('./l.js');
var role = require('./role.js');
var auth = require('./auth.js');

exports.register = function (e) {
	e.post('/api/get-category', auth.filter.login(), function (req, res) {
		var r = role.getByName(req.session.roleName);
		res.json(r && r.category);
	});
}

