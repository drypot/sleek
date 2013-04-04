var express = require('express');
var redisStore = require('connect-redis')(express);

var l = require('./l');
var config = require('./config');
var role = require('./role');

exports.init = function (opt, next) {

	if (typeof opt === 'function') {
		next = opt;
		opt = {};
	}

	var app = exports.app = express();

	app.disable('x-powered-by');

	app.locals.siteTitle = config.siteTitle;

	app.use(express.cookieParser(config.cookieSecret));

	if (opt.redisStore) {
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

//	app.use(function (err, req, res, next) {
//		if (api.test(res.req.path)) {
//			res.json({ rc: rc });
//		} else {
//			if (rc === l.rc.NOT_AUTHENTICATED) {
//				res.redirect('/');
//			} else {
//				res.render('error', {
//					msg: l.rcMsg[rc]
//				});
//			}
//		}
//	});

	next();

};
