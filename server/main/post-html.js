var init = require('../main/init');
var post = require('../main/post');
var express = require('../main/express');
var UrlMaker = require('../main/UrlMaker');

init.add(function () {

	var app = express.app;

	console.log('post-html:');

	app.get('/threads', function (req, res, next) {
		req.role(function (err, role) {
			if (err) return res.renderErr(err);
			var params = post.threadsParams(req);
			post.threads(role, params, function (err, category, threads, last) {
				if (err) return res.renderErr(err);

// TODO: 최근글 하일라이트
//				CharSequence titleCss = "thread" +
//					(thread.getUdate().getMillis() > authService.getLastVisit().getMillis() ? " tn" : "") +
//					(thread.getId() == postContext.getParam().getThreadId() ? " tc" : "");

				prevNext(params, last, function (prevUrl, nextUrl) {
					res.render('threads', {
						category: category,
						threads: threads,
						prevUrl: prevUrl,
						nextUrl: nextUrl,
					});
				});
			});
		});
	});

	function prevNext(params, last, next) {
		var page = params.page;
		var prevUrl, nextUrl;
		var u;
		if (page > 1) {
			u = new UrlMaker('/threads')
			u.add('c', params.categoryId, 0);
			u.add('p', page - 1, 1);
			prevUrl = u.toString();
		}
		if (!last) {
			u = new UrlMaker('/threads');
			u.add('c', params.categoryId, 0);
			u.add('p', page + 1, 1);
			nextUrl = u.toString();
		}
		next(prevUrl, nextUrl);
	}

	app.get('/threads/:threadId([0-9]+)', function (req, res, next) {
		req.role(function (err, role) {
			if (err) return res.renderErr(err);
			var threadId = parseInt(req.params.threadId) || 0;
			post.threadAndPosts(role, threadId, req.session.posts, function (err, category, thread, posts) {
				if (err) return res.renderErr(err);
				res.render('threads-num', {
					category: {
						id: category.id,
						name: category.name
					},
					thread: {
						id: thread._id,
						title: thread.title
					},
					posts: posts
				});
			});
		});
	});

	app.get('/threads/new', function (req, res, next) {
		req.role(function (err, role) {
			if (err) return res.renderErr(err);
			res.render('threads-new');
		});
	});

	app.post('/threads', function (req, res) {
		req.role(function (err, role) {
			if (err) return res.renderErr(err);
			var form = post.form(req);
			post.createThread(role, form, function (err, threadId, postId) {
				if (err) return res.renderErr(err);
				req.session.posts.push(postId);
				res.redirect('/threads');
			});
		});
	});

	app.post('/threads/:threadId([0-9]+)', function (req, res) {
		req.role(function (err, role) {
			if (err) return res.renderErr(err);
			var form = post.form(req);
			var threadId = form.threadId = parseInt(req.params.threadId) || 0;
			post.createReply(role, form, function (err, postId) {
				if (err) return res.renderErr(err);
				req.session.posts.push(postId);
				res.redirect('/threads/' + threadId);
			});
		});
	});
});