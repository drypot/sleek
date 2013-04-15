var init = require('../main/init');
var mongo = require('../main/mongo');
var es = require('../main/es');
var upload = require('../main/upload');
var rcs = require('../main/rcs');
var msgs = require('../main/msgs');

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
		form.visible = !!body.visible;
		form.delFiles = body.delFiles;
		form.tmpFiles = body.tmpFiles;
		return form;
	};

	exports.createThread = function (role, form, next) {
		categoryForUpdate(role, form.categoryId, function (err, category) {
			if (err) return next(err);
			checkForm(form, true, function (err) {
				if (err) return next(err);
				var threadId = mongo.getNewThreadId();
				var postId = mongo.getNewPostId();
				saveTmpFiles(form, postId, function (err) {
					if (err) return next(err);
					insertThread(form, threadId, function (err, thread) {
						if (err) return next(err);
						insertPost(thread, category, form, postId, function (err) {
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
					saveTmpFiles(form, postId, function (err) {
						if (err) return next(err);
						insertPost(thread, category, form, postId, function (err) {
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
					if (!editable(category, post._id, editables)) {
						return next({ rc: rcs.NOT_AUTHORIZED });
					}
					var head = head(thread, post);
					checkNewCategory(role, form.categoryId, head, function (err) {
						if (err) return next(err);
						checkForm(form, head, function (err) {
							if (err) return next(err);
							deletePostFiles(post, form, function (err) {
								if (err) return next(err);
								saveTmpFiles(form, post._id, function (err) {
									if (err) return next(err);
									updatePost(thread, post, category, form, next);
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
		var pageSize = parseInt(query.ps) || 32;
		params.pageSize = pageSize > 128 ? 128 : pageSize < 1 ? 1 : pageSize;
		return params;
	}

	exports.threads = function (role, params, next) {
		categoryForRead(role, params.categoryId, function (err, category) {
			if (err) return next(err);
			var categories = role.categories;
			var threads = [];
			mongo.findThreadsByCategory(params.categoryId, params.page, params.pageSize, function (err, thread) {
				if (err) return next(err);
				if (thread) {
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
				next(null, threads);
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
							posts.push({
								id: post._id,
								writer: post.writer,
								created: post.created,
								text: post.text,
								files: fileUrls(post)
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
					var postX = {
						id: post._id,
						writer: post.writer,
						created: post.created,
						text: post.text,
						visible: post.visible,
						files: fileUrls(post),
						head: head(thread, post),
						editable: editable(category, post._id, editablePosts)
					}
					next(err, thread, postX);
				});
			});
		});
	};

	function checkForm(form, head, next) {
		var error = new FieldError();

		if (head) {
			if (!form.title.length) {
				error.push('title', msgs.FILL_TITLE );
			}
			if (form.title.length > 128) {
				error.push('title', msgs.SHORTEN_TITLE);
			}
		}
		if (!form.writer) {
			error.push('writer', msgs.FILL_WRITER);
		}
		if (form.writer.length > 32) {
			error.push('writer', msgs.SHORTEN_WRITER);
		}
		if (error.hasError()) {
			return next({ rc: rcs.INVALID_DATA, fields: error.fields });
		}

		next();
	}

	var FieldError = function () {
		this.fields = {};
	}

	FieldError.prototype.push = function push(field, msg) {
		var errors = this.fields[field];
		if (!errors) {
			errors = this.fields[field] = [];
		}
		errors.push(msg);
	}

	FieldError.prototype.hasError = function () {
		var has = false;
		for (var key in this.fields) {
			has = true;
			break;
		}
		return has;
	}

	function categoryForUpdate(role, categoryId, next) {
		var category = role.categories[categoryId];
		if (!category) {
			return next({ rc: rcs.INVALID_CATEGORY });
		}
		if (!category.writable) {
			return next({ rc: rcs.NOT_AUTHORIZED });
		}
		next(null, category);
	}

	function categoryForRead(role, categoryId, next) {
		var category = role.categories[categoryId];
		if (!category) {
			return next({ rc: rcs.INVALID_CATEGORY });
		}
		if (!category.readable) {
			return next({ rc: rcs.NOT_AUTHORIZED });
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
				return next({ rc: rcs.INVALID_THREAD });
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
				return next({ rc: rcs.INVALID_POST });
			}
			next(null, post);
		});
	}

	function insertThread(form, threadId, next) {
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

	function insertPost(thread, category, form, postId, next) {
		var post = {
			_id: postId,
			threadId: thread._id,
			created: form.now,
			visible: category.editable ? form.visible : true,
			writer: form.writer,
			text: form.text
		};
		mongo.insertPost(post, function (err) {
			if (err) return next(err);
			es.updatePost(thread, post, next);
		});
	}

	function updatePost(thread, post, category, form, next) {
		updateThread(function (err) {
			if (err) return next(err);
			post.writer = form.writer;
			post.text = form.text;
			if (category.editable) {
				post.visible = form.visible;
			}
			mongo.updatePost(post, function (err) {
				if (err) return next(err);
				es.updatePost(thread, post, next);
			});
		});

		function updateThread(next) {
			if (head(thread, post)) {
				thread.categoryId = form.categoryId;
				thread.title = form.title;
				thread.writer = form.writer;
				mongo.updateThread(thread, next);
			} else {
				next();
			}
		}
	}

	function saveTmpFiles(form, postId, next) {
		upload.saveTmpFilesToPost(form.tmpFiles, postId, function (err, saved) {
			if (err) return next(err);
			if (saved) {
				if (form.files) {
					saved.forEach(function (saved) {
						if (form.files.indexOf(saved) == -1) {
							form.files.push(saved);
						}
					});
				} else {
					form.files = saved;
				}
			}
			next();
		});
	}

	function deletePostFiles(post, form, next) {
		upload.deletePostFiles(post._id, form.delFiles, function (err, deleted) {
			if (err) return next(err);
			if (deleted && post.files) {
				post.files = post.files.filter(function (file) {
					return deleted.indexOf(file) == -1;
				});
				if (post.files.length == 0) delete post.files;
			}
			next();
		});
	}

	function fileUrls(post) {
		if (!post.files) {
			return undefined;
		}
		var urls = [];
		post.files.forEach(function (file) {
			urls.push({
				name: file,
				url: upload.postFileUrl(post._id, file)
			});
		});
		return urls;
	}

	function head(thread, post) {
		return thread.created.getTime() === post.created.getTime();
	}

	function editable(category, postId, editables) {
		return !!(category.editable || (editables && (editables.indexOf(postId) !== -1)));
	}

});