var should = require('should');
var express = require('express');
var redisStore = require('connect-redis')(express);

var init = require('../main/init');
var config = require('../main/config');
var user9 = require('../main/user');
var upload = require('../main/upload');
var error = require('../main/error');

var opt = {};

exports = module.exports = function (_opt) {
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
	app.locals.pretty = true;

	app.locals.siteTitle = config.data.siteTitle;

	app.use(express.cookieParser(config.data.cookieSecret));

	app.use(express.session({ store: new redisStore({ ttl: 1800 /* 단위: 초. 30 분 */ }) }));
	log += ' redis';

//	app.use(express.session());
//	log += ' memory';

	app.use(express.bodyParser({ uploadDir: upload.tmp }));

	app.use(function (req, res, next) {
		res.locals.user = user9.findUserByName(req.session.userName);
		next();
	});

	app.use(app.router);

	// solve IE ajax caching problem.
	app.all('/api/*', function (req, res, next) {
		res.set('Cache-Control', 'no-cache');
		next();
	});

	app.use(express.errorHandler());


	// req, res utilities

	should.not.exist(app.request.findUser);
	app.request.findUser = function (userName, next) {
		if (typeof userName === 'function') {
			next = userName;
			userName = null;
		}
		var req = this;
		var res = this.res;
		var user = res.locals.user;
		if (!user) {
			return next(error(error.NOT_AUTHENTICATED));
		}
		if (userName && userName !== user.name) {
			return next(error(error.NOT_AUTHORIZED));
		}
		next(null, user);
	};

	var empty = {};

	app.response.jsonEmpty = function (err) {
		this.json(empty);
	}

	var cut5LinesPattern = /^(?:.*\n){1,5}/m;
	var emptyMatch = [''];

	app.response.safeJson = function (obj) {
		// IE9 + ajaxForm + multipart/form-data 사용할 경우 application/json 으로 리턴하면 저장하려든다.
		if (this.req.get('accept').indexOf('json') != -1) {
			this.json(obj);
		} else {
			this.send(JSON.stringify(obj));
		}
	};

	app.response.jsonErr = function (err) {
		var err2 = {};
		for (var key in err) {
			err2[key] = err[key];
		}
		err2.message = err.message;
		err2.stack = (err.stack.match(cut5LinesPattern) || emptyMatch)[0];
		this.safeJson({ err: err2 });
	}

	app.response.renderErr = function (err) {
		if (err.rc && err.rc == error.NOT_AUTHENTICATED) {
			this.render('auto-login');
			return;
		}
		var err2 = {};
		for (var key in err) {
			err2[key] = err[key];
		}
		err2.message = err.message;
		err2.stack = err.stack;
		this.render('error', { err: err2 });
	}

	exports.listen = function () {
		app.listen(config.data.port);
		log += ' ' + config.data.port;
		console.log(log);
	};


	// for test

	var request = require('superagent').agent();
	var url = 'http://localhost:' + config.data.port;
	var methods = [ 'post', 'get', 'put', 'del' ];

	for (var i = 0; i < methods.length; i++) {
		var method = methods[i];
		exports[method] = (function (method) {
			return function () {
				arguments[0] = url + arguments[0];
				return request[method].apply(request, arguments);
			}
		})(method)
	}

});
