module.exports = function () {

	app.get('/thread', function (req, res, next) {
		req.authorized(function () {
			prepareThreadListParam(req, function (categoryId, page, pageSize) {
				prepareReadableCategory(res, categoryId, function (category) {
					mongo.findThreadByCategory(categoryId, page, pageSize, function (err, thread) {
						if (err) return next(err);
						var categories = res.locals.role.category;
						var r = {
							title: category.name,
							category: {
								id: category.id,
								name: category.name
							},
							thread: [],
							prevUrl: null,
							nextUrl: null
						};
						iterThreadList(page, thread, function (thread) {
							if (category.id === 0 && !categories[thread.categoryId]) {
								//
							} else {
								r.thread.push({
									id: thread._id,
									category: {
										id: thread.categoryId,
										name: categories[thread.categoryId].name
									},
									hit: thread.hit,
									//length: thread.length,
									//updated: thread.updated.getTime(),
									writer: thread.writer,
									title: thread.title,

									reply: thread.length - 1,
									updatedStr: l.formatDateTime(thread.updated)
								});
							}
						});
						// TODO: 최근글 하일라이트
//							CharSequence titleCss = "thread" +
//								(thread.getUdate().getMillis() > authService.getLastVisit().getMillis() ? " tn" : "") +
//								(thread.getId() == postContext.getParam().getThreadId() ? " tc" : "");

						prevNext(page, pageSize, thread, function (prev, next) {
							var u;
							if (prev) {
								u = new l.UrlMaker('/thread');
								u.addIfNot('c', categoryId, 0);
								u.addIfNot('p', prev, 1);
								r.prevUrl = u.toString();
							}
							if (next) {
								u = new l.UrlMaker('/thread');
								u.addIfNot('c', categoryId, 0);
								u.addIfNot('p', next, 1);
								r.nextUrl = u.toString();
							}
						})
						res.render('thread', r);
					});
				});
			});
		});
	});

	function prevNext(page, pageSize, array, func) {
		var prev, next;
		if (page > 0) {
			prev = page === 1 ? null : page - 1;
			next = array.length !== pageSize ? null : page + 1;
		} else {
			prev = array.length !== pageSize ? null : page - 1;
			next = page === -1 ? null : page + 1;
		}
		func(prev, next);
	}

	app.get('/thread/:threadId([0-9]+)', function (req, res, next) {
		req.authorized(function () {
			var threadId = l.int(req.params, 'threadId', 0);
			prepareThread(res, threadId, function (thread) {
				prepareReadableCategory(res, thread.categoryId, function (category) {
					var r = {
						title: thread.title,
						thread: {
							id: thread._id
						},
						category: {
							id: category.id,
							name: category.name
						},
						post: []
					};
					mongo.findPostByThread(threadId, function (err, post) {
						if (err) {
							next(err);
						} else {
							iterPostList(category, post, function (post) {
								r.post.push({
									id: post._id,
									writer: post.writer,
									//created: post.created,
									text: post.text,
									upload: uploadUrl(post),

									createdStr: l.formatDateTime(new Date(post.created)),
									editable: category.editable || _.include(req.session.post, post.id),
								});


							});
							res.render('thread-num', r);
						}
					});
				});
			});

		});
	});

	app.get('/thread/new', function (req, res, next) {
		req.authorized(function () {
			var categoryId = l.int(req.query, 'c', 0);
			if (categoryId == 0) {
				categoryId = res.locals.role.writableCategory[0].id;
			}
			prepareWritableCategory(res, categoryId, function (category) {
				var r = {
					title: 'New',
					category: {
						id: category.id,
						name: category.name
					}
				};
				res.render('thread-new', r);
			});
		});
	});


};