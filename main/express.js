var _ = require('underscore');
var _should = require('should');
var _express = require('express');
var _redisStore = require('connect-redis')(_express);

var _lang = require('./lang');
var _config = require("./config");
var _role = require("./role");
var _category = require("./category");
var _auth = require("./auth");
var _thread = require("./model/thread");
var _post = require("./model/post");
var _postForm = require("./form/postForm.js")

var ERR_LOGIN_FIRST = 'login first';
var ERR_LOGIN_FAILED = 'login failed';
var ERR_NOT_AUTHORIZED = 'not authorized';
var ERR_INVALID_DATA = 'invalid data';

_lang.addInit(function (next) {
	var ex = _express();

	ex.configure(function () {
		ex.use(_express.cookieParser('jfkldassev'));
		ex.use(_express.session({store: new _redisStore()}));
		ex.use(_express.bodyParser());
		ex.use(ex.router);
	});

	ex.configure('development', function () {
		ex.use(_express.errorHandler({ dumpExceptions: true, showStack: true }));
	});

	ex.configure('production', function () {
		ex.use(_express.errorHandler());
	});

	// pipe

	function assertLoggedIn(req, res, next) {
		if (!req.session.roleName) {
			return res.json(400, { error: ERR_LOGIN_FIRST });
		}
		next();
	}

	function assertRole(roleName) {
		return function(req, res, next) {
			if (req.session.roleName !== roleName) {
				return res.json(400, { error: ERR_NOT_AUTHORIZED });
			}
			next();
		}
	}

	function parseParams(req, res, next) {
		if (!req.body) {
			req.body = {};
		}
		req.body.categoryId = parseInt(req.body.categoryId || 0);
		req.body.threadId = parseInt(req.body.threadId || 0);
		req.body.postId = parseInt(req.body.postId || 0);
		next();
	}

	// post

	ex.post('/api/insert-thread', assertLoggedIn, parseParams, function (req, res, next) {
		var role = _role.getByName(req.session.roleName);
		var form = _postForm.make(req);
		var errors = [];

		if (!role.categoryList[form.categoryId].writable) {
			return res.json(400, { error: ERR_NOT_AUTHORIZED });
		}

		form.validateThread(errors);
		form.validatePost(errors);
		if (errors.length) {
			return res.json(400, { error: ERR_INVALID_DATA, errors: errors });
		}

		form.insertThread(req.session.postList);
		form.insertPost(req.session.postList);
		res.json(200, {threadId: form.threadId});
	});

	function prepareThread(req, res, next) {
	}

	function preparePost(req, res, next) {
		_post.findById(req.body.postId, function (err, post) {
			if (err) throw err;
			req.params.post = post;
			next();
		});
	}

	ex.post('/api/insert-reply', assertLoggedIn, parseParams, prepareThread, function (req, res) {
		var role = _role.getByName(req.session.roleName);
		var form = _postForm.make(req);
		var errors = [];

		_async.waterfall([
			function (next) {
				_thread.findById(req.body.threadId, function (err, thread) {
					if (err) throw err;
					req.params.thread = thread;
					next();
				});

			}
		]);
		if (!role.getCategory(thread.categoryId).writable) {
			return res.json(400, { error: ERR_NOT_AUTHORIZED });
		}

		form.validatePost(errors);
		if (errors.length) {
			return res.json(400, { error: ERR_INVALID_DATA, errors: errors });
		}

		form.insertPost(req.session.postList);
		form.updateLength();
		res.json(200, 'ok');
	});

	ex.post('/api/find-thread-list', assertLoggedIn, parseParams, function (req, res) {
		var role = _role.getByName(req.session.roleName);
		if (!role.getCategory(req.body.categoryId).readable) {
			return res.json(400, { error: ERR_NOT_AUTHORIZED });
		}

//		return "post/list";

	});


	ex.post('/api/find-thread', assertLoggedIn, parseParams, function (req, res) {
		var role = _role.getByName(req.session.roleName);
		if (!role.getCategory(req.body.categoryId).readable) {
			return res.json(400, { error: ERR_NOT_AUTHORIZED });
		}

//		postContext.updateThreadHit();
//		return "post/view";
	});

	ex.post('/api/find-post', assertLoggedIn, parseParams, function (req, res) {
		var role = _role.getByName(req.session.roleName); ;
		if (!role.getCategory(req.body.categoryId).readable) {
			return res.json(400, { error: ERR_NOT_AUTHORIZED });
		}

//		return "post ...";
	});

	ex.put('/api/update-post', assertLoggedIn, parseParams, prepareThread, preparePost, function (req, res) {
		var role = _role.getByName(req.session.roleName); ;
		var form = _postForm.make(req);
		var thread = req.params.thread;
		var post = req.params.post;
		var hasTitle = thread.cdate === post.cdate;
		var errors = [];

		if (!role.getCategory(thread.categoryId).writable) {
			return res.json(400, { error: ERR_NOT_AUTHORIZED });
		}
		if (hasTitle && !role.getCategory(form.categoryId).writable) {
			return res.json(400, { error: ERR_NOT_AUTHORIZED });
		}
		if (!_.include(req.session.postList, req.body.postId) && !role.getCategory(thread.categoryId).editable) {
			return res.json(400, { error: ERR_NOT_AUTHORIZED });
		}

		if (hasTitle) {
			form.validateTitle(errors);
		}
		form.validatePost(errors);
		if (errors.length) {
			return res.json(400, { error: ERR_INVALID_DATA, errors: errors });
		}

		if (hasTitle) {
			form.updateTitle(thread);
		}
		form.updatePost(post, role);

//		searchService.updatePost(thread, post);

	});

	// auth

	ex.post('/api/auth/login', function (req, res) {
		if (!_auth.loginByPassword(req, req.body.password)) {
			return res.json(400, { error: ERR_LOGIN_FAILED });
		}
		res.json({ role: { name: req.session.roleName } });
	});

	ex.post('/api/auth/logout', function (req, res) {
		_auth.logout(req);
		res.json('ok');
	});

	// category

	ex.post('/api/category', assertLoggedIn, function (req, res) {
		var role = _role.getByName(req.session.roleName);
		res.json(role.categoryList);
	});

	// admin

	ex.post('/api/config/reload', assertLoggedIn, assertRole('admin'), function (req, res) {
//		config.loadConfig();
//		categoryService.init();
	});

	// hello

	ex.post('/api/hello', function (req, res) {
		res.json('hello');
	});

	//
	// test support
	//

	// session

	ex.post('/api/test/set-session-var', function (req, res) {
		req.session.test_var = req.body.value;
		res.json('ok');
	});

	ex.post('/api/test/get-session-var', function (req, res) {
		res.json(req.session.test_var);
	});

	// permission

	ex.post('/api/test/assert-role-any', assertLoggedIn, function (req, res) {
		res.json('ok');
	});

	ex.post('/api/test/assert-role-user', assertLoggedIn, assertRole('user'), function (req, res) {
		res.json('ok');
	});

	ex.post('/api/test/assert-role-admin', assertLoggedIn, assertRole('admin'), function (req, res) {
		res.json('ok');
	});

	// parseParams

	ex.post('/api/test/parse-params', parseParams, function (req, res) {
		res.json(req.body);
	});

	// start listening

	ex.listen(_config.appServerPort);
	console.info("express listening on port: %d", _config.appServerPort);
	next();
});
