var rcs = require('./rcs');

module.exports = function (opt) {

	var post = opt.post;
	var app = opt.app;

	app.get('/api/thread', function (req, res, next) {
		req.authorized(function () {
			threadListParam(req, function (categoryId, page, pageSize) {
				readableCategory(res, categoryId, function (category) {
					mongo.findThreadsByCategory(categoryId, page, pageSize, function (err, threads) {
						if (err) return next(err);
						var r = {
							rc: rcs.SUCCESS,
							threads: []
						};
						var categories = res.locals.role.categories;
						var len = threads.length;
						for (var i = 0; i < len; i++) {
							var thread = threads[i];
							if (category.id === 0 && !categories[thread.categoryId]) {
								//
							} else {
								r.thread.push({
									id: thread._id,
									category: {
										id: thread.categoryId
									},
									hit: thread.hit,
									length: thread.length,
									updated: thread.updated.getTime(),
									writer: thread.writer,
									title: thread.title
								});
							}
						}
						res.json(r);
					});
				});
			});
		});
	});

	function threadListParam(req, next) {
		var query = req.query;
		var categoryId = parseInt(query.c) || 0;
		var page = parseInt(query.p) || 0;
		var pageSize = parseInt(query.ps) || 1;
		pageSize = pageSize > 128 ? 128 : pageSize < 1 ? 1 : pageSize;
		next(categoryId, page, pageSize);
	}

	function readableCategory(res, categoryId, next) {
		var category = res.locals.role.categories[categoryId];
		if (!category) {
			res.sendRc(rcs.INVALID_CATEGORY);
		} else {
			if (!category.readable) {
				res.sendRc(rcs.NOT_AUTHORIZED);
			} else {
				next(category);
			}
		}
	}

	app.get('/api/thread/:threadId([0-9]+)', function (req, res) {
		req.authorized(function () {
			var threadId = parseInt(req.params.threadId) || 0;
			prepareThread(res, threadId, function (thread) {
				readableCategory(res, thread.categoryId, function (category) {
					var r = {
						rc: rcs.SUCCESS,
						thread: {
							id: thread._id,
							title: thread.title
						},
						category: {
							id: category.id
						},
						post: []
					};
					mongo.findPostsByThread(threadId, function (err, post) {
						if (err) return next(err);
						iterPostList(category, post, function (post) {
							r.post.push({
								id: post._id,
								writer: post.writer,
								created: post.created,
								text: post.text,
								upload: uploadUrl(post)
							});
						});
						res.json(r);
					});
				});
			});
		});
	});

	function iterPostList(category, post, func) {
		var admin = category.editable;
		_.each(post, function (post) {
			if (!post.visible && !admin) {
				//
			} else {
				func(post);
			}
		});
	}

	function uploadUrl(post) {
		if (!post.upload) {
			return undefined;
		} else {
			var url = [];
			_.each(post.upload, function (upload) {
				url.push({
					name: upload,
					url: l.upload.postFileUrl(post._id, upload)
				});
			});
			return url;
		}
	}



	// get post

	app.get('/api/thread/:threadId([0-9]+)/:postId([0-9]+)', function (req, res, next) {
		req.authorized(function () {
			var threadId = l.int(req.params, 'threadId', 0);
			var postId = l.int(req.params, 'postId', 0);
			threadAndPost(res, threadId, postId, function (thread, post, head) {
				readableCategory(res, thread.categoryId, function (category) {
					var r = {
						rc: rcs.SUCCESS,
						thread: {
							id: post.threadId,
							title: thread.title
						},
						category: {
							id: thread.categoryId
						},
						post: {
							id: post._id,
							writer: post.writer,
							created: post.created,
							text: post.text,
							visible: post.visible,
							upload: uploadUrl(post),
							head: head,
							editable: editable(post, category, req)
						}
					};
					res.json(r);
				});
			});
		});
	});

	function editable(post, category, req) {
		return category.editable || _.include(req.session.post, post._id)
	}


	// new thread

	app.post('/api/thread', function (req, res) {
		req.authorized(function (r, role) {
			if (r) return res.json(r);
			var form = post.formFromRequest(req);
			post.createThread(role, form, function(r) {
				if (r.rc == rcs.SUCCESS) {
					req.session.post.push(r.postId);
				}
				res.json(r);
			});
		});
	});


	// new reply

	app.post('/api/thread/:threadId([0-9]+)', function (req, res, next) {
		req.authorized(function () {
			var form = getForm(req);
			var threadId = l.int(req.params, 'threadId', 0);
			prepareThread(res, threadId, function (thread){
				categoriesForNew(res, thread.categoryId, function (category) {
					checkForm(res, form, false, function () {
						insertPost(req, res, form, thread, function (post) {
							mongo.updateThreadLength(thread, form.now);
							res.json({ rc: rcs.SUCCESS, threadId: thread._id, postId: post._id });
						});
					});
				});
			});
		});
	});

	// update post

	app.put('/api/thread/:threadId([0-9]+)/:postId([0-9]+)', function (req, res, next) {
		req.authorized(function () {
			var form = getForm(req);
			var threadId = l.int(req.params, 'threadId', 0);
			var postId = l.int(req.params, 'postId', 0);
			threadAndPost(res, threadId, postId, function (thread, post, head) {
				categoriesForNew(res, thread.categoryId, function (category) {
					checkPostOwnership(req, res, category, postId, function () {
						categoriesForNew(res, head ? form.categoryId : undefined, function (newCategory) {
							checkForm(res, form, head, function () {
								updateThread(res, form, thread, head, function () {
									updatePost(res, form, thread, post, category.editable, function () {
										res.json({ rc: rcs.SUCCESS });
									});
								});
							});
						});
					});
				});
			});
		});
	});


	function checkPostOwnership(req, res, category, postId, next) {
		if (!category.editable && !_.include(req.session.post, postId)) {
			res.sendRc(rcs.NOT_AUTHORIZED);
		} else {
			next();
		}
	}

	function prepareThread(res, threadId, next) {
		mongo.findThreadById(threadId, function (err, thread) {
			if (err || !thread) {
				res.sendRc(rcs.INVALID_THREAD);
			} else {
				next(thread);
			}
		});
	}

	function threadAndPost(res, threadId, postId, next) {
		prepareThread(res, threadId, function (thread) {
			mongo.findPostById(postId, function (err, post) {
				if (err || !post) {
					res.sendRc(rcs.INVALID_POST);
				} else {
					next(thread, post, thread.created.getTime() === post.created.getTime());
				}
			});
		});
	}

	function updateThread(res, form, thread, head, next) {
		if (!head) {
			next();
		} else {
			thread.categoryId = form.categoryId;
			thread.title = form.title;
			thread.writer  = form.writer ;
			mongo.updateThread(thread, function (err) {
				if (err) {
					res.sendRc(rcs.DB_IO_ERR);
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
		l.upload.deletePostFiles(post, form.delFiles, function (err, deleted) {
			if (err) {
				next(err);
			} else {
				if (deleted && files) {
					files = files.filter(function (file) {
						return deleted.indexOf(file) == -1;
					});
					if (files.length == 0) delete files;
				}
				next();
			}

			if (err) {
				res.sendRc(rcs.FILE_IO_ERR);
			} else {
				if (deleted) {
					post.upload = _.without(post.upload, deleted);
					if (post.upload.length == 0) delete post.upload;
				}
				l.upload.savePostFiles(post, form.tmpFiles, function (err, saved) {
					if (err) {
						res.sendRc(rcs.FILE_IO_ERR);
					} else {
						mongo.updatePost(post);
						l.es.updatePost(thread, post, function (err, res) {
							if (err) {
								res.sendRc(rcs.SEARCH_IO_ERR);
							} else {
								next();
							}
						});
					}
				});
			}
		});
	}

};

