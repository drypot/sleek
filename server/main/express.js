var _ = require('underscore');
var express = require('express');
var redisStore = require('connect-redis')(express);

//var dust = require('dustjs-linkedin');
//var consolidate = require('consolidate');

var l = require('./l.js');
var config = require('./config.js');
var role = require('./role.js');

exports.init = function () {

	var app = express();
	var roleByName = role.roleByName;

	app.configure(function () {
		app.use(express.cookieParser(config.cookieSecret));
		app.use(express.session({ store: new redisStore() }));
		app.use(express.bodyParser({ uploadDir: config.uploadDir + '/tmp' }));

		app.use(function (req, res, next) {
			res.locals.role = roleByName(req.session.roleName);
			next();
		});

		app.use(app.router);

		// NODE_ENV=production 상태에서는 케쉬 때문에 *.dust 파일 수정해도 반영이 안 된다.
		app.engine('dust', consolidate.dust); // 확장자별 뷰 처리 엔진 등록
		app.set('view engine', 'dust'); // 뷰 기본 확장자 등록
		app.set('views', process.cwd() + '/client/dust'); // 뷰 루트 디렉토리 등록

		// To disable whitespace compression
		//dust.optimizers.format = function(ctx, node) { return node };

		app.locals.siteTitle = config.siteTitle;
		//e.locals._ = _;
		//e.locals._with = false; // for ejs

		app.all('/api/*', function (req, res, next) {
			// to solve IE ajax caching problem.
			res.set('Cache-Control', 'no-cache');
			next();
		});
	});

	app.configure('development', function () {
		app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
	});

	app.configure('production', function () {
		app.use(express.errorHandler());
	});

	app.get('/api/hello', function (req, res) {
		res.json('hello');
	});

//	e.get('/error/:rc([0-9]+)', function (req, res) {
//		var rc = l.int(req.params, 'rc', 0);
//		res.render('error', {
//			//title: 'Error',
//			msg: l.rcMsg[rc]
//		});
//	});

	var api = /^\/api\//;

	l.resError = function (res, rc) {
		if (api.test(res.req.path)) {
			res.json({ rc: rc });
		} else {
			if (rc === l.rc.NOT_AUTHENTICATED) {
				res.redirect('/');
			} else {
				res.render('error', {
					msg: l.rcMsg[rc]
				});
			}
		}
	}
};

l.init(1, function () {

	if (!config.expressDisabled) {
		l.e.listen(config.serverPort);
		console.log("express listening on port: %d", config.serverPort);
	}

});
