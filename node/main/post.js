var _ = require('underscore');
var l = require('./l.js');

require('./const.js');
require('./mongo.js');
require('./express.js');
require('./role.js');
require('./session.js');
require('./es.js');
require('./upload.js');

l.init.init(function () {

	var e = l.e;

	// thread list

	e.get('/api/thread', function (req, res) {
		l.session.authorized(res, function () {
			var categoryId = l.defInt(req.query, 'c', 0);
			var lastUdate = new Date(l.defInt(req.query, 'updated', Date.now()));
			var limit = l.defInt(req.query, 'limit', 32, 0, 64);
			prepareReadableCategory(res, categoryId, function (category) {
				l.mongo.findThreadByCategory(categoryId, lastUdate, limit, function (err, thread) {
					if (err) {
						next(err);
					} else {
						var r = {
							rc: l.rc.SUCCESS,
							thread: []
						};
						_.each(thread, function (thread) {
							if (categoryId === 0 && !res.locals.role.category[thread.categoryId]) {
								//
							} else {
								r.thread.push({
									id: thread._id,
									categoryId: thread.categoryId,
									hit: thread.hit,
									length: thread.length,
									updated: thread.updated.getTime(),
									writer: thread.writer,
									title: thread.title
								});
							}
						});
						res.json(r);
					}
				});
			});
		});
	});

	// thread

	e.get('/api/thread/:threadId([0-9]+)', function (req, res) {
		l.session.authorized(res, function () {
			var body = req.body;
			var threadId = l.defInt(req.params, 'threadId', 0);
			prepareThread(res, threadId, function (thread) {
				prepareReadableCategory(res, thread.categoryId, function (category) {
					var r = {
						rc: l.rc.SUCCESS,
						thread: {
							id: thread._id,
							categoryId: category.id,
							title: thread.title
						},
						post: []
					};
					var admin = category.editable;
					l.mongo.findPostByThread(threadId, function (err, post) {
						if (err) {
							next(err);
						} else {
							_.each(post, function (post) {
								if (!post.visible && !admin) {
									//
								} else {
									r.post.push({
										id: post._id,
										writer: post.writer,
										created: post.created,
										text: post.text,
										upload: uploadUrl(post)
									});
								}
							});
							res.json(r);
						}
					});
				});
			});
		});
	});

	// post

	e.get('/api/thread/:threadId([0-9]+)/:postId([0-9]+)', function (req, res, next) {
		l.session.authorized(res, function () {
			var threadId = l.defInt(req.params, 'threadId', 0);
			var postId = l.defInt(req.params, 'postId', 0);
			prepareThreadAndPost(res, threadId, postId, function (thread, post, head) {
				prepareReadableCategory(res, thread.categoryId, function (category) {
					var r = {
						rc: l.rc.SUCCESS,
						id: post._id,
						threadId: post.threadId,
						categoryId: thread.categoryId,
						title: thread.title,
						writer: post.writer,
						created: post.created,
						text: post.text,
						visible: post.visible,
						upload: uploadUrl(post),
						head: head,
						editable: editable(post, category, req)
					};
					res.json(r);
				});
			});
		});
	});

	function editable(post, category, req) {
		return category.editable || _.include(req.session.post, post._id)
	}

	function uploadUrl(post) {
		var url = undefined;
		if (post.upload) {
			url = [];
			_.each(post.upload, function (upload) {
				url.push({
					name: upload,
					url: l.upload.postUploadUrl(post._id, upload)
				});
			});
		}
		return url;
	}

	// new thread

	e.post('/api/thread', function (req, res, next) {
		l.session.authorized(res, function () {
			var form = getForm(req);
			prepareWritableCategory(res, form.categoryId, function (category) {
				checkForm(res, form, true, function () {
					insertThread(res, form, function (thread) {
						insertPost(req, res, form, thread, function (post) {
							res.json({ rc: l.rc.SUCCESS, threadId: thread._id, postId: post._id });
						});
					});
				});
			});
		});
	});

	// new reply

	e.post('/api/thread/:threadId([0-9]+)', function (req, res, next) {
		l.session.authorized(res, function () {
			var form = getForm(req);
			var threadId = l.defInt(req.params, 'threadId', 0);
			prepareThread(res, threadId, function (thread){
				prepareWritableCategory(res, thread.categoryId, function (category) {
					checkForm(res, form, false, function () {
						insertPost(req, res, form, thread, function (post) {
							l.mongo.updateThreadLength(thread, form.now);
							res.json({ rc: l.rc.SUCCESS, threadId: thread._id, postId: post._id });
						});
					});
				});
			});
		});
	});

	// update post

	e.put('/api/thread/:threadId([0-9]+)/:postId([0-9]+)', function (req, res, next) {
		l.session.authorized(res, function () {
			var form = getForm(req);
			var threadId = l.defInt(req.params, 'threadId', 0);
			var postId = l.defInt(req.params, 'postId', 0);
			prepareThreadAndPost(res, threadId, postId, function (thread, post, head) {
				prepareWritableCategory(res, thread.categoryId, function (category) {
					checkPostOwnership(req, res, category, postId, function () {
						prepareWritableCategory(res, head ? form.categoryId : undefined, function (newCategory) {
							checkForm(res, form, head, function () {
								updateThread(res, form, thread, head, function () {
									updatePost(res, form, thread, post, category.editable, function () {
										res.json({ rc: l.rc.SUCCESS });
									});
								});
							});
						});
					});
				});
			});
		});
	});

	function getForm(req) {
		var body = req.body;
		var r = {};
		r.now = new Date();
//		r.threadId = l.defInt(body, 'threadId', 0);
//		r.postId = l.defInt(body, 'postId', 0);
		r.categoryId = l.defInt(body, 'categoryId', 0);
		r.writer  = l.defString(body, 'writer', '');
		r.title = l.defString(body, 'title', '');
		r.text = l.defString(body, 'text', '');
		r.visible = l.defBool(body, 'visible', true);
		r.deleting = body.deleting;
		r.uploadTmp = body.uploadTmp;
		return r;
	}

	function prepareReadableCategory(res, categoryId, next) {
		var category = res.locals.role.category[categoryId];
		if (!category) {
			res.json({ rc: l.rc.INVALID_CATEGORY });
		} else {
			if (!category.readable) {
				res.json({ rc: l.rc.NOT_AUTHORIZED });
			} else {
				next(category);
			}
		}
	}

	function prepareWritableCategory(res, categoryId, next) {
		if (_.isUndefined(categoryId)) {
			next(null); // for form.categoryId
		} else {
			var category = res.locals.role.category[categoryId];
			if (!category) {
				res.json({ rc: l.rc.INVALID_CATEGORY });
			} else {
				if (!category.writable) {
					res.json({ rc: l.rc.NOT_AUTHORIZED });
				} else {
					next(category);
				}
			}
		}
	}

	function checkPostOwnership(req, res, category, postId, next) {
		if (!category.editable && !_.include(req.session.post, postId)) {
			res.json({ rc: l.rc.NOT_AUTHORIZED });
		} else {
			next();
		}
	}

	function checkForm(res, form, head, next) {
		var error = [];
		if (head) {
			if (!form.title) error.push({ title: l.msg.FILL_TITLE });
			if (form.title.length > 128) error.push({ title: l.msg.SHORTEN_TITLE });
		}
		if (!form.writer) {
			error.push({ writer : l.msg.FILL_WRITER });
		}
		if (form.writer .length > 32) {
			error.push({ writer : l.msg.SHORTEN_WRITER });
		}
		if (error.length) {
			res.json({ rc: l.rc.INVALID_DATA, field: error });
		} else {
			next();
		}
	}

	function prepareThread(res, threadId, next) {
		l.mongo.findThreadById(threadId, function (err, thread) {
			if (err || !thread) {
				res.json({ rc: l.rc.INVALID_THREAD });
			} else {
				next(thread);
			}
		});
	}

	function prepareThreadAndPost(res, threadId, postId, next) {
		prepareThread(res, threadId, function (thread) {
			l.mongo.findPostById(postId, function (err, post) {
				if (err || !post) {
					res.json({ rc: l.rc.INVALID_POST });
				} else {
					next(thread, post, thread.created.getTime() === post.created.getTime());
				}
			});
		});
	}

	function insertThread(res, form, next) {
		var thread = {
			_id : l.mongo.getNewThreadId(),
			categoryId: form.categoryId,
			hit: 0, length: 1, created: form.now, updated: form.now,
			writer : form.writer , title: form.title
		};
		l.mongo.insertThread(thread, function (err) {
			if (err) {
				res.json({ rc: l.rc.DB_IO_ERR });
			} else {
				next(thread);
			}
		});
	}

	function insertPost(req, res, form, thread, next) {
		var post = {
			_id: l.mongo.getNewPostId(),
			threadId: thread._id,
			created: form.now, visible: true,
			writer : form.writer , text: form.text
		};
		req.session.post.push(post._id);
		l.upload.savePostUploadTmp(post, form.uploadTmp, function (err) {
			if (err) {
				res.json({ rc: l.rc.FILE_IO_ERR });
			} else {
				l.mongo.insertPost(post, function (err) {
					if (err) {
						res.json({ rc: l.rc.DB_IO_ERR });
					} else {
						l.es.updatePost(thread, post, function (err, res) {
							if (err) {
								res.json({ rc: l.rc.SEARCH_IO_ERR });
							} else {
								next(post);
							}
						});
					}
				});
			}
		});
	}

	function updateThread(res, form, thread, head, next) {
		if (!head) {
			next();
		} else {
			thread.categoryId = form.categoryId;
			thread.title = form.title;
			thread.writer  = form.writer ;
			l.mongo.updateThread(thread, function (err) {
				if (err) {
					res.json({ rc: l.rc.DB_IO_ERR });
				} else {
					next();
				}
			});
		}
	}

	function updatePost(res, form, thread, post, admin, next) {
		post.writer = form.writer ;
		post.text = form.text;
		if (admin) {
			post.visible = form.visible;
		}
		l.upload.deletePostUpload(post, form.deleting, function (err, deleted) {
			if (err) {
				res.json({ rc: l.rc.FILE_IO_ERR });
			} else {
				if (deleted) {
					post.upload = _.without(post.upload, deleted);
					if (post.upload.length == 0) delete post.upload;
				}
				l.upload.savePostUploadTmp(post, form.uploadTmp, function (err, saved) {
					if (err) {
						res.json({ rc: l.rc.FILE_IO_ERR });
					} else {
						l.mongo.updatePost(post);
						l.es.updatePost(thread, post, function (err, res) {
							if (err) {
								res.json({ rc: l.rc.SEARCH_IO_ERR });
							} else {
								next();
							}
						});
					}
				});
			}
		});
	}
});

l.init.init(function () {

	var e = l.e;

	e.get('/thread', function (req, res, next) {
		res.render('post-thread-list');
	});

	e.get('/thread/:threadId([0-9]+)', function (req, res, next) {
		res.render('post-thread');
	});

})