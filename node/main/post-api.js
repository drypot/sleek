var _ = require('underscore');
var l = require('./l.js');

require('./const.js');
require('./role.js');
require('./mongo.js');
require('./es.js');
require('./upload.js');
require('./express.js');
require('./session.js');

l.init(function () {

	// thread

	l.e.get('/api/thread', function (req, res, next) {
		l.session.authorized(res, function () {
			prepareThreadListParam(req, function (categoryId, page, pageSize) {
				prepareReadableCategory(res, categoryId, function (category) {
					l.mongo.findThreadByCategory(categoryId, page, pageSize, function (err, thread) {
						if (err) {
							next(err);
						} else {
							var r = {
								rc: l.rc.SUCCESS,
								thread: []
							};
							iterThreadList(page, thread, function (thread) {
								if (category.id === 0 && !res.locals.role.category[thread.categoryId]) {
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
	});

	function prepareThreadListParam(req, next) {
		var categoryId = l.int(req.query, 'c', 0);
		var page = l.int(req.query, 'p', 1);
		var pageSize = l.int(req.query, 'ps', 32, 1, 128);
		if (page === 0) {
			page = 1;
		}
		next(categoryId, page, pageSize);
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

	function iterThreadList(page, thread, func) {
		var len = thread.length;
		for (var i = 0; i < len; i++) {
			if (page > 0) {
				func(thread[i]);
			} else {
				func(thread[len - i - 1]);
			}
		}
	}

	l.e.get('/thread', function (req, res, next) {
		l.session.authorized(res, function () {
			prepareThreadListParam(req, function (categoryId, page, pageSize) {
				prepareReadableCategory(res, categoryId, function (category) {
					l.mongo.findThreadByCategory(categoryId, page, pageSize, function (err, thread) {
						if (err) {
							next(err);
						} else {
							var categories = res.locals.role.category;
							var r = {
								title: category.name,
								category: {
									id: categoryId,
									name: category.name,
									// TODO: check this
									writable: category.writable
								},
								thread: [],
								prevUrl: null,
								nextUrl: null
							};
							iterThreadList(page, thread, function (thread) {
								if (category.id === 0 && !categories[thread.categoryId]) {
									//
								} else {
									r.thread.push({
										id: thread._id,
										categoryId: thread.categoryId,
										hit: thread.hit,
										//length: thread.length,
										//updated: thread.updated.getTime(),
										writer: thread.writer,
										title: thread.title,

										categoryName: categories[thread.categoryId].name,
										reply: thread.length - 1,
										updatedStr: thread.updated.format('yyyy-MM-dd HH:mm')
									});
								}
							});
							// TODO: 최근글 하일라이트
//							CharSequence titleCss = "thread" +
//								(thread.getUdate().getMillis() > authService.getLastVisit().getMillis() ? " tn" : "") +
//								(thread.getId() == postContext.getParam().getThreadId() ? " tc" : "");

							prevNext(page, pageSize, thread, function (prev, next) {
								var u;
								if (prev) {
									u = new l.UrlMaker('/thread');
									u.addIfNot('c', categoryId, 0);
									u.addIfNot('p', prev, 1);
									r.prevUrl = u.toString();
								}
								if (next) {
									u = new l.UrlMaker('/thread');
									u.addIfNot('c', categoryId, 0);
									u.addIfNot('p', next, 1);
									r.nextUrl = u.toString();
								}
							})
							res.render('thread', r);
						}
					});
				});
			});
		});
	});

	function prevNext(page, pageSize, array, func) {
		var prev, next;
		if (page > 0) {
			prev = page === 1 ? null : page - 1;
			next = array.length !== pageSize ? null : page + 1;
		} else {
			prev = array.length !== pageSize ? null : page - 1;
			next = page === -1 ? null : page + 1;
		}
		func(prev, next);
	}

	// thread-num

	l.e.get('/api/thread/:threadId([0-9]+)', function (req, res) {
		l.session.authorized(res, function () {
			var threadId = l.int(req.params, 'threadId', 0);
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
					l.mongo.findPostByThread(threadId, function (err, post) {
						if (err) {
							next(err);
						} else {
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
						}
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
					url: l.upload.postUploadUrl(post._id, upload)
				});
			});
			return url;
		}
	}

	l.e.get('/thread/:threadId([0-9]+)', function (req, res, next) {
		l.session.authorized(res, function () {
			var threadId = l.int(req.params, 'threadId', 0);
			prepareThread(res, threadId, function (thread) {
				prepareReadableCategory(res, thread.categoryId, function (category) {
					var r = {
						title: thread.title,
						categoryId: category.id,
						categoryName: category.name,
						threadId: thread._id,
						post: []
					};
					l.mongo.findPostByThread(threadId, function (err, post) {
						if (err) {
							next(err);
						} else {
							iterPostList(category, post, function (post) {
								r.post.push({
									id: post._id,
									writer: post.writer,
									//created: post.created,
									text: post.text,
									upload: uploadUrl(post),

									createdStr: new Date(post.created).format('yyyy-MM-dd HH:mm'),
									editable: category.editable || _.include(req.session.post, post.id),
								});


							});
							res.render('thread-num', r);
						}
					});
				});
			});

		});
	});

	// post

	l.e.get('/api/thread/:threadId([0-9]+)/:postId([0-9]+)', function (req, res, next) {
		l.session.authorized(res, function () {
			var threadId = l.int(req.params, 'threadId', 0);
			var postId = l.int(req.params, 'postId', 0);
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


	// new thread

	l.e.post('/api/thread', function (req, res, next) {
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

	l.e.get('/thread/new', function (req, res, next) {
		l.session.authorized(res, function () {
			var categoryId = l.int(body, 'categoryId', 0);
			prepareWritableCategory(res, categoryId, function (category) {
				var r = {
					title: 'New',
					categoryId: category.id,
					categoryName: category.name,
					threadId: thread._id,
					post: []
				};
				res.render('thread-num', r);
			});
		});
	});

	// new reply

	l.e.post('/api/thread/:threadId([0-9]+)', function (req, res, next) {
		l.session.authorized(res, function () {
			var form = getForm(req);
			var threadId = l.int(req.params, 'threadId', 0);
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

	l.e.put('/api/thread/:threadId([0-9]+)/:postId([0-9]+)', function (req, res, next) {
		l.session.authorized(res, function () {
			var form = getForm(req);
			var threadId = l.int(req.params, 'threadId', 0);
			var postId = l.int(req.params, 'postId', 0);
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
//		r.threadId = l.int(body, 'threadId', 0);
//		r.postId = l.int(body, 'postId', 0);
		r.categoryId = l.int(body, 'categoryId', 0);
		r.writer  = l.string(body, 'writer', '');
		r.title = l.string(body, 'title', '');
		r.text = l.string(body, 'text', '');
		r.visible = l.bool(body, 'visible', true);
		r.deleting = body.deleting;
		r.uploadTmp = body.uploadTmp;
		return r;
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

