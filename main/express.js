var _ = require('underscore');
var _should = require('should');
var _async = require('async');
var _express = require('express');
var _redisStore = require('connect-redis')(_express);
var _fs = require('fs');

var _lang = require('./lang');
var _config = require('./config');
var _role = require('./role');
var _category = require('./category');
var _auth = require('./auth');
var _thread = require('./model/thread');
var _post = require('./model/post');
var _postForm = require('./form/post-form')

var ERR_LOGIN_FIRST = 'login first';
var ERR_LOGIN_FAILED = 'login failed';
var ERR_NOT_AUTHORIZED = 'not authorized';
var ERR_INVALID_DATA = 'invalid data';

_lang.addInit(function (next) {
	_async.series([
		function (next) {
			_lang.mkdirs(_config.uploadDir, 'tmp', next);
		},
		function (next) {
			_lang.mkdirs(_config.uploadDir, 'post', next);
		}
	], next);
});

_lang.addInit(function (next) {
	var ex = _express();
	var uploadDir = _config.uploadDir + '/tmp';

	console.log('upload directory: ' + uploadDir);

	_fs.readdir(uploadDir, function (err, files) {
		_.each(files, function (file) {
			_fs.unlink(uploadDir + '/' + file);
		});
	});

	ex.configure(function () {
		ex.use(_express.cookieParser('jfkldassev'));
		ex.use(_express.session({store: new _redisStore()}));
		ex.use(_express.bodyParser({uploadDir: uploadDir}));
		ex.use(ex.router);
		//ex.use(removeTmpFile);
		//ex.use(function () {});
	});

	ex.configure('development', function () {
		ex.use(_express.errorHandler({dumpExceptions: true, showStack: true}));
	});

	ex.configure('production', function () {
		ex.use(_express.errorHandler());
	});

	// pipe

//	function removeTmpFile(req, res, next) {
//		console.log(req.path);
//		function remove(file) {
//			console.log('delete: ' + file.path);
//			_fs.unlink(file.path);
//		}
//
//		_.each(req.files, function (file) {
//			if (_.isArray(file)) {
//				_.each(file, remove);
//			} else {
//				remove(file);
//			}
//		});
//		next();
//	}

	function assertLoggedIn(req, res, next) {
		if (!req.session.roleName) {
			return res.json(400, {error: ERR_LOGIN_FIRST});
		}
		next();
	}

	function assertRole(roleName) {
		return function(req, res, next) {
			if (req.session.roleName !== roleName) {
				return res.json(400, {error: ERR_NOT_AUTHORIZED});
			}
			next();
		}
	}

	// post

	ex.post('/api/send-thread-list', assertLoggedIn, function (req, res) {
		var role = _role.getByName(req.session.roleName);
		var categoryId = _lang.intp(body, 'categoryId', 0);

		if (!role.categoryList[categoryId].readable) {
			return res.json(400, {error: ERR_NOT_AUTHORIZED});
		}
//		return "post/list";
	});

	ex.post('/api/send-thread', assertLoggedIn, function (req, res) {
		var role = _role.getByName(req.session.roleName);
		var categoryId = _lang.intp(body, 'categoryId', 0);

		if (!role.categoryList[categoryId].readable) {
			return res.json(400, {error: ERR_NOT_AUTHORIZED});
		}

//		postContext.updateThreadHit();
//		return "post/view";
	});

	ex.post('/api/send-post', assertLoggedIn, function (req, res) {
		var role = _role.getByName(req.session.roleName); ;
		var categoryId = _lang.intp(body, 'categoryId', 0);

		if (!role.categoryList[categoryId].readable) {
			return res.json(400, {error: ERR_NOT_AUTHORIZED});
		}

//		return "post ...";
	});

	ex.post('/api/create-thread', assertLoggedIn, function (req, res, next) {
		var role = _role.getByName(req.session.roleName);
		var form = _postForm.make(req);
		var errors = [];

		if (!role.categoryList[form.categoryId].writable) {
			return res.json(400, {error: ERR_NOT_AUTHORIZED});
		}

		form.validateCreateThread(errors);
		if (errors.length) {
			return res.json(400, {error: ERR_INVALID_DATA, errors: errors});
		}

		form.createThread(function (err, thread, post) {
			if (err) return next(err);
			req.session.postList.push(post._id);
			res.json(200, {threadId: thread._id, postId: post._id});
		});
	});

	ex.post('/api/create-post', assertLoggedIn, function (req, res, next) {
		var role = _role.getByName(req.session.roleName);
		var form = _postForm.make(req);
		var errors = [];

		form.findThread(function (err, thread) {
			if (err) return next(err);
			if (!role.categoryList[thread.categoryId].writable) {
				return res.json(400, {error: ERR_NOT_AUTHORIZED});
			}

			form.validateCreatePost(errors);
			if (errors.length) {
				return res.json(400, {error: ERR_INVALID_DATA, errors: errors});
			}

			form.createPost(thread, function (err, post) {
				if (err) return next(err);
				req.session.postList.push(post._id);
				res.json(200, {postId: post._id});
			});
		});
	});

	ex.put('/api/update-post', assertLoggedIn, function (req, res, next) {
		var role = _role.getByName(req.session.roleName);
		var form = _postForm.make(req);
		var errors = [];

		form.findThreadAndPost(function (err, thread, post) {
			if (err) return next(err);

			var shouldUpdateThread = thread.cdate === post.cdate;
			var category = role.categoryList[thread.categoryId];

			if (!category.writable ||
				!(_.include(req.session.postList, form.postId) || category.editable) ||
				(shouldUpdateThread && !role.categoryList[form.categoryId].writable)) {
				return res.json(400, {error: ERR_NOT_AUTHORIZED});
			}

			form.validateUpdate(shouldUpdateThread, errors);
			if (errors.length) {
				return res.json(400, {error: ERR_INVALID_DATA, errors: errors});
			}

			form.update(thread, post, shouldUpdateThread, category.editable, function (err) {
				if (err) return next(err);
				res.json(200, 'ok');
			});
		});
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

	// test support

	ex.configure('development', function () {
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

		// upload

		ex.post('/api/test/upload', function (req, res) {
			var files = [];
			if (_.isArray(req.files.file)) {
				_.each(req.files.file, function (e) {
					files.push({size: e.size, path: e.path, name: e.name, filename: e.filename});
				});
			} else if (req.files.file) {
				var e = req.files.file;
				files.push({size: e.size, path: e.path, name: e.name, filename: e.filename});
			}
			res.json(files);
		});

		ex.post('/api/test/create-thread-with-file', function (req, res, next) {
			var form = _postForm.make(req);
			form.createThread(function (err, thread, post) {
				if (err) return next(err);
				res.json(200, {threadId: thread._id, postId: post._id});
			});
		});

	});

	// start listening

	ex.listen(_config.appServerPort);
	console.info("express listening on port: %d", _config.appServerPort);
	next();
});
