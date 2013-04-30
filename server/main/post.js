var l = require('../main/l');
var init = require('../main/init');
var mongo = require('../main/mongo');
var es = require('../main/es');
var upload = require('../main/upload');
var error = require('../main/error');

init.add(function () {

	console.log('post:');

	exports.form = function (req) {
		var body = req.body;
		var form = {};
		form.now = new Date();
		form.categoryId = parseInt(body.categoryId) || 0;
		form.writer  = String(body.writer || '').trim();
		form.title = String(body.title || '').trim();
		form.text = String(body.text || '');
		form.visible = !!(body.hasOwnProperty('visible') ? body.visible : true);
		form.files = body.files;
		form.delFiles = body.delFiles;
		return form;
	};

	exports.createThread = function (role, form, next) {
		categoryForUpdate(role, form.categoryId, function (err, category) {
			if (err) return next(err);
			checkForm(form, true, function (err) {
				if (err) return next(err);
				var threadId = mongo.getNewThreadId();
				var postId = mongo.getNewPostId();
				upload.savePostFiles(postId, form.files, function (err, saved) {
					if (err) return next(err);
					insertThread(threadId, form, function (err, thread) {
						if (err) return next(err);
						insertPost(postId, thread, category, form, saved, function (err) {
							if (err) return next(err);
							next(null, threadId, postId);
						});
					});
				});
			});
		});
	}

	exports.createReply = function (role, form, next) {
		findThread(form.threadId, function (err, thread) {
			if (err) return next(err);
			categoryForUpdate(role, thread.categoryId, function (err, category) {
				if (err) return next(err);
				checkForm(form, false, function (err) {
					if (err) return next(err);
					var postId = mongo.getNewPostId();
					upload.savePostFiles(postId, form.files, function (err, saved) {
						if (err) return next(err);
						insertPost(postId, thread, category, form, saved, function (err) {
							if (err) return next(err);
							mongo.updateThreadLength(thread._id, form.now, function (err) {
								if (err) return next(err);
								next(null, postId);
							});
						});
					});
				});
			});
		});
	};

	exports.update = function (role, form, editables, next) {
		findThread(form.threadId, function (err, thread) {
			if (err) return next(err);
			findPost(thread, form.postId, function (err, post) {
				if (err) return next(err);
				categoryForUpdate(role, thread.categoryId, function (err, category) {
					if (err) return next(err);
					if (!isEditable(category, post._id, editables)) {
						return next(error(error.NOT_AUTHORIZED));
					}
					var head = isHead(thread, post);
					checkNewCategory(role, form.categoryId, head, function (err) {
						if (err) return next(err);
						checkForm(form, head, function (err) {
							if (err) return next(err);
							upload.deletePostFiles(post._id, form.delFiles, function (err, deleted) {
								if (err) return next(err);
								upload.savePostFiles(post._id, form.files, function (err, saved) {
									if (err) return next(err);
									updatePost(thread, post, category, form, deleted, saved, next);
								});
							});
						});
					});
				});
			});
		});
	};

	exports.threadsParams = function (req) {
		var query = req.query;
		var params = {};
		params.categoryId = parseInt(query.c) || 0;
		var page = parseInt(query.p) || 1;
		params.page = page < 1 ? 1 : page;
		var pageSize = parseInt(query.ps) || 16;
		params.pageSize = pageSize > 128 ? 128 : pageSize < 1 ? 1 : pageSize;
		return params;
	}

	exports.threads = function (role, params, next) {
		categoryForRead(role, params.categoryId, function (err, category) {
			if (err) return next(err);
			var categories = role.categories;
			var threads = [];
			var count = 0;
			mongo.findThreadsByCategory(params.categoryId, params.page, params.pageSize, function (err, thread) {
				if (err) return next(err);
				if (thread) {
					count++;
					if (category.id !== 0 || categories[thread.categoryId]) {
						threads.push({
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
					return;
				}
				next(null, category, threads, count !== params.pageSize);
			});
		});
	};

	exports.threadAndPosts = function (role, threadId, next) {
		findThread(threadId, function (err, thread) {
			if (err) return next(err);
			categoryForRead(role, thread.categoryId, function (err, category) {
				if (err) return next(err);
				var admin = category.editable;
				var posts = [];
				mongo.findPostsByThread(threadId, function (err, post) {
					if (err) return next(err);
					if (post) {
						if (post.visible || admin) {
							expFileUrls(post);
							posts.push({
								id: post._id,
								writer: post.writer,
								created: post.created,
								text: post.text,
								files: post.files
							});
						}
						return;
					}
					next(null, thread, category, posts);
				});
			});
		});
	};

	exports.threadAndPost = function (role, threadId, postId, editablePosts, next) {
		findThread(threadId, function (err, thread) {
			if (err) return next(err);
			findPost(thread, postId, function (err, post) {
				if (err) return next(err);
				categoryForRead(role, thread.categoryId, function (err, category) {
					if (err) return next(err);
					expFileUrls(post);
					var postX = {
						id: post._id,
						writer: post.writer,
						created: post.created,
						text: post.text,
						visible: post.visible,
						files: post.files,
						head: isHead(thread, post),
						editable: isEditable(category, post._id, editablePosts)
					}
					next(err, thread, postX);
				});
			});
		});
	};

	function checkForm(form, head, next) {
		var fields = [];

		if (head) {
			if (!form.title.length) {
				fields.push({ name: 'title', msg: error.msg.FILL_TITLE });
			}
			if (form.title.length > 128) {
				fields.push({ name: 'title', msg: error.msg.SHORTEN_TITLE });
			}
		}
		if (!form.writer) {
			fields.push({ name: 'writer', msg: error.msg.FILL_WRITER });
		}
		if (form.writer.length > 32) {
			fields.push({ name: 'writer', msg: error.msg.SHORTEN_WRITER });
		}
		if (fields.length) {
			return next(error({ rc: error.INVALID_DATA, fields: fields }));
		}

		next();
	}

	function categoryForUpdate(role, categoryId, next) {
		var category = role.categories[categoryId];
		if (!category) {
			return next(error(error.INVALID_CATEGORY));
		}
		if (!category.writable) {
			return next(error(error.NOT_AUTHORIZED));
		}
		next(null, category);
	}

	function categoryForRead(role, categoryId, next) {
		var category = role.categories[categoryId];
		if (!category) {
			return next(error(error.INVALID_CATEGORY));
		}
		if (!category.readable) {
			return next(error(error.NOT_AUTHORIZED));
		}
		next(null, category);
	}

	function checkNewCategory(role, categoryId, head, next) {
		if (head) {
			categoryForUpdate(role, categoryId, next);
		} else {
			next();
		}
	}

	function findThread(threadId, next) {
		mongo.findThread(threadId, function (err, thread) {
			if (err) {
				return next(err);
			}
			if (!thread) {
				return next(error(error.INVALID_THREAD));
			}
			next(null, thread);
		});
	}

	function findPost(thread, postId, next) {
		mongo.findPost(postId, function (err, post) {
			if (err) {
				return next(err);
			}
			if (!post || post.threadId !== thread._id) {
				return next(error(error.INVALID_POST));
			}
			next(null, post);
		});
	}

	function insertThread(threadId, form, next) {
		var thread = {
			_id : threadId,
			categoryId: form.categoryId,
			hit: 0,
			length: 1,
			created: form.now,
			updated: form.now,
			writer: form.writer,
			title: form.title
		};
		mongo.insertThread(thread, function (err) {
			if (err) return next(err);
			next(null, thread);
		});
	}

	function insertPost(postId, thread, category, form, saved, next) {
		var post = {
			_id: postId,
			threadId: thread._id,
			created: form.now,
			visible: category.editable ? form.visible : true,
			writer: form.writer,
			text: form.text
		};
		if (saved) {
			post.files = saved;
		}
		mongo.insertPost(post, function (err) {
			if (err) return next(err);
			es.update(thread, post, next);
		});
	}

	function updatePost(thread, post, category, form, deleted, saved, next) {
		updateThread(function (err) {
			if (err) return next(err);
			post.writer = form.writer;
			post.text = form.text;
			if (category.editable) {
				post.visible = form.visible;
			}
			if (deleted && post.files) {
				post.files = post.files.filter(function (file) {
					return deleted.indexOf(file.name) == -1;
				});
				if (post.files.length == 0) delete post.files;
			}
			if (saved) {
				if (post.files) {
					l.merge(post.files, saved, function (file1, file2) {
						return file1.name === file2.name;
					});
				} else {
					post.files = saved;
				}
			}
			mongo.updatePost(post, function (err) {
				if (err) return next(err);
				es.update(thread, post, next);
			});
		});

		function updateThread(next) {
			if (isHead(thread, post)) {
				thread.categoryId = form.categoryId;
				thread.title = form.title;
				thread.writer = form.writer;
				mongo.updateThread(thread, next);
			} else {
				next();
			}
		}
	}

	function expFileUrls(post) {
		if (!post.files) {
			return;
		}
		for (var i = 0; i < post.files.length; i++) {
			var file = post.files[i];
			file.url = upload.postFileUrl(post._id, file.name);
		}
	}

	function isHead(thread, post) {
		return thread.created.getTime() === post.created.getTime();
	}

	function isEditable(category, postId, editables) {
		return !!(category.editable || (editables && (editables.indexOf(postId) !== -1)));
	}

});