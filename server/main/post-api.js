var init = require('../main/init');
var post = require('../main/post');
var express = require('../main/express');
var rcs = require('../main/rcs');

init.add(function () {

	var app = express.app;

	console.log('post-api:');

	app.post('/api/threads', function (req, res) {
		req.authorized(function (err, role) {
			if (err) return res.json(err);
			var form = post.form(req);
			post.createThread(role, form, function (err, threadId, postId) {
				if (err) return res.json(err);
				req.session.post.push(postId);
				res.json({
					rc: rcs.SUCCESS,
					threadId: threadId,
					postId: postId
				});
			});
		});
	});

	app.post('/api/threads/:threadId([0-9]+)', function (req, res) {
		req.authorized(function (err, role) {
			if (err) return res.json(err);
			var form = post.form(req);
			var threadId = form.threadId = parseInt(req.params.threadId) || 0;
			post.createReply(role, form, function (err, postId) {
				if (err) return res.json(err);
				req.session.post.push(postId);
				res.json({
					rc: rcs.SUCCESS,
					threadId: threadId,
					postId: postId
				});
			});
		});
	});

	app.get('/api/threads', function (req, res) {
		req.authorized(function (err, role) {
			if (err) return res.json(err);
			var params = post.threadsParams(req);
			post.threads(role, params, function (err, category, threads) {
				if (err) return res.json(err);
				var r = {
					rc: rcs.SUCCESS,
					threads: []
				};
				var categories = role.categories;
				var len = threads.length;
				for (var i = 0; i < len; i++) {
					var thread = threads[i];
					if (category.id === 0 && !categories[thread.categoryId]) {
						//
					} else {
						r.threads.push({
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

	app.get('/api/threads/:threadId([0-9]+)', function (req, res) {
		req.authorized(function (err, role) {
			if (err) return res.json(err);
			var threadId = parseInt(req.params.threadId) || 0;
			post.threadWithPosts(role, threadId, function (err, thread, category, posts) {
				if (err) return res.json(err);
				var r = {
					rc: rcs.SUCCESS,
					thread: {
						id: thread._id,
						title: thread.title
					},
					category: {
						id: category.id
					},
					posts: posts
				};
				res.json(r);
			});
		});
	});


	// get post

	app.get('/api/threads/:threadId([0-9]+)/:postId([0-9]+)', function (req, res, next) {
		req.authorized(function () {
			var threadId = l.int(req.params, 'threadId', 0);
			var postId = l.int(req.params, 'postId', 0);
			threadAndPost(res, threadId, postId, function (thread, post, head) {
				categoryForRead(res, thread.categoryId, function (category) {
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





	// update post

	app.put('/api/threads/:threadId([0-9]+)/:postId([0-9]+)', function (req, res, next) {
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

});

