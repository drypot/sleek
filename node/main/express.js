var _ = require('underscore');
var express = require('express');
var redisStore = require('connect-redis')(express);
var l = require('./l.js');

require('./config.js');
require('./role.js');

l.init.init(function () {

	var e = l.e = express();

	e.configure(function () {
		e.use(express.cookieParser(l.config.cookieSecret));
		e.use(express.session({ store: new redisStore() }));
		e.use(express.bodyParser({ uploadDir: l.config.uploadDir + '/tmp' }));
		e.use(function (req, res, next) {

			res.locals.role = l.role.getRoleByName(req.session.roleName);

			next();
		});
		e.use(e.router);

		e.set('views', process.cwd() + '/html/ejs');
		e.set('view engine', 'ejs');

		e.locals.l = l;
		e.locals._ = _;
		e.locals._with = false;

		e.all('/api/*', function (req, res, next) {
			// to solve IE ajax caching problem.
			res.set('Cache-Control', 'no-cache');
			next();
		});
	});

	e.configure('development', function () {
		e.use(express.errorHandler({dumpExceptions: true, showStack: true}));
	});

	e.configure('production', function () {
		e.use(express.errorHandler());
	});

});

l.init.afterInit(function () {

	var e = l.e;

	e.get('/api/hello', function (req, res) {
		res.json('hello');
	});

	e.get('/test', function (req, res) {
		res.render('test');
	});

	if (!l.config.expressDisabled) {
		e.listen(l.config.serverPort);
		console.log("express listening on port: %d", l.config.serverPort);
	}

});
