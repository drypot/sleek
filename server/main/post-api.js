var init = require('../main/init');
var post = require('../main/post');
var express = require('../main/express');
var rcs = require('../main/rcs');

init.add(function () {

	var app = express.app;

	console.log('post-api:');

	app.get('/api/threads', function (req, res) {
		req.authorized(function (err, role) {
			if (err) return res.json(err);
			var params = post.threadsParams(req);
			post.threads(role, params, function (err, threads) {
				if (err) return res.json(err);
				res.json({
					rc: rcs.SUCCESS,
					threads: threads
				});
			});
		});
	});

	app.get('/api/threads/:threadId([0-9]+)', function (req, res) {
		req.authorized(function (err, role) {
			if (err) return res.json(err);
			var threadId = parseInt(req.params.threadId) || 0;
			post.threadWithPosts(role, threadId, function (err, thread, category, posts) {
				if (err) return res.json(err);
				res.json({
					rc: rcs.SUCCESS,
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
		req.authorized(function (err, role) {
			if (err) return res.json(err);
			var threadId = parseInt(req.params.threadId) || 0;
			var postId = parseInt(req.params.postId) || 0;
			post.threadAndPost(role, threadId, postId, req.session.posts, function (err, thread, post) {
				if (err) return res.json(err);
				res.json({
					rc: rcs.SUCCESS,
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
		req.authorized(function (err, role) {
			if (err) return res.json(err);
			var form = post.form(req);
			post.createThread(role, form, function (err, threadId, postId) {
				if (err) return res.json(err);
				req.session.posts.push(postId);
				res.json({
					rc: rcs.SUCCESS,
					threadId: threadId,
					postId: postId
				});
			});
		});
	});

	app.post('/api/threads/:threadId([0-9]+)', function (req, res) {
		req.authorized(function (err, role) {
			if (err) return res.json(err);
			var form = post.form(req);
			var threadId = form.threadId = parseInt(req.params.threadId) || 0;
			post.createReply(role, form, function (err, postId) {
				if (err) return res.json(err);
				req.session.posts.push(postId);
				res.json({
					rc: rcs.SUCCESS,
					threadId: threadId,
					postId: postId
				});
			});
		});
	});

	app.put('/api/threads/:threadId([0-9]+)/:postId([0-9]+)', function (req, res, next) {
		req.authorized(function (err, role) {
			if (err) return res.json(err);
			var form = post.form(req);
			form.threadId = parseInt(req.params.threadId) || 0;
			form.postId = parseInt(req.params.postId) || 0;
			post.update(role, form, req.session.posts, function (err) {
				if (err) return res.json(err);
				res.json({ rc: rcs.SUCCESS });
			});
		});
	});

});
