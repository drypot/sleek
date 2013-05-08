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
					res.render('thread-list', {
						category: category,
						threads: threads,
						prevUrl: prevUrl,
						nextUrl: nextUrl
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
				res.render('thread-view', {
					category: category,
					thread: thread,
					posts: posts
				});
			});
		});
	});

	app.get('/threads/new', function (req, res, next) {
		req.findUser(function (err, user) {
			if (err) return res.renderErr(err);
			var cid = parseInt(req.query.c) || 0;
			res.render('thread-new', { cid: cid });
		});
	});

	app.get('/threads/:tid([0-9]+)/:pid([0-9]+/edit)', function (req, res, next) {
		req.findUser(function (err, user) {
			if (err) return res.renderErr(err);
			var tid = parseInt(req.params.tid) || 0;
			var pid = parseInt(req.params.pid) || 0;
			post.findThreadAndPost(user, tid, pid, req.session.posts, function (err, category, thread, post) {
				if (err) return res.renderErr(err);
				res.render('thread-edit', {
					thread: thread,
					category: category,
					post: post
				});
			});
		});
	});

});