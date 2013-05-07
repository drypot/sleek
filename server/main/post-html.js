var init = require('../main/init');
var post = require('../main/post');
var express = require('../main/express');
var UrlMaker = require('../main/UrlMaker');

init.add(function () {

	var app = express.app;

	console.log('post-html:');

	app.get('/threads', function (req, res, next) {
		req.findUser(function (err, user) {
			if (err) return res.renderErr(err);
			var params = post.makeThreadsParams(req);
			post.findThreads(user, params, function (err, category, threads, last) {
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
		var prevUrl, nextUrl;
		var url;
		if (params.pg > 1) {
			url = new UrlMaker('/threads')
			url.add('c', params.cid, 0);
			url.add('pg', params.pg - 1, 1);
			prevUrl = url.toString();
		}
		if (!last) {
			url = new UrlMaker('/threads');
			url.add('c', params.cid, 0);
			url.add('pg', params.pg + 1, 1);
			nextUrl = url.toString();
		}
		next(prevUrl, nextUrl);
	}

	app.get('/threads/:tid([0-9]+)', function (req, res, next) {
		req.findUser(function (err, user) {
			if (err) return res.renderErr(err);
			var tid = parseInt(req.params.tid) || 0;
			post.findThreadAndPosts(user, tid, req.session.posts, function (err, category, thread, posts) {
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
		req.findUser(function (err, user) {
			if (err) return res.renderErr(err);
			res.render('threads-new');
		});
	});

	app.post('/threads', function (req, res) {
		req.findUser(function (err, user) {
			if (err) return res.renderErr(err);
			var form = post.makeForm(req);
			post.createThread(user, form, function (err, tid, pid) {
				if (err) return res.renderErr(err);
				req.session.posts.push(pid);
				res.redirect('/threads');
			});
		});
	});

	app.post('/threads/:tid([0-9]+)', function (req, res) {
		req.findUser(function (err, user) {
			if (err) return res.renderErr(err);
			var form = post.makeForm(req);
			var tid = form.tid = parseInt(req.params.tid) || 0;
			post.createReply(user, form, function (err, pid) {
				if (err) return res.renderErr(err);
				req.session.posts.push(pid);
				res.redirect('/threads/' + tid);
			});
		});
	});
});