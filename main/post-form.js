var _ = require('underscore');
var should = require('should');
var async = require('async');

var l = require('./l.js');
var Thread = require('./post-model-thread.js');
var Post = require('./post-model-post.js');
var msg = require('./msg.js');

var PostForm = module.exports = function (req) {
	var b = req.body;
	this.now = new Date();
	this.threadId = l.p.int(b, 'threadId', 0);
	this.postId = l.p.int(b, 'postId', 0);
	this.categoryId = l.p.int(b, 'categoryId', 0);
	this.userName  = l.p.string(b, 'userName', '');
	this.title = l.p.string(b, 'title', '');
	this.text = l.p.string(b, 'text', '');
	this.visible = l.p.bool(b, 'visible', true);
	this.delFile = b.delFile;
	this.file = req.files && req.files.file;
	this.error = [];
}

var proto = PostForm.prototype;

// validate

proto.validateThreadAndPost = function () {
	this._validateThread();
	this._validatePost();
	return this.error;
}

proto.validatePost = function () {
	this._validatePost();
	return this.error;
}

proto._validateThread = function () {
	if (!this.title) this.error.push({title: msg.ERR_FILL_TITLE});
	if (this.title.length > 128) this.error.push({title: msg.ERR_SHORTEN_TITLE});
}

proto._validatePost = function () {
	if (!this.userName) this.error.push({userName : msg.ERR_FILL_USERNAME});
	if (this.userName .length > 32) this.error.push({userName : msg.ERR_SHORTEN_USERNAME});
}

// find

proto.findThread = function (next) {
	var form = this;
	Thread.findById(form.threadId, next);
}

proto.findThreadAndPost = function (next) {
	var form = this;
	Thread.findById(form.threadId, function (err, thread) {
		if (err) return next(err);
		Post.findById(form.postId, function (err, post) {
			next(err, thread, post);
		});
	});
}

// create

proto.insertThread = function (next) {
	var form = this;
	var thread = {
		categoryId: form.categoryId,
		hit: 0, length: 1, cdate: form.now, udate: form.now,
		userName : form.userName , title: form.title
	};
	Thread.setNewId(thread);
	Thread.insert(thread);
	next(null, thread);
}

proto.insertPost = function (thread, next) {
	var form = this;
	var post = {
		threadId: thread._id,
		cdate: form.now, visible: true,
		userName : form.userName , text: form.text
	};
	Post.setNewId(post);
	Post.insert(post, form.file, function (err) {
		next(err, post);
	});
}

proto.updateThreadLength = function (thread) {
	Thread.updateLength(thread, this.now)
}

// update

proto.updateThread = function (thread, next) {
	var form = this;
	thread.categoryId = form.categoryId;
	thread.title = form.title;
	thread.userName  = form.userName ;
	Thread.update(thread);
	next();
}

proto.updatePost = function (post, next) {
	var form = this;
	post.userName  = form.userName ;
	post.text = form.text;
	if (form.visible) {
		post.visible = form.visible;
	}
	Post.update(post, form.file, form.delFile, next);
}

