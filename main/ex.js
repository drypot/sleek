var _ = require('underscore');
var express = require('express');
var redisStore = require('connect-redis')(express);
var l = require('./l.js');

require('./config.js');

l.init.init(function () {
	var ex = l.ex = express();

	ex.configure(function () {
		ex.use(express.cookieParser(l.config.cookieSecret));
		ex.use(express.session({store: new redisStore()}));
		ex.use(express.bodyParser({uploadDir: l.config.uploadTmpDir}));
		ex.use(function (req, res, next) {
			// to solve IE ajax caching problem.
			res.set('Cache-Control', 'no-cache');
			next();
		});
		ex.use(ex.router);
	});
	ex.configure('development', function () {
		ex.use(express.errorHandler({dumpExceptions: true, showStack: true}));
	});
	ex.configure('production', function () {
		ex.use(express.errorHandler());
	});
});

l.init.afterInit(function () {
	var e = l.ex;

	e.get('/api/hello', function (req, res) {
		res.json('hello');
	});

	e.listen(l.config.serverPort);
	l.log("express listening on port: %d", l.config.serverPort);
});
