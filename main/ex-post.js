var _ = require('underscore');
var l = require('./l.js');

require('./const.js');
require('./role.js');
require('./session.js');
require('./mongo.js');
require('./es.js');
require('./upload.js');
require('./ex.js');

l.init.init(function () {

	l.ex.get('/api/thread', l.session.checkLogin(), function (req, res) {
		var role = l.role.getRoleByName(req.session.roleName);
		var categoryId = l.defInt(req.query, 'c', 0);
		var lastUdate = new Date(l.defInt(req.query, 'udate', Date.now()));
		var limit = l.defInt(req.query, 'limit', 32, 0, 64);
		prepareReadableCategory(res, role, categoryId, function (category) {
			l.mongo.findThreadByCategory(categoryId, lastUdate, limit, function (err, thread) {
				if (err) {
					next(err);
				} else {
					var r = {
						rc: l.rc.SUCCESS,
						thread: []
					};
					_.each(thread, function (thread) {
						if (categoryId === 0 && !role.category[thread.categoryId]) {
							//
						} else {
							r.thread.push({
								id: thread._id,
								categoryId: thread.categoryId,
								hit: thread.hit,
								length: thread.length,
								udate: thread.udate.getTime(),
								userName: thread.userName,
								title: thread.title
							});
						}
					});
					res.json(r);
				}
			});
		});
	});

	l.ex.get('/api/thread/:threadId([0-9]+)', l.session.checkLogin(), function (req, res) {
		var role = l.role.getRoleByName(req.session.roleName);
		var body = req.body;
		var threadId = l.defInt(req.params, 'threadId', 0);
		prepareThread(res, threadId, function (thread) {
			prepareReadableCategory(res, role, thread.categoryId, function (category) {
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
									userName: post.userName,
									cdate: post.cdate,
									text: post.text,
									file: post.file
								});
							}
						});
						res.json(r);
					}
				});
			});
		});
	});

	l.ex.get('/api/thread/:threadId([0-9]+)/:postId([0-9]+)', l.session.checkLogin(), function (req, res, next) {
		var role = l.role.getRoleByName(req.session.roleName);
		var threadId = l.defInt(req.params, 'threadId', 0);
		var postId = l.defInt(req.params, 'postId', 0);
		prepareThreadAndPost(res, threadId, postId, function (thread, post, head) {
			prepareReadableCategory(res, role, thread.categoryId, function (category) {
				var r = {
					rc: l.rc.SUCCESS
				};
				if (r.head = head) {
					r.categoryId = thread.categoryId;
					r.title = thread.title;
				}
				r.userName = post.userName;
				r.text = post.text;
				r.file = post.file;
				r.visible = post.visible;
				res.json(r);
			});
		});
	});

	l.ex.post('/api/thread', l.session.checkLogin(), function (req, res, next) {
		var role = l.role.getRoleByName(req.session.roleName);
		var form = getForm(req);
		prepareWritableCategory(res, role, form.categoryId, function (category) {
			checkForm(res, form, true, function () {
				insertThread(res, form, function (thread) {
					insertPost(req, res, form, thread, function (post) {
						res.json({ rc: l.rc.SUCCESS, threadId: thread._id, postId: post._id });
					});
				});
			});
		});
	});

	l.ex.post('/api/thread/:threadId([0-9]+)', l.session.checkLogin(), function (req, res, next) {
		var role = l.role.getRoleByName(req.session.roleName);
		var form = getForm(req);
		var threadId = l.defInt(req.params, 'threadId', 0);
		prepareThread(res, threadId, function (thread){
			prepareWritableCategory(res, role, thread.categoryId, function (category) {
				checkForm(res, form, false, function () {
					insertPost(req, res, form, thread, function (post) {
						l.mongo.updateThreadLength(thread, form.now);
						res.json({ rc: l.rc.SUCCESS, threadId: thread._id, postId: post._id });
					});
				});
			});
		});
	});

	l.ex.put('/api/thread/:threadId([0-9]+)/:postId([0-9]+)', l.session.checkLogin(), function (req, res, next) {
		var role = l.role.getRoleByName(req.session.roleName);
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
									res.json({ rc: l.rc.SUCCESS });
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
		r.userName  = l.defString(body, 'userName', '');
		r.title = l.defString(body, 'title', '');
		r.text = l.defString(body, 'text', '');
		r.visible = l.defBool(body, 'visible', true);
		r.deleting = body.deleting;
		r.uploading = body.uploading;
		return r;
	}

	function prepareReadableCategory(res, role, categoryId, next) {
		var category = role.category[categoryId];
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

	function prepareWritableCategory(res, role, categoryId, next) {
		if (_.isUndefined(categoryId)) {
			next(null); // for form.categoryId
		} else {
			var category = role.category[categoryId];
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
		if (!form.userName) {
			error.push({ userName : l.msg.FILL_USERNAME });
		}
		if (form.userName .length > 32) {
			error.push({ userName : l.msg.SHORTEN_USERNAME });
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
					next(thread, post, thread.cdate.getTime() === post.cdate.getTime());
				}
			});
		});
	}

	function insertThread(res, form, next) {
		var thread = {
			_id : l.mongo.getNewThreadId(),
			categoryId: form.categoryId,
			hit: 0, length: 1, cdate: form.now, udate: form.now,
			userName : form.userName , title: form.title
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
			cdate: form.now, visible: true,
			userName : form.userName , text: form.text
		};
		req.session.post.push(post._id);
		l.upload.savePostFile(post, form.uploading, function (err) {
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
			thread.userName  = form.userName ;
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
		post.userName = form.userName ;
		post.text = form.text;
		if (admin) {
			post.visible = form.visible;
		}
		l.upload.deletePostFile(post, form.deleting, function (err, deleted) {
			if (err) {
				res.json({ rc: l.rc.FILE_IO_ERR });
			} else {
				if (deleted) {
					post.file = _.without(post.file, deleted);
					if (post.file.length == 0) delete post.file;
				}
				l.upload.savePostFile(post, form.uploading, function (err, saved) {
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