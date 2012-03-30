var _ = require('underscore');

var l = require('./l.js');
var auth = require('./auth.js');
var mongo = require('./mongo.js');
var es = require('./es.js');
var upload = require('./upload.js');
var msg = require('./msg.js');

exports.register = function (e) {
	e.post('/api/get-thread-list', auth.checkLogin(), function (req, res) {
		var role = getRole(req);
		var body = req.body;
		var categoryId = l.defInt(body, 'categoryId', 0);
		var lastUdate = new Date(l.defInt(body, 'lastUdate', Date.now()));
		var limit = l.defInt(body, 'limit', 32, 0, 64);
		prepareReadableCategory(res, role, categoryId, function (category) {
			mongo.findThreadByCategory(categoryId, lastUdate, limit, function (err, thread) {
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

	e.post('/api/get-thread', auth.checkLogin(), function (req, res) {
		var role = getRole(req);
		var body = req.body;
		var threadId = l.defInt(body, 'threadId', 0);
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
				mongo.findPostByThread(threadId, function (err, post) {
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

	e.post('/api/search-post', auth.checkLogin(), function (req, res) {
		var role = getRole(req);
		var body = req.body;
		var query = l.defString(body, 'query', '');
		var offset = l.defInt(body, 'offset', 0);
		var limit = l.defInt(body, 'limit', 16, 0, 64);
		es.searchPost({
				query: { query_string: { query: query, default_operator: 'and' }},
				sort:[{cdate : "desc"}],
				size: limit, from: offset
			},
			function (err, sres, body) {
				if (err) {
					return res.json(400, {error: msg.ERR_SEARCH_IO});
				}
				var r = [];
				_.each(body.hits.hits, function (hit) {
					var s = hit._source;
					if (!role.category[s.categoryId]) return;
					if (!s.visible) return;
					r.push({
						id: hit._id,
						threadId: s.threadId,
						categoryId: s.categoryId,
						cdate: s.cdate.getTime(),
						userName: s.userName,
						title: s.title,
						text: s.text.substring(0, 512)
					});
				});
				res.json(200, r);
			}
		);
	});

	e.post('/api/get-post', auth.checkLogin(), function (req, res, next) {
		var role = getRole(req);
		var body = req.body;
		var threadId = l.defInt(body, 'threadId', 0);
		var postId = l.defInt(body, 'postId', 0);
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

	e.post('/api/create-post-head', auth.checkLogin(), function (req, res, next) {
		var role = getRole(req);
		var form = getForm(req);
		prepareWritableCategory(res, role, form.categoryId, function (category) {
			checkFormThreadAndPost(res, form, function () {
				insertThread(res, form, function (thread) {
					insertPost(req, res, form, thread, function (post) {
						updateSearchIndex(res, thread, post, function () {
							res.json(200, {threadId: thread._id, postId: post._id});
						});
					});
				});
			});
		});
	});

	e.post('/api/create-post-reply', auth.checkLogin(), function (req, res, next) {
		var role = getRole(req);
		var form = getForm(req);
		prepareThread(res, form.threadId, function (thread){
			prepareWritableCategory(res, role, thread.categoryId, function (category) {
				checkFormPost(res, form, function () {
					insertPost(req, res, form, thread, function (post) {
						mongo.updateThreadLength(thread, form.now);
						updateSearchIndex(res, thread, post, function () {
							res.json(200, {threadId: thread._id, postId: post._id});
						});
					});
				});
			});
		});
	});

	e.post('/api/update-post-head', auth.checkLogin(), function (req, res, next) {
		var role = getRole(req);
		var form = getForm(req);
		prepareThreadAndPost(res, form.threadId, form.postId, function (thread, post) {
			prepareWritableCategory(res, role, thread.categoryId, function (category) {
				checkPostOwnership(req, res, category, form.postId, function () {
					prepareWritableCategory(res, role, form.categoryId, function (formCategory) {
						checkFormThreadAndPost(res, form, function () {
							updateThread(res, form, thread, function () {
								updatePost(res, form, post, category.editable, function () {
									updateSearchIndex(res, thread, post, function () {
										res.json(200, 'ok');
									});
								});
							});
						});
					});
				});
			});
		});
	});

	e.post('/api/update-post-reply', auth.checkLogin(), function (req, res, next) {
		var role = getRole(req);
		var form = getForm(req);
		prepareThreadAndPost(res, form.threadId, form.postId, function (thread, post) {
			prepareWritableCategory(res, role, thread.categoryId, function (category) {
				checkPostOwnership(req, res, category, form.postId, function () {
					checkFormPost(res, form, function () {
						updatePost(res, form, post, category.editable, function () {
							updateSearchIndex(res, thread, post, function () {
								res.json(200, 'ok');
							});
						});
					});
				});
			});
		});
	});

	function getRole(req) {
		return auth.getRoleByName(req.session.roleName);
	}

	function getForm(req) {
		var body = req.body;
		var r = {};
		r.now = new Date();
		r.threadId = l.defInt(body, 'threadId', 0);
		r.postId = l.defInt(body, 'postId', 0);
		r.categoryId = l.defInt(body, 'categoryId', 0);
		r.userName  = l.defString(body, 'userName', '');
		r.title = l.defString(body, 'title', '');
		r.text = l.defString(body, 'text', '');
		r.visible = l.defBool(body, 'visible', true);
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
		mongo.findThreadById(threadId, function (err, thread) {
			if (err || !thread) {
				return res.json(400, {error: msg.ERR_INVALID_THREAD});
			}
			next(thread);
		});
	}

	function prepareThreadAndPost(res, threadId, postId, next) {
		prepareThread(res, threadId, function (thread) {
			mongo.findPostById(postId, function (err, post) {
				if (err || !post) {
					return res.json(400, {error: msg.ERR_INVALID_POST});
				}
				next(thread, post);
			});
		});
	}

	function insertThread(res, form, next) {
		var thread = {
			_id : mongo.getNewThreadId(),
			categoryId: form.categoryId,
			hit: 0, length: 1, cdate: form.now, udate: form.now,
			userName : form.userName , title: form.title
		};
		mongo.insertThread(thread, function (err) {
			if (err) {
				return res.json(400, {error: msg.ERR_DB_IO});
			}
			next(thread);
		});
	}

	function insertPost(req, res, form, thread, next) {
		var post = {
			_id: mongo.getNewPostId(),
			threadId: thread._id,
			cdate: form.now, visible: true,
			userName : form.userName , text: form.text
		};
		req.session.post.push(post._id);
		upload.savePostFile(post, form.file, function (err) {
			if (err) {
				return res.json(400, {error: msg.ERR_FILE_IO});
			}
			mongo.insertPost(post, function (err) {
				if (err) {
					return res.json(400, {error: msg.ERR_DB_IO});
				}
				next(post);
			});
		});
	}

	function updateThread(res, form, thread, next) {
		thread.categoryId = form.categoryId;
		thread.title = form.title;
		thread.userName  = form.userName ;
		mongo.updateThread(thread, function (err) {
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
		upload.deletePostFile(post, form.delFile, function (err, deleted) {
			if (err) {
				return res.json(400, {error: msg.ERR_FILE_IO});
			}
			if (deleted) {
				post.file = _.without(post.file, deleted);
				if (post.file.length == 0) delete post.file;
			}
			upload.savePostFile(post, form.file, function (err, saved) {
				if (err) {
					return res.json(400, {error: msg.ERR_FILE_IO});
				}
				mongo.updatePost(post);
				next();
			});
		});
	}

	function updateSearchIndex(res, thread, post, next) {
		es.updatePost(thread, post, function (err, res, body) {
			if (err) {
				return res.json(400, {error: msg.ERR_SEARCH_IO});
			}
			next();
		});
	}

};