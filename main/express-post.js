var _ = require('underscore');

var l = require('./l.js');
var auth = require('./auth.js');
var mongo = require('./mongo.js');
var es = require('./es.js');
var upload = require('./upload.js');
var msg = require('./msg.js');

exports.register = function (e) {
	e.get('/api/thread', auth.checkLogin(), function (req, res) {
		var role = getRole(req);
		var categoryId = l.defInt(req.query, 'c', 0);
		var lastUdate = new Date(l.defInt(req.query, 'udate', Date.now()));
		var limit = l.defInt(req.query, 'limit', 32, 0, 64);
		prepareReadableCategory(res, role, categoryId, function (category) {
			mongo.findThreadByCategory(categoryId, lastUdate, limit, function (err, thread) {
				if (err) return next(err);
				var r = [];
				_.each(thread, function (thread) {
					if (categoryId === 0 && !role.category[thread.categoryId]) return;
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

	e.get('/api/thread/:threadId([0-9]+)', auth.checkLogin(), function (req, res) {
		var role = getRole(req);
		var body = req.body;
		var threadId = l.defInt(req.params, 'threadId', 0);
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

	e.get('/api/thread/:threadId([0-9]+)/:postId([0-9]+)', auth.checkLogin(), function (req, res, next) {
		var role = getRole(req);
		var threadId = l.defInt(req.params, 'threadId', 0);
		var postId = l.defInt(req.params, 'postId', 0);
		prepareThreadAndPost(res, threadId, postId, function (thread, post, head) {
			prepareReadableCategory(res, role, thread.categoryId, function (category) {
				var r = {};
				if (r.head = head) {
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

	e.post('/api/thread', auth.checkLogin(), function (req, res, next) {
		var role = getRole(req);
		var form = getForm(req);
		prepareWritableCategory(res, role, form.categoryId, function (category) {
			checkForm(res, form, true, function () {
				insertThread(res, form, function (thread) {
					insertPost(req, res, form, thread, function (post) {
						res.json(200, {threadId: thread._id, postId: post._id});
					});
				});
			});
		});
	});

	e.post('/api/thread/:threadId([0-9]+)', auth.checkLogin(), function (req, res, next) {
		var role = getRole(req);
		var form = getForm(req);
		var threadId = l.defInt(req.params, 'threadId', 0);
		prepareThread(res, threadId, function (thread){
			prepareWritableCategory(res, role, thread.categoryId, function (category) {
				checkForm(res, form, false, function () {
					insertPost(req, res, form, thread, function (post) {
						mongo.updateThreadLength(thread, form.now);
						res.json(200, {threadId: thread._id, postId: post._id});
					});
				});
			});
		});
	});

	e.put('/api/thread/:threadId([0-9]+)/:postId([0-9]+)', auth.checkLogin(), function (req, res, next) {
		var role = getRole(req);
		var form = getForm(req);
		var threadId = l.defInt(req.params, 'threadId', 0);
		var postId = l.defInt(req.params, 'postId', 0);
		prepareThreadAndPost(res, threadId, postId, function (thread, post, head) {
			prepareWritableCategory(res, role, thread.categoryId, function (category) {
				checkPostOwnership(req, res, category, postId, function () {
					prepareWritableCategory(res, role, head ? form.categoryId : undefined, function (newCategory) {
						checkForm(res, form, head, function () {
							updateThread(res, form, thread, head, function () {
								updatePost(res, form, thread, post, category.editable, function () {
									res.json(200, 'ok');
								});
							});
						});
					});
				});
			});
		});
	});

	e.get('/api/search', auth.checkLogin(), function (req, res) {
		var role = getRole(req);
		var query = l.defString(req.query, 'q', '');
		var offset = l.defInt(req.query, 'offset', 0);
		var limit = l.defInt(req.query, 'limit', 16, 0, 64);
		es.searchPost({
				query: { query_string: { query: query, default_operator: 'and' }},
				sort:[{cdate : "desc"}],
				size: limit, from: offset
			},
			function (err, sres) {
				if (err) return res.json(400, {msg: msg.ERR_SEARCH_IO});
				if (!sres.body.hits) return res.json(200, []);
				var r = [];
				_.each(sres.body.hits.hits, function (hit) {
					var s = hit._source;
					var c = role.category[s.categoryId];
					if (!c) return;
					if (!s.visible && !c.editable) return;
					r.push({
						postId: hit._id,
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

	function getRole(req) {
		return auth.getRoleByName(req.session.roleName);
	}

	function getForm(req) {
		var body = req.body;
		var r = {};
		r.now = new Date();
//		r.threadId = l.defInt(body, 'threadId', 0);
//		r.postId = l.defInt(body, 'postId', 0);
		r.categoryId = l.defInt(body, 'categoryId', 0);
		r.userName  = l.defString(body, 'userName', '');
		r.title = l.defString(body, 'title', '');
		r.text = l.defString(body, 'text', '');
		r.visible = l.defBool(body, 'visible', true);
		r.fileToDel = body.fileToDel;
		r.file = body.file;
		return r;
	}

	function prepareReadableCategory(res, role, categoryId, next) {
		var category = role.category[categoryId];
		if (!category) return res.json(400, {msg: msg.ERR_INVALID_CATEGORY});
		if (!category.readable) return res.json(400, {msg: msg.ERR_NOT_AUTHORIZED});
		next(category);
	}

	function prepareWritableCategory(res, role, categoryId, next) {
		if (_.isUndefined(categoryId)) return next(null); // for form.categoryId
		var category = role.category[categoryId];
		if (!category) return res.json(400, {msg: msg.ERR_INVALID_CATEGORY});
		if (!category.writable) return res.json(400, {msg: msg.ERR_NOT_AUTHORIZED});
		next(category);
	}

	function checkPostOwnership(req, res, category, postId, next) {
		if (!category.editable) {
			if (!_.include(req.session.post, postId)) {
				return res.json(400, {msg: msg.ERR_NOT_AUTHORIZED});
			}
		}
		next();
	}

	function checkForm(res, form, head, next) {
		var error = [];
		if (head) {
			if (!form.title) error.push({title: msg.ERR_FILL_TITLE});
			if (form.title.length > 128) error.push({title: msg.ERR_SHORTEN_TITLE});
		}
		if (!form.userName) error.push({userName : msg.ERR_FILL_USERNAME});
		if (form.userName .length > 32) error.push({userName : msg.ERR_SHORTEN_USERNAME});
		if (error.length) return res.json(400, {msg: msg.ERR_INVALID_DATA, field: error});
		next();
	}

	function prepareThread(res, threadId, next) {
		mongo.findThreadById(threadId, function (err, thread) {
			if (err || !thread) return res.json(400, {msg: msg.ERR_INVALID_THREAD});
			next(thread);
		});
	}

	function prepareThreadAndPost(res, threadId, postId, next) {
		prepareThread(res, threadId, function (thread) {
			mongo.findPostById(postId, function (err, post) {
				if (err || !post) return res.json(400, {msg: msg.ERR_INVALID_POST});
				next(thread, post, thread.cdate.getTime() === post.cdate.getTime());
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
			if (err) return res.json(400, {msg: msg.ERR_DB_IO});
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
			if (err) return res.json(400, {msg: msg.ERR_FILE_IO});
			mongo.insertPost(post, function (err) {
				if (err) return res.json(400, {msg: msg.ERR_DB_IO});
				es.updatePost(thread, post, function (err, res) {
					if (err) return res.json(400, {msg: msg.ERR_SEARCH_IO});
					next(post);
				});
			});
		});
	}

	function updateThread(res, form, thread, head, next) {
		if (head) {
			thread.categoryId = form.categoryId;
			thread.title = form.title;
			thread.userName  = form.userName ;
			mongo.updateThread(thread, function (err) {
				if (err) return res.json(400, {msg: msg.ERR_DB_IO});
				next();
			});
			return;
		}
		next();
	}

	function updatePost(res, form, thread, post, admin, next) {
		post.userName = form.userName ;
		post.text = form.text;
		if (admin) {
			post.visible = form.visible;
		}
		upload.deletePostFile(post, form.fileToDel, function (err, deleted) {
			if (err) return res.json(400, {msg: msg.ERR_FILE_IO});
			if (deleted) {
				post.file = _.without(post.file, deleted);
				if (post.file.length == 0) delete post.file;
			}
			upload.savePostFile(post, form.file, function (err, saved) {
				if (err) return res.json(400, {msg: msg.ERR_FILE_IO});
				mongo.updatePost(post);
				es.updatePost(thread, post, function (err, res) {
					if (err) return res.json(400, {msg: msg.ERR_SEARCH_IO});
					next();
				});
			});
		});
	}

};