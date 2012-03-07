var _ = require('underscore');
var _should = require('should');
var _async = require('async');
var _util = require('util');

var _lang = require('../lang');
var _thread = require('../model/thread');
var _post = require('../model/post');

var ERR_FILL_TITLE = '제목을 입력해 주십시오.';
var ERR_SHORTEN_TITLE = '제목을 줄여 주십시오.';
var ERR_FILL_USERNAME = '필명을 입력해 주십시오.';
var ERR_SHORTEN_USERNAME = '필명을 줄여 주십시오.';

exports.make = function (req) {
	return new PostForm(req);
}

var PostForm = function (req) {
	var body = req.body;
	this.now = new Date();
	this.threadId = _lang.intp(body, 'threadId', 0);
	this.postId = _lang.intp(body, 'postId', 0);
	this.categoryId = _lang.intp(body, 'categoryId', 0);
	this.userName = _lang.strp(body, 'userName', '');
	this.title = _lang.strp(body, 'title', '');
	this.text = _lang.strp(body, 'text', '');
	this.visible = _lang.boolp(body, 'visible', true);
	this.delFiles = body.delFiles;
	this.files = req.files;
}

var form = PostForm.prototype;

// validate

form.validateCreateThread = function (errors) {
	this._validateThread(errors);
	this._validatePost(errors);
}

form.validateCreatePost = function (errors) {
	this._validatePost(errors);
}

form.validateUpdate = function (shouldUpdateThread, errors) {
	if (shouldUpdateThread) {
		this._validateThread(errors);
	}
	this._validatePost(errors);
}

form._validateThread = function (errors) {
	if (!this.title) errors.push({title: ERR_FILL_TITLE});
	if (this.title.length > 128) errors.push({title: ERR_SHORTEN_TITLE});
}

form._validatePost = function (errors) {
	if (!this.userName) errors.push({userName: ERR_FILL_USERNAME});
	if (this.userName.length > 32) errors.push({userName: ERR_SHORTEN_USERNAME});
}

// find

form.findThread = function (next) {
	_thread.findById(this.threadId, next);
}

form.findThreadAndPost = function (next) {
	var that = this;
	_thread.findById(this.threadId, function (err, thread) {
		if (err) return next(err);
		_post.findById(that.postId, function (err, post) {
			next(err, thread, post);
		});
	});
}

// create

form.createThread = function (next) {
	var _this = this;
	_this._insertThread(function (err, thread) {
		_this._insertPost(thread, function (err, post) {
			next(err, thread, post);
		});
	});
}

form.createPost = function (thread, next) {
	var _this = this;
	_this._insertPost(thread, function (err, post) {
		if (err) return next(err);
		thread.updateLength(_this.now);
		next(err, post);
	});
}

form._insertThread = function (next) {
	var thread = _thread.make({
		categoryId: this.categoryId,
		hit: 0, length: 1, cdate: this.now, udate: this.now,
		userName: this.userName, title: this.title
	});
	thread.setNewId();
	thread.insert();
	next(null, thread);
}

form._insertPost = function (thread, next) {
	var post = _post.make({
		threadId: thread._id,
		cdate: this.now, visible: true,
		userName: this.userName, text: this.text
	});
	post.setNewId();
	post.insert(this.files && this.files.file, function (err) {
		if (err) return next(err);
		next(err, post);
	});
}

// update

form.update = function (thread, post, shouldUpdateThread, categoryEditable, next) {
	var _this = this;
	if (shouldUpdateThread) {
		_this._updateThread(thread, function (err) {
			if (err) return next(err);
			_this._updatePost(post, categoryEditable, next);
		});
	} else {
		_this._updatePost(post, categoryEditable, next);
	}
}

form._updateThread = function (thread, next) {
	thread.categoryId = this.categoryId;
	thread.title = this.title;
	thread.userName = this.userName;
	thread.update();
	next();
}

form._updatePost = function (post, categoryEditable, next) {
	post.userName = this.userName;
	post.text = this.text;
	if (categoryEditable) {
		post.visible = this.visible;
	}
	post.update(this.files && this.files.file, this.delFiles, next);
}
