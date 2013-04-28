var should = require('should');
var express = require('express');
var redisStore = require('connect-redis')(express);

var init = require('../main/init');
var config = require('../main/config');
var auth = require('../main/auth');
var rcs = require('../main/rcs');
var msgs = require('../main/msgs');

var opt = {};

exports.options = function (_opt) {
	for(var p in _opt) {
		opt[p] = _opt[p];
	}
	return exports;
};

init.add(function () {

	var app = exports.app = express();
	var log = 'express:';

	app.disable('x-powered-by');

	app.engine('jade', require('jade').renderFile);
	app.set('view engine', 'jade'); // default view engine
	app.set('views', process.cwd() + '/client/jade'); // view root
	if ('development' == app.get('env')) {
		app.locals.pretty = true;
	}

	app.locals.siteTitle = config.data.siteTitle;

	app.use(express.cookieParser(config.data.cookieSecret));

	if (opt.store === 'redis') {
		app.use(express.session({ store: new redisStore() }));
		log += ' redis';
	} else {
		app.use(express.session());
		log += ' memory';
	}

	app.use(express.bodyParser({ uploadDir: config.data.uploadDir + '/tmp' }));

	app.use(function (req, res, next) {
		res.locals.role = auth.roleByName(req.session.roleName);
		res.locals.require = require;
		next();
	});

	app.use(app.router);

	// solve IE ajax caching problem.
	app.all('/api/*', function (req, res, next) {
		res.set('Cache-Control', 'no-cache');
		next();
	});

	app.get('/', function (req, res) {
		if (res.locals.role) {
			res.redirect('/threads');
		} else {
			res.render('index');
		}
	});

	app.use(express.errorHandler());

	should.not.exist(app.request.role);
	app.request.role = function (roleName, next) {
		if (typeof roleName === 'function') {
			next = roleName;
			roleName = null;
		}
		var req = this;
		var res = this.res;
		var role = res.locals.role;
		if (!role) {
			return next({ rc: rcs.NOT_AUTHENTICATED });
		}
		if (roleName && roleName !== role.name) {
			return next({ rc: rcs.NOT_AUTHORIZED });
		}
		next(null, role);
	};

	should.not.exist(app.request.roleHtml);
	app.request.roleHtml = function (roleName, next) {
		if (typeof roleName === 'function') {
			next = roleName;
			roleName = null;
		}
		var req = this;
		var res = this.res;
		var role = res.locals.role;
		if (!role) {
			return res.redirect('/');
		}
		if (roleName && roleName !== role.name) {
			return res.render('error', { err: { rc: rcs.NOT_AUTHORIZED }});
		}
		next(null, role);
	};

	exports.listen = function () {
		app.listen(config.data.port);
		log += ' ' + config.data.port;
		console.log(log);
	};

});
