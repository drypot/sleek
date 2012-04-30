var _ = require('underscore');
var express = require('express');
var redisStore = require('connect-redis')(express);

var l = require('./l.js');
var config = require('./config.js');
var auth = require('./auth.js');
var upload = require('./upload.js');
var msg = require('./msg.js');
var expressPost = require('./express-post.js');

var e;

l.addInit(function (next) {
	e = express();

e.configure(function () {
	e.use(express.cookieParser(config.cookieSecret));
	e.use(express.session({store: new redisStore()}));
	e.use(express.bodyParser({uploadDir: upload.tmpDir}));
	e.use(function (req, res, next) {
		res.set('Cache-Control', 'no-cache');
		next();
	});
	e.use(e.router);
});
	e.configure('development', function () {
		e.use(express.errorHandler({dumpExceptions: true, showStack: true}));
	});
	e.configure('production', function () {
		e.use(express.errorHandler());
	});

	expressPost.register(e);

	e.post('/api/login', function (req, res) {
		var role = auth.getRoleByPassword(req.body.password);
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

	e.post('/api/get-category', auth.checkLogin(), function (req, res) {
		var role = auth.getRoleByName(req.session.roleName);
		res.json(role && role.category);
	});

	e.post('/api/hello', function (req, res) {
		res.json('hello');
	});

	e.configure('development', function () {
		e.post('/api/test/set-session-var', function (req, res) {
			req.session.test_var = req.body.value;
			res.json('ok');
		});

		e.post('/api/test/get-session-var', function (req, res) {
			res.json(req.session.test_var);
		});

		e.post('/api/test/assert-role-any', auth.checkLogin(), function (req, res) {
			res.json('ok');
		});

		e.post('/api/test/assert-role-user', auth.checkLogin(), auth.checkRole('user'), function (req, res) {
			res.json('ok');
		});

		e.post('/api/test/assert-role-admin', auth.checkLogin(), auth.checkRole('admin'), function (req, res) {
			res.json('ok');
		});
	});

	next();
});

l.addAfterInit(function (next) {
	e.listen(config.appServerPort);
	console.info("express listening on port: %d", config.appServerPort);
	next();
});
