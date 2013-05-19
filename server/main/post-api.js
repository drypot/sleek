var init = require('../main/init');
var post = require('../main/post');
var express = require('../main/express');

init.add(function () {

	var app = express.app;

	console.log('post-api:');

	app.get('/api/threads', function (req, res) {
		req.findUser(function (err, user) {
			if (err) return res.jsonErr(err);
			var params = post.makeThreadsParams(req);
			if (params.cid) {
				post.findThreadsByCategory(user, params, function (err, category, threads, last) {
					if (err) return res.jsonErr(err);
					res.json({
						threads: threads,
						last: last
					});
				});
			} else {
				post.findThreads(user, params, function (err, threads, last) {
					if (err) return res.jsonErr(err);
					res.json({
						threads: threads,
						last: last
					});
				});
			}
		});
	});

	app.get('/api/threads/:tid([0-9]+)', function (req, res) {
		req.findUser(function (err, user) {
			if (err) return res.jsonErr(err);
			var tid = parseInt(req.params.tid) || 0;
			post.findThreadAndPosts(user, tid, req.session.posts, function (err, category, thread, posts) {
				if (err) return res.jsonErr(err);
				res.json({
					thread: {
						_id: thread._id,
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

	app.get('/api/threads/:tid([0-9]+)/:pid([0-9]+)', function (req, res, next) {
		req.findUser(function (err, user) {
			if (err) return res.jsonErr(err);
			var tid = parseInt(req.params.tid) || 0;
			var pid = parseInt(req.params.pid) || 0;
			post.findThreadAndPost(user, tid, pid, req.session.posts, function (err, category, thread, post) {
				if (err) return res.jsonErr(err);
				res.json({
					thread: {
						_id: thread._id,
						title: thread.title
					},
					category: {
						id: category.id
					},
					post: post
				});
			});
		});
	});

	app.post('/api/threads', function (req, res) {
		req.findUser(function (err, user) {
			if (err) return res.jsonErr(err);
			var form = post.makeForm(req);
			post.createThread(user, form, function (err, tid, pid) {
				if (err) return res.jsonErr(err);
				req.session.posts.push(pid);
				res.json({
					tid: tid,
					pid: pid
				});
			});
		});
	});

	app.post('/api/threads/:tid([0-9]+)', function (req, res) {
		req.findUser(function (err, user) {
			if (err) return res.jsonErr(err);
			var form = post.makeForm(req);
			var tid = form.tid = parseInt(req.params.tid) || 0;
			post.createReply(user, form, function (err, pid) {
				if (err) return res.jsonErr(err);
				req.session.posts.push(pid);
				res.json({
					tid: tid,
					pid: pid
				});
			});
		});
	});

	app.put('/api/threads/:tid([0-9]+)/:pid([0-9]+)', function (req, res, next) {
		updatePost(req, res, next);
	});

	app.post('/api/threads/:tid([0-9]+)/:pid([0-9]+)', function (req, res, next) {
		updatePost(req, res, next);
	});

	function updatePost(req, res, next) {
		req.findUser(function (err, user) {
			if (err) return res.jsonErr(err);
			var form = post.makeForm(req);
			form.tid = parseInt(req.params.tid) || 0;
			form.pid = parseInt(req.params.pid) || 0;
			post.updatePost(user, form, req.session.posts, function (err) {
				if (err) return res.jsonErr(err);
				res.json({});
			});
		});
	}

});
