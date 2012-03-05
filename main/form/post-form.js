var _ = require('underscore');
var _should = require('should');
var _async = require('async');

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

form.validateCreateReply = function (errors) {
	this._validatePost(errors);
}

form.validateUpdate = function (isFirst, errors) {
	if (isFirst) {
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
		if (err) throw err;
		_post.findById(that.postId, function (err, post) {
			next(err, thread, post);
		});
	});
}

// create

form.createThread = function (postList) {
	var thread = this._insertThread();
	this._insertPost(thread._id, postList);
	return thread._id;
}

form.createReply = function (postList) {
	var post = this._insertPost(this.threadId, postList);
	_thread.updateLength(this.threadId, this.now);
	return post._id;
}

form._insertThread = function () {
	var thread = _thread.make({
		categoryId: this.categoryId,
		hit: 0, length: 1, cdate: this.now, udate: this.now,
		userName: this.userName, title: this.title
	});
	thread.setNewId();
	thread.insert();
	return thread;
}

form._insertPost = function (threadId, postList) {
	var post = _post.make({
		threadId: threadId,
		cdate: this.now, visible: true,
		userName: this.userName, text: this.text
	});
	post.setNewId();
//	fileService.savePostFile(post, req.getFiles("file"));
	post.insert();
	postList.push(post._id);
//	searchService.newPost(thread, post);
	return post;
}

// update

form.update = function (thread, post, shouldUpdateThread, categoryEditable) {
	if (shouldUpdateThread) {
		this._updateThread(thread);
	}
	this._updatePost(post, categoryEditable)
}

form._updateThread = function (thread) {
	thread.categoryId = this.categoryId;
	thread.title = this.title;
	thread.userName = this.userName;
	thread.update();
}

form._updatePost = function (post, caategoryEditable) {
	var that = this;
	_async.series({
//		delFiles: function (next) {
//			next()
//		},
//		saveFiles: functino (next) {
//
//		},
		updatePost: function (next) {
			post.userName = that.userName;
			post.text = that.text;
			if (caategoryEditable) {
				post.visible = that.visible;
			}
			post.update();
			next();
		}
//		searchService.updatePost(thread, post);
	});
}
