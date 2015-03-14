var fs = require('fs');
var path = require('path');

var l = require('../base/util');
var init = require('../base/init');
var config = require('../base/config');
var error = require('../base/error');
var dt = require('../base/dt');
var fs2 = require('../base/fs');
var tokenize = require('../search/tokenizer').tokenize;
var mongo = require('../mongo/mongo');
var upload = require('../upload/upload');

init.add(function () {

	console.log('post:');

	exports.makeForm = function (req) {
		var body = req.body;
		var form = {};
		form.now = new Date();
		form.cid = parseInt(body.cid) || 0;
		form.writer  = String(body.writer || '').trim();
		form.title = String(body.title || '').trim();
		form.text = String(body.text || '').trim();
		form.visible = body.hasOwnProperty('visible') ? !!body.visible : true;
		form.files = body.files;
		form.dfiles = body.dfiles;
		return form;
	};

	exports.createThread = function (user, form, next) {
		categoryForUpdate(user, form.cid, function (err, category) {
			if (err) return next(err);
			checkForm(form, true, function (err) {
				if (err) return next(err);
				var tid = mongo.getNewThreadId();
				var pid = mongo.getNewPostId();
				saveFiles(pid, form.files, function (err, saved) {
					if (err) return next(err);
					insertThread(tid, form, function (err, thread) {
						if (err) return next(err);
						insertPost(pid, thread, user, form, saved, function (err) {
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
					saveFiles(pid, form.files, function (err, saved) {
						if (err) return next(err);
						insertPost(pid, thread, user, form, saved, function (err) {
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

	exports.updatePost = function (user, form, editables, next) {
		findThread(form.tid, function (err, thread) {
			if (err) return next(err);
			findPost(thread, form.pid, function (err, post) {
				if (err) return next(err);
				categoryForUpdate(user, thread.cid, function (err, category) {
					if (err) return next(err);
					if (!isEditable(user, post._id, editables)) {
						return next(error(error.NOT_AUTHORIZED));
					}
					var head = isHead(thread, post);
					checkNewCategory(user, form.cid, head, function (err) {
						if (err) return next(err);
						checkForm(form, head, function (err) {
							if (err) return next(err);
							deleteFiles(post._id, form.dfiles, function (err, deleted) {
								if (err) return next(err);
								saveFiles(post._id, form.files, function (err, saved) {
									if (err) return next(err);
									updatePost(thread, post, user, form, deleted, saved, next);
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
		var categories = user.categories;
		var threads = [];
		var count = 0;
		var cursor = mongo.findThreads(params.pg, params.pgsize);
		function read() {
			cursor.nextObject(function (err, thread) {
				if (err) return next(err);
				if (thread) {
					count++;
					var c = categories[thread.cid];
					if (c) {
						thread.category = {
							id: c.id,
							name: c.name
						};
						thread.udateStr = dt.format(thread.udate),
						thread.udate = thread.udate.getTime(),
						threads.push(thread);
					}
					setImmediate(read);
					return;
				}
				next(null, threads, count !== params.pgsize);
			});
		}
		read();
	};

	exports.findThreadsByCategory = function (user, params, next) {
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
						thread.udateStr = dt.format(thread.udate),
						thread.udate = thread.udate.getTime(),
						threads.push(thread);
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
					var posts = [];
					var cursor = mongo.findPostsByThread(tid);
					function read() {
						cursor.nextObject(function (err, post) {
							if (err) return next(err);
							if (post) {
								if (post.visible || user.admin) {
									addFileUrls(post);
									post.editable = isEditable(user, post._id, editables);
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
					post.editable = isEditable(user, post._id, editables)
					post.cdateStr = dt.format(post.cdate);
					post.cdate = post.cdate.getTime();
					next(null, category, thread, post);
				});
			});
		});
	};

	function checkForm(form, head, next) {
		var errors = new error.Errors();

		if (head) {
			if (!form.title.length) {
				errors.add('title', error.msg.FILL_TITLE);
			}
			if (form.title.length > 128) {
				errors.add('title', error.msg.SHORTEN_TITLE);
			}
		}
		if (!form.writer) {
			errors.add('writer', error.msg.FILL_WRITER);
		}
		if (form.writer.length > 32) {
			errors.add('writer', error.msg.SHORTEN_WRITER);
		}
		if (errors.hasErrors()) {
			return next(error(errors));
		}

		next();
	}

	function categoryForUpdate(user, cid, next) {
		var category = user.categories[cid];
		if (!category) {
			return next(error(error.INVALID_CATEGORY));
		}
		next(null, category);
	}

	function categoryForRead(user, cid, next) {
		var category = user.categories[cid];
		if (!category) {
			return next(error(error.INVALID_CATEGORY));
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

	exports.getFilePath = function (pid, fname) {
		return upload.pubPost + '/' + Math.floor(pid / 10000) + '/' + pid + (fname ? '/' + fname : '');
	};

	exports.getFileUrl = function (pid, fname) {
		return config.data.uploadUrl + '/post/' + Math.floor(pid / 10000) + '/' + pid + '/' + encodeURIComponent(fname);
	}

	function addFileUrls(post) {
		if (post.files) {
			for (var i = 0; i < post.files.length; i++) {
				var file = post.files[i];
				file.url = exports.getFileUrl(post._id, file.name);
			}
		}
	}

	function saveFiles (pid, files, next) {
		if (files) {
			fs2.makeDirs(exports.getFilePath(pid), function (err, dir) {
				if (err) return next(err);
				var saved = [];
				var i = 0;
				function save() {
					if (i == files.length) {
						return next(null, saved);
					}
					var file = files[i++];
					var safeName = fs2.safeFilename(path.basename(file.oname));
					fs.rename(upload.getTmpPath(file.tname), dir + '/' + safeName, function (err) {
						if (err) {
							if (err.code !== 'ENOENT') return next(err);
						} else {
							saved.push({ name: safeName });
						}
						setImmediate(save);
					});
				}
				save();
			});
			return;
		}
		next();
	}

	function deleteFiles(pid, files, next) {
		if (files) {
			var dir = exports.getFilePath(pid);
			var deleted = [];
			var i = 0;
			function del() {
				if (i == files.length) {
					return next(null, deleted);
				}
				var file = files[i++];
				var name = path.basename(file);
				var p = dir + '/' + name;
				fs.unlink(p, function (err) {
					if (err && err.code !== 'ENOENT') return next(err);
					deleted.push(name);
					setImmediate(del);
				});
			}
			del();
			return;
		}
		next();
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

	function insertPost(pid, thread, user, form, saved, next) {
		var post = {
			_id: pid,
			tid: thread._id,
			cdate: form.now,
			visible: user.admin ? form.visible : true,
			writer: form.writer,
			text: form.text
		};
		if (saved) {
			post.files = saved;
		}
		setTokens(thread, post);
		mongo.insertPost(post, next);
	}

	function updatePost(thread, post, user, form, deleted, saved, next) {
		updateThread(function (err) {
			if (err) return next(err);
			post.writer = form.writer;
			post.text = form.text;
			if (user.admin) {
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
			setTokens(thread, post);
			mongo.updatePost(post, next);
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

	function isHead(thread, post) {
		return thread.cdate.getTime() === post.cdate.getTime();
	}

	function isEditable(user, pid, editables) {
		return !!(user.admin || (editables && (editables.indexOf(pid) !== -1)));
	}

	function setTokens (thread, post) {
		if (isHead(thread, post)) {
			post.tokens = tokenize(thread.title, post.writer, post.text);
		} else {
			post.tokens = tokenize(post.writer, post.text);
		}
	}

	exports.rebuildTokens = function (next) {
		var count = 0;
		var threads = mongo.threads.find();

		function readThread() {
			threads.nextObject(function (err, thread) {
				if (err) return next(err);
				if (thread) {
					var posts = mongo.posts.find({ tid: thread._id });
					function readPost() {
						posts.nextObject(function (err, post) {
							if (err) return next(err);
							if (post) {
								setTokens(thread, post);
								mongo.posts.update({ _id: post._id }, { $set: { tokens: post.tokens } }, function (err) {
									if (err) return next(err);
									count++;
									if (count % 1000 === 0) {
										process.stdout.write(count + ' ');
									}
									setImmediate(readPost);
								});
								return;
							}
							setImmediate(readThread);
						});
					}
					readPost();
					return;
				}
				next();
			});
		}
		readThread();
	}

});