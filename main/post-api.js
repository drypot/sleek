var _ = require('underscore');
var should = require('should');

var l = require('./l.js');
var Role = require('./role.js');
var auth = require('./auth.js');
var Form = require('./post-form.js');
var msg = require('./msg.js');

exports.register = function (e) {
	e.post('/api/get-thread-list', auth.filter.login(), function (req, res) {
		var role = Role.getByName(req.session.roleName);
		var categoryId = l.post.int(body, 'categoryId', 0);

		if (!role.category[categoryId].readable) {
			return res.json(400, {error: msg.ERR_NOT_AUTHORIZED});
		}
	//		return "post/list";
	});

	e.post('/api/get-head', auth.filter.login(), function (req, res) {
		var role = Role.getByName(req.session.roleName);
		var categoryId = l.post.int(body, 'categoryId', 0);

		if (!role.category[categoryId].readable) {
			return res.json(400, {error: msg.ERR_NOT_AUTHORIZED});
		}

	//		postContext.updateThreadHit();
	//		return "post/view";
	});

	e.post('/api/get-reply', auth.filter.login(), function (req, res) {
		var role = Role.getByName(req.session.roleName); ;
		var categoryId = l.post.int(body, 'categoryId', 0);

		if (!role.category[categoryId].readable) {
			return res.json(400, {error: msg.ERR_NOT_AUTHORIZED});
		}

	//		return "post ...";
	});

	function checkCategory(res, category) {
		if (!category) {
			res.json(400, {error: msg.ERR_INVALID_CATEGORY});
			return false;
		}
		if (!category.writable) {
			res.json(400, {error: msg.ERR_NOT_AUTHORIZED});
			return false;
		}
		return true;
	}

	function checkThread(res, thread) {
		if (!thread) {
			res.json(400, {error: msg.ERR_INVALID_THREAD});
			return false;
		}
		return true;
	}

	function checkPost(res, post) {
		if (!post) {
			res.json(400, {error: msg.ERR_INVALID_POST});
			return false;
		}
		return true;
	}

	function checkFieldError(res, error) {
		if (error.length) {
			res.json(400, {error: msg.ERR_INVALID_DATA, field: error});
			return false;
		}
		return true;
	}

	e.post('/api/create-post', auth.filter.login(), function (req, res, next) {
		var role = Role.getByName(req.session.roleName);
		var form = new Form(req);
		if (!form.threadId) {
			// head
			if (!checkCategory(res, role.category[form.categoryId])) return;
			if (!checkFieldError(res, form.validateHead())) return;
			form.insertThread(function (err, thread) {
				if (err) return next(err);
				form.insertPost(thread, function (err, post) {
					if (err) return next(err);
					req.session.post.push(post._id);
					return res.json(200, {threadId: thread._id, postId: post._id});
				});
			});
		} else {
			// reply
			form.findThread(function (err, thread) {
				if (err) return next(err);
				if (!checkThread(res, thread)) return;
				if (!checkCategory(res, role.category[thread.categoryId])) return;
				if (!checkFieldError(res, form.validateReply())) return;
				form.insertPost(thread, function (err, post) {
					if (err) return next(err);
					form.updateThreadLength(thread);
					req.session.post.push(post._id);
					return res.json(200, {postId: post._id});
				});
			});
		}
	});

	e.post('/api/update-post', auth.filter.login(), function (req, res, next) {
		var role = Role.getByName(req.session.roleName);
		var form = new Form(req);
		form.findThreadAndPost(function (err, thread, post) {
			if (err) return next(err);
			if (!checkThread(res, thread)) return;
			if (!checkPost(res, post)) return;
			var head = thread.cdate === post.cdate;
			var category = role.category[thread.categoryId];
			if (!checkCategory(res, category)) return;
			if (!category.editable) {
				if (!_.include(req.session.post, form.postId)) {
					return res.json(400, {error: msg.ERR_NOT_AUTHORIZED});
				}
				delete form.visible;
			}
			if (head) {
				var formCategory = role.category[form.categoryId];
				if (!checkCategory(res, formCategory)) return;
				if (!checkFieldError(res, form.validateHead())) return;
				form.updateThread(thread, function (err) {
					if (err) return next(err);
					form.updatePost(post, function (err) {
						if (err) return next(err);
						res.json(200, 'ok');
					});
				});
			} else {
				if (!checkFieldError(res, form.validateReply())) return;
				form.updatePost(post, function (err) {
					if (err) return next(err);
					res.json(200, 'ok');
				});
			}
		});
	});

	e.configure('development', function () {
		e.post('/api/test/create-head-with-file', function (req, res, next) {
			req.body = _.extend(req.body,
				{ categoryId: 101, userName : 'snowman', title: 'title u1', text: 'text u1' }
			);
			var form = new Form(req);
			form.createHead(function (err, thread, post) {
				if (err) return next(err);
				res.json(200, {threadId: thread._id, postId: post._id});
			});
		});

		e.post('/api/test/update-head-with-file', function (req, res, next) {
			req.body = _.extend(req.body,
				{ userName : 'snowman', title: 'title u1', text: 'text u1' }
			);
			var form = new Form(req);
			form.findThreadAndPost(function (err, thread, post) {
				if (err) return next(err);
				if (!thread || !post) {
					return res.json(400, {error: msg.ERR_INVALID_THREAD});
				}
				form.updateHead(thread, post, false, function (err) {
					if (err) return next(err);
					res.json(200, 'ok');
				});
			});
		});
	});
};