var _ = require('underscore');
var should = require('should');

var l = require('./l.js');
var Role = require('./role.js');
var auth = require('./auth.js');
var Post = require('./post.js');
var Thread = require('./post-thread.js');
var msg = require('./msg.js');

exports.register = function (e) {

	e.post('/api/get-thread-list', auth.filter.login(), function (req, res) {
		var role = getRole(req);
		var body = req.body;
		var categoryId = l.p.int(body, 'categoryId', 0);
		var lastUdate = new Date(l.p.int(body, 'lastUdate', Date.now()));
		var limit = l.p.int(body, 'limit', 64);
		prepareReadableCategory(res, role, categoryId, function (category) {
			Thread.findByCategoryId(categoryId, lastUdate, limit, function (err, thread) {
				if (err) return next(err);
				var r = [];
				_.each(thread, function (thread) {
					if (!role.category[thread.categoryId]) return;
					r.push({
						id: thread._id,
						categoryId: thread.categoryId,
						hit: thread.hit,
						length: thread.length,
						udate: thread.udate.getTime(),
						userName: thread.userName,
						title: thread.title
					});
				});
				res.json(200, r);
			});
		});
	});

	e.post('/api/get-thread', auth.filter.login(), function (req, res) {
		var role = getRole(req);
		var body = req.body;
		var threadId = l.p.int(body, 'threadId', 0);
		prepareThread(res, threadId, function (thread) {
			prepareReadableCategory(res, role, thread.categoryId, function (category) {
				var r = {
					thread: {
						id: thread._id,
						categoryId: category.id,
						title: thread.title
					},
					post: []
				};
				var admin = category.editable;
				Post.findByThreadId(threadId, function (err, post) {
					if (err) return next(err);
					_.each(post, function (post) {
						if (!post.visible && !admin) return;
						r.post.push({
							id: post._id,
							userName: post.userName,
							cdate: post.cdate,
							text: post.text,
							file: post.file
						});
					});
					res.json(200, r);
				});
			});
		});
	});

	e.post('/api/get-post', auth.filter.login(), function (req, res, next) {
		var role = getRole(req);
		var body = req.body;
		var threadId = l.p.int(body, 'threadId', 0);
		var postId = l.p.int(body, 'postId', 0);
		prepareThreadAndPost(res, threadId, postId, function (thread, post) {
			prepareReadableCategory(res, role, thread.categoryId, function (category) {
				var r = {};
				if (r.head = thread.cdate.getTime() === post.cdate.getTime()) {
					r.categoryId = thread.categoryId;
					r.title = thread.title;
				}
				r.userName = post.userName;
				r.text = post.text;
				r.file = post.file;
				r.visible = post.visible;
				res.json(200, r);
			});
		});
	});

	e.post('/api/create-post-head', auth.filter.login(), function (req, res, next) {
		var role = getRole(req);
		var form = getForm(req);
		prepareWritableCategory(res, role, form.categoryId, function (category) {
			checkFormThreadAndPost(res, form, function () {
				insertThread(res, form, function (thread) {
					insertPost(req, res, form, thread, function (post) {
						res.json(200, {threadId: thread._id, postId: post._id});
					});
				});
			});
		});
	});

	e.post('/api/create-post-reply', auth.filter.login(), function (req, res, next) {
		var role = getRole(req);
		var form = getForm(req);
		prepareThread(res, form.threadId, function (thread){
			prepareWritableCategory(res, role, thread.categoryId, function (category) {
				checkFormPost(res, form, function () {
					insertPost(req, res, form, thread, function (post) {
						Thread.updateLength(thread, form.now);
						res.json(200, {threadId: thread._id, postId: post._id});
					});
				});
			});
		});
	});

	e.post('/api/update-post-head', auth.filter.login(), function (req, res, next) {
		var role = getRole(req);
		var form = getForm(req);
		prepareThreadAndPost(res, form.threadId, form.postId, function (thread, post) {
			prepareWritableCategory(res, role, thread.categoryId, function (category) {
				checkPostOwnership(req, res, category, form.postId, function () {
					prepareWritableCategory(res, role, form.categoryId, function (formCategory) {
						checkFormThreadAndPost(res, form, function () {
							updateThread(res, form, thread, function () {
								updatePost(res, form, post, category.editable, function () {
									res.json(200, 'ok');
								});
							});
						});
					});
				});
			});
		});
	});

	e.post('/api/update-post-reply', auth.filter.login(), function (req, res, next) {
		var role = getRole(req);
		var form = getForm(req);
		prepareThreadAndPost(res, form.threadId, form.postId, function (thread, post) {
			prepareWritableCategory(res, role, thread.categoryId, function (category) {
				checkPostOwnership(req, res, category, form.postId, function () {
					checkFormPost(res, form, function () {
						updatePost(res, form, post, category.editable, function () {
							res.json(200, 'ok');
						});
					});
				});
			});
		});
	});

	function getRole(req) {
		return Role.getByName(req.session.roleName);
	}

	function getForm(req) {
		var body = req.body;
		var r = {};
		r.now = new Date();
		r.threadId = l.p.int(body, 'threadId', 0);
		r.postId = l.p.int(body, 'postId', 0);
		r.categoryId = l.p.int(body, 'categoryId', 0);
		r.userName  = l.p.string(body, 'userName', '');
		r.title = l.p.string(body, 'title', '');
		r.text = l.p.string(body, 'text', '');
		r.visible = l.p.bool(body, 'visible', true);
		r.delFile = body.delFile;
		r.file = req.files && req.files.file;
		return r;
	}

	function prepareReadableCategory(res, role, categoryId, next) {
		var category = role.category[categoryId];
		if (!category) {
			return res.json(400, {error: msg.ERR_INVALID_CATEGORY});
		}
		if (!category.readable) {
			return res.json(400, {error: msg.ERR_NOT_AUTHORIZED});
		}
		next(category);
	}

	function prepareWritableCategory(res, role, categoryId, next) {
		var category = role.category[categoryId];
		if (!category) {
			return res.json(400, {error: msg.ERR_INVALID_CATEGORY});
		}
		if (!category.writable) {
			return res.json(400, {error: msg.ERR_NOT_AUTHORIZED});
		}
		next(category);
	}

	function checkPostOwnership(req, res, category, postId, next) {
		if (!category.editable) {
			if (!_.include(req.session.post, postId)) {
				return res.json(400, {error: msg.ERR_NOT_AUTHORIZED});
			}
		}
		next();
	}

	function checkFormThreadAndPost(res, form, next) {
		var error = [];
		fillThreadError(form, error);
		fillPostError(form, error);
		if (error.length) {
			return res.json(400, {error: msg.ERR_INVALID_DATA, field: error});
		}
		next();
	}

	function checkFormPost(res, form, next) {
		var error = [];
		fillPostError(form, error);
		if (error.length) {
			return res.json(400, {error: msg.ERR_INVALID_DATA, field: error});
		}
		next();
	}

	function fillThreadError(form, error) {
		if (!form.title) error.push({title: msg.ERR_FILL_TITLE});
		if (form.title.length > 128) error.push({title: msg.ERR_SHORTEN_TITLE});
	}

	function fillPostError(form, error) {
		if (!form.userName) error.push({userName : msg.ERR_FILL_USERNAME});
		if (form.userName .length > 32) error.push({userName : msg.ERR_SHORTEN_USERNAME});
	}

	function prepareThread(res, threadId, next) {
		Thread.findById(threadId, function (err, thread) {
			if (err || !thread) {
				return res.json(400, {error: msg.ERR_INVALID_THREAD});
			}
			next(thread);
		});
	}

	function prepareThreadAndPost(res, threadId, postId, next) {
		prepareThread(res, threadId, function (thread) {
			Post.findById(postId, function (err, post) {
				if (err || !post) {
					return res.json(400, {error: msg.ERR_INVALID_POST});
				}
				next(thread, post);
			});
		});
	}

	function insertThread(res, form, next) {
		var thread = {
			_id : Thread.getNewId(),
			categoryId: form.categoryId,
			hit: 0, length: 1, cdate: form.now, udate: form.now,
			userName : form.userName , title: form.title
		};
		Thread.insert(thread, function (err) {
			if (err) {
				return res.json(400, {error: msg.ERR_DB_IO});
			}
			next(thread);
		});
	}

	function insertPost(req, res, form, thread, next) {
		var post = {
			_id: Post.getNewId(),
			threadId: thread._id,
			cdate: form.now, visible: true,
			userName : form.userName , text: form.text
		};
		req.session.post.push(post._id);
		Post.insert(post, form.file, function (err) {
			if (err) {
				return res.json(400, {error: msg.ERR_DB_IO});
			}
			next(post);
		});
	}

	function updateThread(res, form, thread, next) {
		thread.categoryId = form.categoryId;
		thread.title = form.title;
		thread.userName  = form.userName ;
		Thread.update(thread, function (err) {
			if (err) {
				return res.json(400, {error: msg.ERR_DB_IO});
			}
			next();
		});
	}

	function updatePost(res, form, post, admin, next) {
		post.userName = form.userName ;
		post.text = form.text;
		if (admin) {
			post.visible = form.visible;
		}
		Post.update(post, form.file, form.delFile, function (err) {
			if (err) {
				return res.json(400, {error: msg.ERR_DB_IO});
			}
			next();
		});
	}

};