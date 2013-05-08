var l = require('../main/l');
var dt = require('../main/dt');
var init = require('../main/init');
var mongo = require('../main/mongo');
var es = require('../main/es');
var upload = require('../main/upload');
var error = require('../main/error');

init.add(function () {

	console.log('post:');

	exports.makeForm = function (req) {
		var body = req.body;
		var form = {};
		form.now = new Date();
		form.cid = parseInt(body.cid) || 0;
		form.writer  = String(body.writer || '').trim();
		form.title = String(body.title || '').trim();
		form.text = String(body.text || '');
		form.visible = !!(body.hasOwnProperty('visible') ? body.visible : true);
		form.files = body.files;
		form.delFiles = body.delFiles;
		return form;
	};

	exports.createThread = function (user, form, next) {
		categoryForUpdate(user, form.cid, function (err, category) {
			if (err) return next(err);
			checkForm(form, true, function (err) {
				if (err) return next(err);
				var tid = mongo.getNewThreadId();
				var pid = mongo.getNewPostId();
				upload.savePostFiles(pid, form.files, function (err, saved) {
					if (err) return next(err);
					insertThread(tid, form, function (err, thread) {
						if (err) return next(err);
						insertPost(pid, thread, category, form, saved, function (err) {
							if (err) return next(err);
							next(null, tid, pid);
						});
					});
				});
			});
		});
	}

	exports.createReply = function (user, form, next) {
		findThread(form.tid, function (err, thread) {
			if (err) return next(err);
			categoryForUpdate(user, thread.cid, function (err, category) {
				if (err) return next(err);
				checkForm(form, false, function (err) {
					if (err) return next(err);
					var pid = mongo.getNewPostId();
					upload.savePostFiles(pid, form.files, function (err, saved) {
						if (err) return next(err);
						insertPost(pid, thread, category, form, saved, function (err) {
							if (err) return next(err);
							mongo.updateThreadLength(thread._id, form.now, function (err) {
								if (err) return next(err);
								next(null, pid);
							});
						});
					});
				});
			});
		});
	};

	exports.update = function (user, form, editables, next) {
		findThread(form.tid, function (err, thread) {
			if (err) return next(err);
			findPost(thread, form.pid, function (err, post) {
				if (err) return next(err);
				categoryForUpdate(user, thread.cid, function (err, category) {
					if (err) return next(err);
					if (!isEditable(category, post._id, editables)) {
						return next(error(error.NOT_AUTHORIZED));
					}
					var head = isHead(thread, post);
					checkNewCategory(user, form.cid, head, function (err) {
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

	exports.makeThreadsParams = function (req) {
		var query = req.query;
		var params = {};
		params.cid = parseInt(query.c) || 0;
		var pg = parseInt(query.pg) || 1;
		params.pg = pg < 1 ? 1 : pg;
		var pgsize = parseInt(query.ps) || 16;
		params.pgsize = pgsize > 128 ? 128 : pgsize < 1 ? 1 : pgsize;
		return params;
	}

	exports.findThreads = function (user, params, next) {
		categoryForRead(user, params.cid, function (err, category) {
			if (err) return next(err);
			var categories = user.categories;
			var threads = [];
			var count = 0;
			var cursor = mongo.findThreadsByCategory(params.cid, params.pg, params.pgsize);
			function read() {
				cursor.nextObject(function (err, thread) {
					if (err) return next(err);
					if (thread) {
						count++;
						if (category.id !== 0 || categories[thread.cid]) {
							thread.category = {
								id: thread.cid
							};
							thread.udateStr = dt.format(thread.udate),
							thread.udate = thread.udate.getTime(),
							threads.push(thread);
						}
						setImmediate(read);
						return;
					}
					next(null, category, threads, count !== params.pgsize);
				});
			}
			read();
		});
	};

	exports.findThreadAndPosts = function (user, tid, editables, next) {
		findThread(tid, function (err, thread) {
			if (err) return next(err);
			categoryForRead(user, thread.cid, function (err, category) {
				if (err) return next(err);
				mongo.updateThreadHit(tid, function (err) {
					if (err) return next(err);
					var admin = category.editable;
					var posts = [];
					var cursor = mongo.findPostsByThread(tid);
					function read() {
						cursor.nextObject(function (err, post) {
							if (err) return next(err);
							if (post) {
								if (post.visible || admin) {
									addFileUrls(post);
									post.editable = isEditable(category, post._id, editables);
									post.cdateStr = dt.format(post.cdate),
									post.cdate = post.cdate.getTime(),
									posts.push(post);
								}
								setImmediate(read);
								return;
							}
							next(null, category, thread, posts);
						});
					}
					read();
				});
			});
		});
	};

	exports.findThreadAndPost = function (user, tid, pid, editables, next) {
		findThread(tid, function (err, thread) {
			if (err) return next(err);
			findPost(thread, pid, function (err, post) {
				if (err) return next(err);
				categoryForRead(user, thread.cid, function (err, category) {
					if (err) return next(err);
					addFileUrls(post);
					post.head = isHead(thread, post);
					post.editable = isEditable(category, post._id, editables)
					post.cdateStr = dt.format(post.cdate);
					post.cdate = post.cdate.getTime();
					next(null, category, thread, post);
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

	function categoryForUpdate(user, cid, next) {
		var category = user.categories[cid];
		if (!category) {
			return next(error(error.INVALID_CATEGORY));
		}
		if (!category.writable) {
			return next(error(error.NOT_AUTHORIZED));
		}
		next(null, category);
	}

	function categoryForRead(user, cid, next) {
		var category = user.categories[cid];
		if (!category) {
			return next(error(error.INVALID_CATEGORY));
		}
		if (!category.readable) {
			return next(error(error.NOT_AUTHORIZED));
		}
		next(null, category);
	}

	function checkNewCategory(user, cid, head, next) {
		if (head) {
			categoryForUpdate(user, cid, next);
		} else {
			next();
		}
	}

	function findThread(tid, next) {
		mongo.findThread(tid, function (err, thread) {
			if (err) {
				return next(err);
			}
			if (!thread) {
				return next(error(error.INVALID_THREAD));
			}
			next(null, thread);
		});
	}

	function findPost(thread, pid, next) {
		mongo.findPost(pid, function (err, post) {
			if (err) {
				return next(err);
			}
			if (!post || post.tid !== thread._id) {
				return next(error(error.INVALID_POST));
			}
			next(null, post);
		});
	}

	function insertThread(tid, form, next) {
		var thread = {
			_id : tid,
			cid: form.cid,
			hit: 0,
			length: 1,
			cdate: form.now,
			udate: form.now,
			writer: form.writer,
			title: form.title
		};
		mongo.insertThread(thread, function (err) {
			if (err) return next(err);
			next(null, thread);
		});
	}

	function insertPost(pid, thread, category, form, saved, next) {
		var post = {
			_id: pid,
			tid: thread._id,
			cdate: form.now,
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
				thread.cid = form.cid;
				thread.title = form.title;
				thread.writer = form.writer;
				mongo.updateThread(thread, next);
			} else {
				next();
			}
		}
	}

	function addFileUrls(post) {
		if (!post.files) {
			return;
		}
		for (var i = 0; i < post.files.length; i++) {
			var file = post.files[i];
			file.url = upload.postFileUrl(post._id, file.name);
		}
	}

	function isHead(thread, post) {
		return thread.cdate.getTime() === post.cdate.getTime();
	}

	function isEditable(category, pid, editables) {
		return !!(category.editable || (editables && (editables.indexOf(pid) !== -1)));
	}

});