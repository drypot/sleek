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

	e.post('/api/create-head', auth.filter.login(), function (req, res, next) {
		var role = Role.getByName(req.session.roleName);
		var form = new Form(req);
		var category = role.category[form.categoryId];

		if (!category) {
			return res.json(400, {error: msg.ERR_INVALID_CATEGORY});
		}
		if (!role.category[form.categoryId].writable) {
			return res.json(400, {error: msg.ERR_NOT_AUTHORIZED});
		}
		form.validateHead();
		if (form.error.length) {
			return res.json(400, {error: msg.ERR_INVALID_DATA, field: form.error});
		}
		form.createHead(function (err, thread, post) {
			if (err) return next(err);
			req.session.post.push(post._id);
			res.json(200, {threadId: thread._id, postId: post._id});
		});
	});

	e.post('/api/create-reply', auth.filter.login(), function (req, res, next) {
		var role = Role.getByName(req.session.roleName);
		var form = new Form(req);

		form.findThread(function (err, thread) {
			if (err) return next(err);
			if (!thread) {
				return res.json(400, {error: msg.ERR_INVALID_THREAD});
			}

			var category = role.category[thread.categoryId];

			if (!category) {
				return res.json(400, {error: msg.ERR_INVALID_CATEGORY});
			}
			if (!category.writable) {
				return res.json(400, {error: msg.ERR_NOT_AUTHORIZED});
			}
			form.validateReply();
			if (form.error.length) {
				return res.json(400, {error: msg.ERR_INVALID_DATA, field: form.error});
			}
			form.createReply(thread, function (err, post) {
				if (err) return next(err);
				req.session.post.push(post._id);
				res.json(200, {postId: post._id});
			});
		});
	});

	e.post('/api/update-head', auth.filter.login(), function (req, res, next) {
		var role = Role.getByName(req.session.roleName);
		var form = new Form(req);

		form.findThreadAndPost(function (err, thread, post) {
			if (err) return next(err);
			if (!thread || !post) {
				return res.json(400, {error: msg.ERR_INVALID_THREAD});
			}

			var head = thread.cdate === post.cdate;
			var category = role.category[thread.categoryId];
			var formCategory = role.category[form.categoryId];

			if (!category || !formCategory) {
				return res.json(400, {error: msg.ERR_INVALID_CATEGORY});
			}
			if (!head) {
				return res.json(400, {error: msg.ERR_INVALID_DATA});
			}
			if (!category.writable || !formCategory.writable || (!_.include(req.session.post, form.postId) && !category.editable)) {
				return res.json(400, {error: msg.ERR_NOT_AUTHORIZED});
			}
			form.validateHead();
			if (form.error.length) {
				return res.json(400, {error: msg.ERR_INVALID_DATA, field: form.error});
			}
			form.updateHead(thread, post, category.editable, function (err) {
				if (err) return next(err);
				res.json(200, 'ok');
			});
		});
	});

	e.post('/api/update-reply', auth.filter.login(), function (req, res, next) {
		var role = Role.getByName(req.session.roleName);
		var form = new Form(req);

		form.findThreadAndPost(function (err, thread, post) {
			if (err) return next(err);
			if (!thread || !post) {
				return res.json(400, {error: msg.ERR_INVALID_THREAD});
			}

			var category = role.category[thread.categoryId];

			if (!category) {
				return res.json(400, {error: msg.ERR_INVALID_CATEGORY});
			}
			if (!category.writable || (!_.include(req.session.post, form.postId) && !category.editable)) {
				return res.json(400, {error: msg.ERR_NOT_AUTHORIZED});
			}
			form.validateReply();
			if (form.error) {
				return res.json(400, {error: msg.ERR_INVALID_DATA, field: form.error});
			}
			form.updateReply(thread, post, function (err) {
				if (err) return next(err);
				res.json(200, 'ok');
			});
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
}