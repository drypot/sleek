
var rcs = require('./rcs');

module.exports = function (opt) {

	var exports = {};

	var mongo = opt.mongo;
	var es = opt.es;
	var upload = opt.upload;

	exports.formFromRequest = function (req) {
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

	exports.threadListParam = function (req, end) {
		var query = req.query;
		var categoryId = parseInt(query.c) || 0;
		var page = parseInt(query.p) || 0;
		var pageSize = parseInt(query.ps) || 1;
		pageSize = pageSize > 128 ? 128 : pageSize < 1 ? 1 : pageSize;
		end(categoryId, page, pageSize);
	}


	exports.createThread = function (role, form, end) {
		categoryForNew(role, form.categoryId, end, function (category) {
			checkForm(form, true, end, function () {
				var threadId = mongo.getNewThreadId();
				insertThread(threadId, form, end, function (thread) {
					var postId = mongo.getNewPostId();
					savePostFiles(postId, form, end, function () {
						insertPost(postId, form, thread, end, function () {
							end({ rc: rcs.SUCCESS, threadId: threadId, postId: postId });
						});
					});
				});
			});
		});
	}

	function categoryForNew(role, categoryId, end, next) {
		var category = role.categories[categoryId];
		if (!category) {
			return end({ rc: rcs.INVALID_CATEGORY });
		}
		if (!category.writable) {
			return end({ rc: rcs.NOT_AUTHORIZED });
		}
		next(category);
	}

	function checkForm(form, head, end, next) {
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
			return end({ rc: rcs.INVALID_DATA, fields: error.fields });
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

	function insertThread(threadId, form, end, next) {
		var thread = {
			_id : threadId,
			categoryId: form.categoryId,
			hit: 0, length: 1, created: form.now, updated: form.now,
			writer : form.writer , title: form.title
		};
		mongo.insertThread(thread, function (err) {
			if (err) {
				return { rc:  rcs.DB_IO_ERR };
			}
			next(thread);
		});
	}

	function savePostFiles(postId, form, end, next) {
		upload.savePostFiles(postId, form.tmpFiles, function (err, saved) {
			if (err) {
				return end({ rc: rcs.FILE_IO_ERR });
			}
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

	function insertPost(postId, form, thread, end, next) {
		var post = {
			_id: postId,
			threadId: thread._id,
			created: form.now, visible: true,
			writer : form.writer , text: form.text
		};
		mongo.insertPost(post, function (err) {
			if (err) {
				return end({ rc: rcs.DB_IO_ERR });
			}
			es.updatePost(thread, post, function (err, res) {
				if (err) {
					return end({ rc: rcs.SEARCH_IO_ERR });
				}
				next();
			});
		});
	}

	return exports;

}