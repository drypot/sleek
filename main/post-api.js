
ex.post('/api/get-thread-list', assertLoggedIn, function (req, res) {
	var role = role$.getByName(req.session.roleName);
	var categoryId = l.intp(body, 'categoryId', 0);

	if (!role.category[categoryId].readable) {
		return res.json(400, {error: ERR_NOT_AUTHORIZED});
	}
//		return "post/list";
});

ex.post('/api/get-thread', assertLoggedIn, function (req, res) {
	var role = role$.getByName(req.session.roleName);
	var categoryId = l.intp(body, 'categoryId', 0);

	if (!role.category[categoryId].readable) {
		return res.json(400, {error: ERR_NOT_AUTHORIZED});
	}

//		postContext.updateThreadHit();
//		return "post/view";
});

ex.post('/api/get-head & reply', assertLoggedIn, function (req, res) {
	var role = role$.getByName(req.session.roleName); ;
	var categoryId = l.intp(body, 'categoryId', 0);

	if (!role.category[categoryId].readable) {
		return res.json(400, {error: ERR_NOT_AUTHORIZED});
	}

//		return "post ...";
});

ex.post('/api/create-head', assertLoggedIn, function (req, res, next) {
	var role = role$.getByName(req.session.roleName);
	var form = form$.make(req);
	var category = role.category[form.categoryId];

	if (!category) {
		return res.json(400, {error: ERR_INVALID_CATEGORY});
	}
	if (!role.category[form.categoryId].writable) {
		return res.json(400, {error: ERR_NOT_AUTHORIZED});
	}
	form.validateHead();
	if (form.error.length) {
		return res.json(400, {error: ERR_INVALID_DATA, field: form.error});
	}
	form.createHead(function (err, thread, post) {
		if (err) return next(err);
		req.session.post.push(post._id);
		res.json(200, {threadId: thread._id, postId: post._id});
	});
});

ex.post('/api/create-reply', assertLoggedIn, function (req, res, next) {
	var role = role$.getByName(req.session.roleName);
	var form = form$.make(req);
	form.findThread(function (err, thread) {
		if (err) return next(err);
		var category = role.category[thread.categoryId];
		if (!category) {
			return res.json(400, {error: ERR_INVALID_CATEGORY});
		}
		if (!category.writable) {
			return res.json(400, {error: ERR_NOT_AUTHORIZED});
		}
		var errors = [];
		form.validateReply(errors);
		if (errors.length) {
			return res.json(400, {error: ERR_INVALID_DATA, error: errors});
		}
		form.createReply(thread, function (err, post) {
			if (err) return next(err);
			req.session.post.push(post._id);
			res.json(200, {postId: post._id});
		});
	});
});

ex.put('/api/update-head', assertLoggedIn, function (req, res, next) {
	var role = role$.getByName(req.session.roleName);
	var form = form$.make(req);
	var errors = [];

	if (!category) {
		return res.json(400, {error: ERR_INVALID_CATEGORY});
	}

	form.findThreadAndPost(function (err, thread, post) {
		if (err) return next(err);

		var isHead = thread.cdate === post.cdate;
		var category = role.category[thread.categoryId];
		var newCategory = role.category[form.categoryId];

		if (!isHead) return res.json(400, {error: ERR_INVALID_DATA});

		if (!category.writable || !newCategory.writable || (!_.include(req.session.post, form.postId) && !category.editable)) {
			return res.json(400, {error: ERR_NOT_AUTHORIZED});
		}

		form.validateHead(errors);
		if (errors.length) {
			return res.json(400, {error: ERR_INVALID_DATA, error: errors});
		}

		form.updateHead(thread, post, category.editable, function (err) {
			if (err) return next(err);
			res.json(200, 'ok');
		});
	});
});

ex.put('/api/update-reply', assertLoggedIn, function (req, res, next) {
	var role = role$.getByName(req.session.roleName);
	var form = form$.make(req);
	var errors = [];

	if (!category) {
		return res.json(400, {error: ERR_INVALID_CATEGORY});
	}

	form.findThreadAndPost(function (err, thread, post) {
		if (err) return next(err);

		var category = role.category[thread.categoryId];

		if (!category.writable || (!_.include(req.session.post, form.postId) && !category.editable)) {
			return res.json(400, {error: ERR_NOT_AUTHORIZED});
		}

		form.validateReply(errors);
		if (errors.length) {
			return res.json(400, {error: ERR_INVALID_DATA, error: errors});
		}

		form.updateReply(thread, post, function (err) {
			if (err) return next(err);
			res.json(200, 'ok');
		});
	});
});
