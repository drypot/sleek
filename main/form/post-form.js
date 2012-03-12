var _ = require('underscore');
var _should = require('should');
var _async = require('async');
var _util = require('util');

var _l = require('../l');
var _thread = require('../model/thread');
var _post = require('../model/post');

var ERR_FILL_TITLE = '제목을 입력해 주십시오.';
var ERR_SHORTEN_TITLE = '제목을 줄여 주십시오.';
var ERR_FILL_USERNAME = '필명을 입력해 주십시오.';
var ERR_SHORTEN_USERNAME = '필명을 줄여 주십시오.';

// PostForm

var PostForm = function (req) {
	var body = req.body;
	this.now = new Date();
	this.threadId = _l.intp(body, 'threadId', 0);
	this.postId = _l.intp(body, 'postId', 0);
	this.categoryId = _l.intp(body, 'categoryId', 0);
	this.userName  = _l.strp(body, 'userName', '');
	this.title = _l.strp(body, 'title', '');
	this.text = _l.strp(body, 'text', '');
	this.visible = _l.boolp(body, 'visible', true);
	this.delFile = body.delFile;
	this.file = req.files && req.files.file;
	this.error = [];
}

exports.make = function (req) {
	return new PostForm(req);
}

var proto = PostForm.prototype;

// validate

proto.validateHead = function () {
	this._validateThread();
	this._validatePost();
}

proto.validateReply = function () {
	this._validatePost();
}

proto._validateThread = function () {
	if (!this.title) this.error.push({title: ERR_FILL_TITLE});
	if (this.title.length > 128) this.error.push({title: ERR_SHORTEN_TITLE});
}

proto._validatePost = function () {
	if (!this.userName) this.error.push({userName : ERR_FILL_USERNAME});
	if (this.userName .length > 32) this.error.push({userName : ERR_SHORTEN_USERNAME});
}

// find

proto.findThread = function (next) {
	var form = this;
	_thread.findById(form.threadId, next);
}

proto.findThreadAndPost = function (next) {
	var form = this;
	_thread.findById(form.threadId, function (err, thread) {
		if (err) return next(err);
		_post.findById(form.postId, function (err, post) {
			next(err, thread, post);
		});
	});
}

// create

proto.createHead = function (next) {
	var form = this;
	form._insertThread(function (err, thread) {
		form._insertPost(thread, function (err, post) {
			next(err, thread, post);
		});
	});
}

proto.createReply = function (thread, next) {
	var form = this;
	form._insertPost(thread, function (err, post) {
		if (err) return next(err);
		_thread.updateLength(thread, form.now);
		next(err, post);
	});
}

proto._insertThread = function (next) {
	var form = this;
	var thread = {
		categoryId: form.categoryId,
		hit: 0, length: 1, cdate: form.now, udate: form.now,
		userName : form.userName , title: form.title
	};
	_thread.setNewId(thread);
	_thread.insert(thread);
	next(null, thread);
}

proto._insertPost = function (thread, next) {
	var form = this;
	var post = {
		threadId: thread._id,
		cdate: form.now, visible: true,
		userName : form.userName , text: form.text
	};
	_post.setNewId(post);
	_post.insert(post, form.file, function (err) {
		next(err, post);
	});
}

// update

proto.updateHead = function (thread, post, categoryEditable, next) {
	var form = this;
	form._updateThread(thread, function (err) {
		if (err) return next(err);
		form._updatePost(post, categoryEditable, next);
	});
}

proto.updateReply = function (post, categoryEditable, next) {
	var form = this;
	form._updatePost(post, categoryEditable, next);
}

proto._updateThread = function (thread, next) {
	var form = this;
	thread.categoryId = form.categoryId;
	thread.title = form.title;
	thread.userName  = form.userName ;
	_thread.update(thread);
	next();
}

proto._updatePost = function (post, categoryEditable, next) {
	var form = this;
	post.userName  = form.userName ;
	post.text = form.text;
	if (categoryEditable) {
		post.visible = form.visible;
	}
	_post.update(post, form.file, form.delFile, next);
}

