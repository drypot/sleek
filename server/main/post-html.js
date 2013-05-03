var init = require('../main/init');
var post = require('../main/post');
var express = require('../main/express');
var UrlMaker = require('../main/UrlMaker');
var dateTime = require('../main/dateTime');

init.add(function () {

	var app = express.app;

	console.log('post-html:');

	app.get('/threads', function (req, res, next) {
		req.roleHtml(function (err, role) {
			var params = post.threadsParams(req);
			post.threads(role, params, function (err, category, threads, last) {
				if (err) return res.renderErr(err);

// TODO: 최근글 하일라이트
//				CharSequence titleCss = "thread" +
//					(thread.getUdate().getMillis() > authService.getLastVisit().getMillis() ? " tn" : "") +
//					(thread.getId() == postContext.getParam().getThreadId() ? " tc" : "");

				prevNext(params, last, function (prevUrl, nextUrl) {
					res.render('threads', {
						dateTime: dateTime,
						category: category,
						categories: role.categories,
						threads: threads,
						prevUrl: prevUrl,
						nextUrl: nextUrl
					});
				});
			});
		});
	});

	function prevNext(params, last, func) {
		var page = params.page;
		var prev = page === 1 ? null : page - 1;
		var next = page + 1;
		var prevUrl, nextUrl;
		var u;
		if (prev) {
			u = new UrlMaker('/threads')
			u.add('c', params.categoryId, 0);
			u.add('p', prev, 1);
			prevUrl = u.toString();
		}
		if (!last) {
			u = new UrlMaker('/threads');
			u.add('c', params.categoryId, 0);
			u.add('p', next, 1);
			nextUrl = u.toString();
		}
		func(prevUrl, nextUrl);
	}

	app.get('/thread/:threadId([0-9]+)', function (req, res, next) {
		req.role(function () {
			var threadId = l.int(req.params, 'threadId', 0);
			prepareThread(res, threadId, function (thread) {
				categoryForRead(res, thread.categoryId, function (category) {
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
					mongo.findPostsByThread(threadId, function (err, post) {
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
									editable: category.editable || _.include(req.session.posts, post.id),
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
		req.role(function () {
			var categoryId = l.int(req.query, 'c', 0);
			if (categoryId == 0) {
				categoryId = res.locals.role.writableCategory[0].id;
			}
			categoriesForNew(res, categoryId, function (category) {
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

});