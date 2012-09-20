var _ = require('underscore');
var express = require('express');
var redisStore = require('connect-redis')(express);
var dust = require('dustjs-linkedin');
var consolidate = require('consolidate');
var l = require('./l.js');

require('./config.js');
require('./role.js');

l.init(function () {

	var e = l.e = express();

	e.configure(function () {
		e.use(express.cookieParser(l.config.cookieSecret));
		e.use(express.session({ store: new redisStore() }));
		e.use(express.bodyParser({ uploadDir: l.config.uploadDir + '/tmp' }));

		e.use(function (req, res, next) {
			res.locals.role = l.role.roleByName(req.session.roleName);
			next();
		});

		e.use(e.router);

		// NODE_ENV=production 상태에서는 케쉬 때문에 *.dust 파일 수정해도 반영이 안 된다.
		e.engine('dust', consolidate.dust); // 확장자별 뷰 처리 엔진 등록
		e.set('view engine', 'dust'); // 뷰 기본 확장자 등록
		e.set('views', process.cwd() + '/html/dust'); // 뷰 루트 디렉토리 등록

		// To disable whitespace compression
		//dust.optimizers.format = function(ctx, node) { return node };

		e.locals.siteTitle = l.config.siteTitle;
		//e.locals._ = _;
		//e.locals._with = false; // for ejs

		e.all('/api/*', function (req, res, next) {
			// to solve IE ajax caching problem.
			res.set('Cache-Control', 'no-cache');
			next();
		});
	});

	e.configure('development', function () {
		e.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
	});

	e.configure('production', function () {
		e.use(express.errorHandler());
	});

});

l.init(1, function () {

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
