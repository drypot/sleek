var _ = require('underscore');
var _should = require('should');
var _express = require('express');

var _lang = require('./lang');
var _config = require("./config");
var _role = require("./role");
var _category = require("./category");
var _auth = require("./auth");
var _thread = require("./model/thread");
var _post = require("./model/post");
var _postForm = require("./form/postForm.js")

var NOT_AUTHORIZED = {error: 'not authorized'};

_lang.addInit(function (callback) {
	var ex = _express();

	ex.configure(function () {
		ex.use(_express.cookieParser('jfkldassev'));
		ex.use(_express.session());
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

	function assertRoleAny(req, res, next) {
		if (!req.session.role) {
			res.json(400, { error: 'login first'});
		} else {
			next();
		}
	}

	function assertRole(roleName) {
		return function(req, res, next) {
			if (!req.session.role) {
				res.json(400, {error: 'login first'});
			} else if (req.session.role.name !== roleName) {
				res.json(400, NOT_AUTHORIZED);
			} else {
				next();
			}
		}
	}

	function parseQuery(req, res, next) {
		req.query.categoryId = parseInt(req.query.categoryId || 0);
		req.query.threadId = parseInt(req.query.threadId || 0);
		req.query.postId = parseInt(req.query.postId || 0);
		next();
	}

	function parsePostForm(req, res, next) {
		req.params.postForm = _postForm.make(req.query.threadId, req.query.postId, req.body, req.files);
		next();
	}

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

	// post

	ex.post('/api/insert-thread', assertRoleAny, parseQuery, parsePostForm, function (req, res, next) {
		var form = req.params.postForm;
		var errors = [];

		if (!req.session.role.getCategory(req.query.categoryId).writable) {
			return res.json(400, NOT_AUTHORIZED);
		}

		form.validateThread(errors);
		form.validatePost(errors);
		if (errors.length) {
			return res.json(400, {error: 'invalid data', errors: errors});
		}

		form.insertThread(req.session.postList);
		form.insertPost(req.session.postList);
		res.json(200, {threadId: form.threadId});
	});

	ex.post('/api/insert-reply', assertRoleAny, parseQuery, parsePostForm, prepareThread, function (req, res) {
		var form = req.params.postForm;
		var errors = [];

		if (!req.session.role.getCategory(thread.categoryId).writable) {
			return res.json(400, NOT_AUTHORIZED);
		}

		form.validatePost(errors);
		if (errors.length) {
			return res.json(400, {error: 'invalid data', errors: errors});
		}

		form.insertPost(req.session.postList);
		form.updateLength();
		res.json(200, 'ok');
	});

	ex.get('/api/find-thread-list', assertRoleAny, parseQuery, function (req, res) {
		if (!req.session.role.getCategory(req.query.categoryId).readable) {
			return res.json(400, NOT_AUTHORIZED);
		}

//		return "post/list";

	});


	ex.get('/api/find-thread', assertRoleAny, parseQuery, function (req, res) {
		if (!req.session.role.getCategory(req.query.categoryId).readable) {
			return res.json(400, NOT_AUTHORIZED);
		}

//		postContext.updateThreadHit();
//		return "post/view";
	});

	ex.get('/api/find-post', assertRoleAny, parseQuery, function (req, res) {
		if (!req.session.role.getCategory(req.query.categoryId).readable) {
			return res.json(400, NOT_AUTHORIZED);
		}

//		return "post ...";
	});

	ex.put('/api/update-post', assertRoleAny, parseQuery, parsePostForm, prepareThread, preparePost, function (req, res) {
		var role = req.session.role;
		var thread = req.params.thread;
		var post = req.params.post;
		var hasTitle = thread.cdate === post.cdate;
		var form = req.params.postForm;
		var errors = [];

		if (!req.session.role.getCategory(thread.categoryId).writable) {
			return res.json(400, NOT_AUTHORIZED);
		}
		if (hasTitle && !req.session.role.getCategory(form.categoryId).writable) {
			return res.json(400, NOT_AUTHORIZED);
		}
		if (!_.include(req.session.postList, req.query.postId) &&
			!role.getCategory(thread.categoryId).editable) {
			return res.json(400, NOT_AUTHORIZED);
		}

		if (hasTitle) {
			form.validateTitle(errors);
		}
		form.validatePost(errors);
		if (errors.length) {
			return res.json(400, {error: 'invalid data', errors: errors});
		}

		if (hasTitle) {
			form.updateTitle(thread);
		}
		form.updatePost(post, role);

//		searchService.updatePost(thread, post);

	});

	// auth

	ex.post('/api/auth/login', function (req, res) {
		if (_auth.loginByPassword(req, req.body.password)) {
			res.json({
				role: {
					name: req.session.role.name
				}
			});
		} else {
			res.json(400, {error: 'login failed'});
		}
	});

	ex.post('/api/auth/logout', function (req, res) {
		_auth.logout(req);
		res.json('ok');
	});

	// category

	ex.get('/api/category', assertRoleAny, function (req, res) {
		res.json(req.session.role.categoryList);
	});

	// admin

	ex.post('/api/config/reload', assertRole('admin'), function (req, res) {
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

	ex.get('/api/test/assert-role-user', assertRole('user'), function (req, res) {
		res.json('ok');
	});

	ex.get('/api/test/assert-role-admin', assertRole('admin'), function (req, res) {
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

	ex.post('/api/test/parse-post-form', parseQuery, parsePostForm, function (req, res) {
		res.json(req.params.postForm);
	});

	ex.post('/api/test/validate-post-form-thread', parseQuery, parsePostForm, function (req, res) {
		var errors = [];
		req.params.postForm.validateThread(errors);
		res.json(200, {errors: errors});
	});

	ex.post('/api/test/validate-post-form-post', parseQuery, parsePostForm, function (req, res) {
		var errors = [];
		req.params.postForm.validatePost(errors);
		res.json(200, {errors: errors});
	});

	// start listening

	ex.listen(_config.appServerPort);
	console.info("express listening on port: %d", _config.appServerPort);
	callback();
});
