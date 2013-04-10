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
		var req = this;
		var res = this.res;
		var role = res.locals.role;
		if (!role) {
			res.sendRc(rcs.NOT_AUTHENTICATED);
		} else {
			if (typeof roleName === 'string') {
				if (role.name !== roleName) {
					res.sendRc(rcs.NOT_AUTHORIZED);
				} else {
					next();
				}
			} else {
				next = roleName;
				next();
			}
		}
	};

	var apiExp = /^\/api\//;

	should.not.exist(app.response.sendRc);
	app.response.sendRc = function (rc) {
		var res = this;
		var req = this.req;
		//var json = ~(req.headers.accept || '').indexOf('json');
		var json = apiExp.test(req.path);
		if (json) {
			res.json({ rc: rc });
		} else {
			if (rc === rcs.NOT_AUTHENTICATED) {
				res.redirect('/');
			} else {
				should.fail('TODO');
				res.render('error', {
					msg: rcs.msgs[rc]
				});
			}
		}
	};

};
