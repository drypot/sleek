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

_lang.addInit(function (callback) {
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

	function parseQuery(req, res, next) {
		req.query.categoryId = parseInt(req.query.categoryId || 0);
		req.query.threadId = parseInt(req.query.threadId || 0);
		req.query.postId = parseInt(req.query.postId || 0);
		next();
	}

	// post

	ex.post('/api/insert-thread', assertLoggedIn, parseQuery, function (req, res, next) {
		var role = _role.getByName(req.session.roleName);
		var form = _postForm.make(req.query.threadId, req.query.postId, req.body, req.files);
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
		_thread.findById(req.query.threadId, function (err, thread) {
			if (err) throw err;
			req.params.thread = thread;
			next();
		});
	}

	function preparePost(req, res, next) {
		_post.findById(req.query.postId, function (err, post) {
			if (err) throw err;
			req.params.post = post;
			next();
		});
	}

	ex.post('/api/insert-reply', assertLoggedIn, parseQuery, prepareThread, function (req, res) {
		var role = _role.getByName(req.session.roleName);
		var form = _postForm.make(req.query.threadId, req.query.postId, req.body, req.files);
		var errors = [];

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

	ex.get('/api/find-thread-list', assertLoggedIn, parseQuery, function (req, res) {
		var role = _role.getByName(req.session.roleName);
		if (!role.getCategory(req.query.categoryId).readable) {
			return res.json(400, { error: ERR_NOT_AUTHORIZED });
		}

//		return "post/list";

	});


	ex.get('/api/find-thread', assertLoggedIn, parseQuery, function (req, res) {
		var role = _role.getByName(req.session.roleName);
		if (!role.getCategory(req.query.categoryId).readable) {
			return res.json(400, { error: ERR_NOT_AUTHORIZED });
		}

//		postContext.updateThreadHit();
//		return "post/view";
	});

	ex.get('/api/find-post', assertLoggedIn, parseQuery, function (req, res) {
		var role = _role.getByName(req.session.roleName); ;
		if (!role.getCategory(req.query.categoryId).readable) {
			return res.json(400, { error: ERR_NOT_AUTHORIZED });
		}

//		return "post ...";
	});

	ex.put('/api/update-post', assertLoggedIn, parseQuery, prepareThread, preparePost, function (req, res) {
		var role = _role.getByName(req.session.roleName); ;
		var form = _postForm.make(req.query.threadId, req.query.postId, req.body, req.files);
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
		if (!_.include(req.session.postList, req.query.postId) && !role.getCategory(thread.categoryId).editable) {
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

	ex.get('/api/category', assertLoggedIn, function (req, res) {
		var role = _role.getByName(req.session.roleName);
		res.json(role.categoryList);
	});

	// admin

	ex.post('/api/config/reload', assertLoggedIn, assertRole('admin'), function (req, res) {
//		config.loadConfig();
//		categoryService.init();
	});

	// ping

	ex.post('/api/ping', function (req, res) {
		res.json('ok');
	});

	// hello

	ex.get('/api/hello', function (req, res) {
		res.json('hello');
	});

	// permission test support

	ex.get('/api/test/assert-role-any', assertLoggedIn, function (req, res) {
		res.json('ok');
	});

	ex.get('/api/test/assert-role-user', assertLoggedIn, assertRole('user'), function (req, res) {
		res.json('ok');
	});

	ex.get('/api/test/assert-role-admin', assertLoggedIn, assertRole('admin'), function (req, res) {
		res.json('ok');
	});

	// session test support

	ex.post('/api/test/session-set', function (req, res) {
		req.session.test_var = req.body.value;
		res.json('ok');
	});

	ex.get('/api/test/session-get', function (req, res) {
		res.json(req.session.test_var);
	});

	// parser test support

	ex.get('/api/test/parse-query', parseQuery, function (req, res) {
		res.json(req.query);
	});

	ex.post('/api/test/parse-post-form', parseQuery, function (req, res) {
		var form = _postForm.make(req.query.threadId, req.query.postId, req.body, req.files);
		res.json(form);
	});

	ex.post('/api/test/validate-post-form-thread', parseQuery, function (req, res) {
		var form = _postForm.make(req.query.threadId, req.query.postId, req.body, req.files);
		var errors = [];
		form.validateThread(errors);
		res.json(200, { errors: errors });
	});

	ex.post('/api/test/validate-post-form-post', parseQuery, function (req, res) {
		var form = _postForm.make(req.query.threadId, req.query.postId, req.body, req.files);
		var errors = [];
		form.validatePost(errors);
		res.json(200, { errors: errors });
	});

	// start listening

	ex.listen(_config.appServerPort);
	console.info("express listening on port: %d", _config.appServerPort);
	callback();
});
