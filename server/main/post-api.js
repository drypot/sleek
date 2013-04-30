var init = require('../main/init');
var post = require('../main/post');
var express = require('../main/express');

init.add(function () {

	var app = express.app;

	console.log('post-api:');

	app.get('/api/threads', function (req, res) {
		req.role(function (err, role) {
			if (err) return res.jsonErr(err);
			var params = post.threadsParams(req);
			post.threads(role, params, function (err, category, threads, last) {
				if (err) return res.jsonErr(err);
				res.json({
					threads: threads,
					last: last
				});
			});
		});
	});

	app.get('/api/threads/:threadId([0-9]+)', function (req, res) {
		req.role(function (err, role) {
			if (err) return res.jsonErr(err);
			var threadId = parseInt(req.params.threadId) || 0;
			post.threadAndPosts(role, threadId, req.session.posts, function (err, category, thread, posts) {
				if (err) return res.jsonErr(err);
				res.json({
					thread: {
						id: thread._id,
						title: thread.title
					},
					category: {
						id: category.id
					},
					posts: posts
				});
			});
		});
	});

	app.get('/api/threads/:threadId([0-9]+)/:postId([0-9]+)', function (req, res, next) {
		req.role(function (err, role) {
			if (err) return res.jsonErr(err);
			var threadId = parseInt(req.params.threadId) || 0;
			var postId = parseInt(req.params.postId) || 0;
			post.threadAndPost(role, threadId, postId, req.session.posts, function (err, thread, post) {
				if (err) return res.jsonErr(err);
				res.json({
					thread: {
						id: thread._id,
						title: thread.title
					},
					category: {
						id: thread.categoryId
					},
					post: post
				});
			});
		});
	});

	app.post('/api/threads', function (req, res) {
		req.role(function (err, role) {
			if (err) return res.jsonErr(err);
			var form = post.form(req);
			post.createThread(role, form, function (err, threadId, postId) {
				if (err) return res.jsonErr(err);
				req.session.posts.push(postId);
				res.json({
					threadId: threadId,
					postId: postId
				});
			});
		});
	});

	app.post('/api/threads/:threadId([0-9]+)', function (req, res) {
		req.role(function (err, role) {
			if (err) return res.jsonErr(err);
			var form = post.form(req);
			var threadId = form.threadId = parseInt(req.params.threadId) || 0;
			post.createReply(role, form, function (err, postId) {
				if (err) return res.jsonErr(err);
				req.session.posts.push(postId);
				res.json({
					threadId: threadId,
					postId: postId
				});
			});
		});
	});

	app.put('/api/threads/:threadId([0-9]+)/:postId([0-9]+)', function (req, res, next) {
		req.role(function (err, role) {
			if (err) return res.jsonErr(err);
			var form = post.form(req);
			form.threadId = parseInt(req.params.threadId) || 0;
			form.postId = parseInt(req.params.postId) || 0;
			post.update(role, form, req.session.posts, function (err) {
				if (err) return res.jsonErr(err);
				res.json({});
			});
		});
	});

});
