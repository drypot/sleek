var init = require('../main/init');
var mongo = require('../main/mongo');
var es = require('../main/es');
var upload = require('../main/upload');
var rcs = require('../main/rcs');

init.add(function () {

	console.log('post:');

	exports.form = function (req) {
		var body = req.body;
		var form = {};
		form.now = new Date();
//		r.threadId = parseInt(body.threadId) || 0;
//		r.postId = parseInt(body.postId) || 0;
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
		categoryForNew(role, form.categoryId, function (err, category) {
			if (err) return next(err);
			checkForm(form, true, function (err) {
				if (err) return next(err);
				var threadId = mongo.getNewThreadId();
				insertThread(threadId, form, function (err, thread) {
					if (err) return next(err);
					var postId = mongo.getNewPostId();
					savePostFiles(postId, form, function (err) {
						if (err) return next(err);
						insertPost(postId, form, thread, category, function (err) {
							if (err) return next(err);
							next(null, threadId, postId);
						});
					});
				});
			});
		});
	}

	exports.createReply = function (role, form, next) {
		var threadId = form.threadId;
		findThread(threadId, function (err, thread) {
			if (err) return next(err);
			categoryForNew(role, thread.categoryId, function (err, category) {
				if (err) return next(err);
				checkForm(form, false, function (err) {
					if (err) return next(err);
					var postId = mongo.getNewPostId();
					savePostFiles(postId, form, function (err) {
						if (err) return next(err);
						insertPost(postId, form, thread, category, function (err) {
							if (err) return next(err);
							mongo.updateThreadLength(threadId, form.now, function (err) {
								if (err) return next(err);
								next(null, postId);
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
			mongo.findThreadsByCategory(params.categoryId, params.page, params.pageSize, function (err, threads) {
				if (err) return next(err);
				next(null, category, threads);
			});
		});
	};

	exports.threadWithPosts = function (role, threadId, next) {
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

	function fileUrls(post) {
		if (!post.upload) {
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


	function checkForm(form, head, next) {
		var error = new FieldError();

		if (head) {
			if (!form.title.length) {
				error.push('title', rcs.msgs.FILL_TITLE );
			}
			if (form.title.length > 128) {
				error.push('title', rcs.msgs.SHORTEN_TITLE);
			}
		}
		if (!form.writer) {
			error.push('writer', rcs.msgs.FILL_WRITER);
		}
		if (form.writer.length > 32) {
			error.push('writer', rcs.msgs.SHORTEN_WRITER);
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

	function categoryForNew(role, categoryId, next) {
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

	function insertThread(threadId, form, next) {
		var thread = {
			_id : threadId,
			categoryId: form.categoryId,
			hit: 0, length: 1, created: form.now, updated: form.now,
			writer : form.writer , title: form.title
		};
		mongo.insertThread(thread, function (err) {
			if (err) return next(err);
			next(null, thread);
		});
	}

	function savePostFiles(postId, form, next) {
		upload.savePostFiles(postId, form.tmpFiles, function (err, saved) {
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

	function insertPost(postId, form, thread, category, next) {
		var post = {
			_id: postId,
			threadId: thread._id,
			created: form.now,
			visible: category.editable ? form.visible : true,
			writer : form.writer,
			text: form.text
		};
		mongo.insertPost(post, function (err) {
			if (err) return next(err);
			es.updatePost(thread, post, function (err, res) {
				if (err) return next(err);
				next();
			});
		});
	}

});