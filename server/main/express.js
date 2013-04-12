var should = require('should');
var express = require('express');
var redisStore = require('connect-redis')(express);

var rcs = require('./rcs');

module.exports = function (opt) {

	var config = opt.config;
	var auth = opt.auth;
	var app = opt.app;

	app.disable('x-powered-by');

//	app.engine('dust', consolidate.dust); // extention to view engine mapping
//	app.set('view engine', 'dust'); // default view engine
//	app.set('views', process.cwd() + '/client/dust'); // view root

	app.locals.siteTitle = config.siteTitle;

	app.use(express.cookieParser(config.cookieSecret));

	if (opt.store === 'redis') {
		app.use(express.session({ store: new redisStore() }));
		console.log('session: redis');
	} else {
		app.use(express.session());
		console.log('session: memory');
	}

	app.use(express.bodyParser({ uploadDir: config.uploadDir + '/tmp' }));

	app.use(function (req, res, next) {
		res.locals.role = auth.roleByName(req.session.roleName);
		next();
	});

	app.use(app.router);

	// solve IE ajax caching problem.
	app.all('/api/*', function (req, res, next) {
		res.set('Cache-Control', 'no-cache');
		next();
	});

	app.get('/', function (req, res) {
		res.render('TODO: home');
//		if (res.locals.role) {
//			res.redirect('/thread');
//		} else {
//			res.locals.title = 'Login';
//			res.render('index');
//		}
	});

	app.use(express.errorHandler());

	should.not.exist(app.request.authorized);
	app.request.authorized = function (roleName, next) {
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

	should.not.exist(app.request.authorizedHtml);
	app.request.authorizedHtml = function (roleName, next) {
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
			return res.render('error', { msg: rcs.msgs[rcs.NOT_AUTHORIZED] });
		}
		next(role);
	};

};
