var should = require('should');
var express = require('express');
var redisStore = require('connect-redis')(express);

var rcx = require('./rcx');

module.exports = function (opt) {

	var config = opt.config;
	var role = opt.role;
	var app = opt.app;

	app.disable('x-powered-by');

	app.locals.siteTitle = config.siteTitle;

	app.use(express.cookieParser(config.cookieSecret));

	if (opt.store === 'redis') {
		app.use(express.session({ store: new redisStore() }));
		console.log('session store: redis');
	} else {
		app.use(express.session());
		console.log('session store: memory');
	}

	app.use(express.bodyParser({ uploadDir: config.uploadDir + '/tmp' }));

	var roleByName = role.roleByName;
	app.use(function (req, res, next) {
		res.locals.role = roleByName(req.session.roleName);
		next();
	});

	app.use(app.router);

	// solve IE ajax caching problem.
	app.all('/api/*', function (req, res, next) {
		res.set('Cache-Control', 'no-cache');
		next();
	});

//	app.engine('dust', consolidate.dust); // extention to view engine mapping
//	app.set('view engine', 'dust'); // default view engine
//	app.set('views', process.cwd() + '/client/dust'); // view root

	app.use(express.errorHandler());

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
			if (rc === rcx.NOT_AUTHENTICATED) {
				res.redirect('/');
			} else {
				should.fail('TODO');
				res.render('error', {
					msg: rcx.textx[rc]
				});
			}
		}
	}

};
