
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
	}

	exports.createThread = function (role, form, next) {
		categoryForNew(role, form.categoryId, next, function (category) {
			checkForm(form, true, next, function () {
				var threadId = mongo.getNewThreadId();
				insertThread(threadId, form, next, function (thread) {
					var postId = mongo.getNewPostId();
					savePostFiles(postId, form, next, function () {
						insertPost(postId, form, thread, next, function () {
							next({ rc: rcs.SUCCESS, threadId: threadId, postId: postId });
						});
					});
				});
			});
		});
	}

	function categoryForNew(role, categoryId, next, next2) {
		var category = role.categories[categoryId];
		if (!category) {
			return next({ rc: rcs.INVALID_CATEGORY });
		}
		if (!category.writable) {
			return next({ rc: rcs.NOT_AUTHORIZED });
		}
		next2(category);
	}

	function checkForm(form, head, next, next2) {
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
		if (error.fields.length) {
			return next({ rc: rcs.INVALID_DATA, fields: error.fields });
		}

		next2();
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
		return fields.length > 0; //TODO: check emtpy
	}

	function insertThread(threadId, form, next, next2) {
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
			next2(thread);
		});
	}

	function savePostFiles(postId, form, next, next2) {
		upload.savePostFiles(postId, form.tmpFiles, function (err, saved) {
			if (err) {
				return next({ rc: rcs.FILE_IO_ERR });
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
			next2();
		});
	}

	function insertPost(postId, form, thread, next, next2) {
		var post = {
			_id: postId,
			threadId: thread._id,
			created: form.now, visible: true,
			writer : form.writer , text: form.text
		};
		mongo.insertPost(post, function (err) {
			if (err) {
				return next({ rc: rcs.DB_IO_ERR });
			}
			es.updatePost(thread, post, function (err, res) {
				if (err) {
					return next({ rc: rcs.SEARCH_IO_ERR });
				}
				next2();
			});
		});
	}

	return exports;

}