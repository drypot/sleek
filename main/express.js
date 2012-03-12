var _ = require('underscore');
var _should = require('should');
var _async = require('async');
var _express = require('express');
var _redisStore = require('connect-redis')(_express);
var _fs = require('fs');

var _l = require('./l');
var _config = require('./config');
var _role = require('./role');
var _category = require('./category');
var _auth = require('./auth');
var _form = require('./form/post-form');
var _upload = require('./upload');

var ERR_LOGIN_FIRST = 'login first';
var ERR_LOGIN_FAILED = 'login failed';
var ERR_NOT_AUTHORIZED = 'not authorized';
var ERR_INVALID_DATA = 'invalid data';
var ERR_INVALID_CATEGORY = 'invalid category';

_l.addInit(function (next) {
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

	ex.post('/api/get-thread-list', assertLoggedIn, function (req, res) {
		var role = _role.getByName(req.session.roleName);
		var categoryId = _l.intp(body, 'categoryId', 0);

		if (!role.category[categoryId].readable) {
			return res.json(400, {error: ERR_NOT_AUTHORIZED});
		}
//		return "post/list";
	});

	ex.post('/api/get-thread', assertLoggedIn, function (req, res) {
		var role = _role.getByName(req.session.roleName);
		var categoryId = _l.intp(body, 'categoryId', 0);

		if (!role.category[categoryId].readable) {
			return res.json(400, {error: ERR_NOT_AUTHORIZED});
		}

//		postContext.updateThreadHit();
//		return "post/view";
	});

	ex.post('/api/get-head & reply', assertLoggedIn, function (req, res) {
		var role = _role.getByName(req.session.roleName); ;
		var categoryId = _l.intp(body, 'categoryId', 0);

		if (!role.category[categoryId].readable) {
			return res.json(400, {error: ERR_NOT_AUTHORIZED});
		}

//		return "post ...";
	});

	ex.post('/api/create-head', assertLoggedIn, function (req, res, next) {
		var role = _role.getByName(req.session.roleName);
		var form = _form.make(req);
		var category = role.category[form.categoryId];

		if (!category) {
			return res.json(400, {error: ERR_INVALID_CATEGORY});
		}
		if (!role.category[form.categoryId].writable) {
			return res.json(400, {error: ERR_NOT_AUTHORIZED});
		}
		form.validateHead();
		if (form.error.length) {
			return res.json(400, {error: ERR_INVALID_DATA, field: form.error});
		}
		form.createHead(function (err, thread, post) {
			if (err) return next(err);
			req.session.post.push(post._id);
			res.json(200, {threadId: thread._id, postId: post._id});
		});
	});

	ex.post('/api/create-reply', assertLoggedIn, function (req, res, next) {
		var role = _role.getByName(req.session.roleName);
		var form = _form.make(req);
		form.findThread(function (err, thread) {
			if (err) return next(err);
			var category = role.category[thread.categoryId];
			if (!category) {
				return res.json(400, {error: ERR_INVALID_CATEGORY});
			}
			if (!category.writable) {
				return res.json(400, {error: ERR_NOT_AUTHORIZED});
			}
			var errors = [];
			form.validateReply(errors);
			if (errors.length) {
				return res.json(400, {error: ERR_INVALID_DATA, error: errors});
			}
			form.createReply(thread, function (err, post) {
				if (err) return next(err);
				req.session.post.push(post._id);
				res.json(200, {postId: post._id});
			});
		});
	});

	ex.put('/api/update-head', assertLoggedIn, function (req, res, next) {
		var role = _role.getByName(req.session.roleName);
		var form = _form.make(req);
		var errors = [];

		if (!category) {
			return res.json(400, {error: ERR_INVALID_CATEGORY});
		}

		form.findThreadAndPost(function (err, thread, post) {
			if (err) return next(err);

			var isHead = thread.cdate === post.cdate;
			var category = role.category[thread.categoryId];
			var newCategory = role.category[form.categoryId];

			if (!isHead) return res.json(400, {error: ERR_INVALID_DATA});

			if (!category.writable || !newCategory.writable || (!_.include(req.session.post, form.postId) && !category.editable)) {
				return res.json(400, {error: ERR_NOT_AUTHORIZED});
			}

			form.validateHead(errors);
			if (errors.length) {
				return res.json(400, {error: ERR_INVALID_DATA, error: errors});
			}

			form.updateHead(thread, post, category.editable, function (err) {
				if (err) return next(err);
				res.json(200, 'ok');
			});
		});
	});

	ex.put('/api/update-reply', assertLoggedIn, function (req, res, next) {
		var role = _role.getByName(req.session.roleName);
		var form = _form.make(req);
		var errors = [];

		if (!category) {
			return res.json(400, {error: ERR_INVALID_CATEGORY});
		}

		form.findThreadAndPost(function (err, thread, post) {
			if (err) return next(err);

			var category = role.category[thread.categoryId];

			if (!category.writable || (!_.include(req.session.post, form.postId) && !category.editable)) {
				return res.json(400, {error: ERR_NOT_AUTHORIZED});
			}

			form.validateReply(errors);
			if (errors.length) {
				return res.json(400, {error: ERR_INVALID_DATA, error: errors});
			}

			form.updateReply(thread, post, function (err) {
				if (err) return next(err);
				res.json(200, 'ok');
			});
		});
	});

	// auth

	ex.post('/api/login', function (req, res) {
		if (!_auth.loginByPassword(req, req.body.password)) {
			return res.json(400, { error: ERR_LOGIN_FAILED });
		}
		res.json({ role: { name: req.session.roleName } });
	});

	ex.post('/api/logout', function (req, res) {
		_auth.logout(req);
		res.json('ok');
	});

	// category

	ex.post('/api/get-category', assertLoggedIn, function (req, res) {
		var role = _role.getByName(req.session.roleName);
		res.json(role && role.category);
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

		ex.post('/api/test/upload-post-file', function (req, res, next) {
			_upload.savePostFile({_id: parseInt(req.body.postId)}, req.files.file, function (err, filename) {
				if (err) return next(err);
				res.json(200, filename);
			});
		});

		ex.post('/api/test/delete-post-file', function (req, res, next) {
			_upload.deletePostFile({_id: parseInt(req.body.postId)}, req.body.delFile, function (err, filename) {
				if (err) return next(err);
				res.json(200, filename);
			});
		});

	});

	// start listening

	ex.listen(_config.appServerPort);
	console.info("express listening on port: %d", _config.appServerPort);
	next();
});
