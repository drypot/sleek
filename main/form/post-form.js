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

exports.make = function (req) {
	var body = req.body;
	return {
		now: new Date(),
		threadId: _l.intp(body, 'threadId', 0),
		postId: _l.intp(body, 'postId', 0),
		categoryId: _l.intp(body, 'categoryId', 0),
		userName : _l.strp(body, 'userName', ''),
		title: _l.strp(body, 'title', ''),
		text: _l.strp(body, 'text', ''),
		visible: _l.boolp(body, 'visible', true),
		delFile: body.delFile,
		file: req.files && req.files.file
	};
}

// validate

exports.validateHead = function (form, errors) {
	validateThread(form, errors);
	validatePost(form, errors);
}

exports.validateReply = function (form, errors) {
	validatePost(form, errors);
}

var validateThread = function (form, errors) {
	if (!form.title) errors.push({title: ERR_FILL_TITLE});
	if (form.title.length > 128) errors.push({title: ERR_SHORTEN_TITLE});
}

var validatePost = function (form, errors) {
	if (!form.userName ) errors.push({userName : ERR_FILL_USERNAME});
	if (form.userName .length > 32) errors.push({userName : ERR_SHORTEN_USERNAME});
}

// find

exports.findThread = function (form, next) {
	_thread.findById(form.threadId, next);
}

exports.findThreadAndPost = function (form, next) {
	_thread.findById(form.threadId, function (err, thread) {
		if (err) return next(err);
		_post.findById(form.postId, function (err, post) {
			next(err, thread, post);
		});
	});
}

// create

exports.createHead = function (form, next) {
	insertThread(form, function (err, thread) {
		insertPost(form, thread, function (err, post) {
			next(err, thread, post);
		});
	});
}

exports.createReply = function (form, thread, next) {
	insertPost(form, thread, function (err, post) {
		if (err) return next(err);
		_thread.updateLength(thread, form.now);
		next(err, post);
	});
}

var insertThread = function (form, next) {
	var thread = {
		categoryId: form.categoryId,
		hit: 0, length: 1, cdate: form.now, udate: form.now,
		userName : form.userName , title: form.title
	};
	_thread.setNewId(thread);
	_thread.insert(thread);
	next(null, thread);
}

var insertPost = function (form, thread, next) {
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

exports.updateHead = function (form, thread, post, categoryEditable, next) {
	updateThread(form, thread, function (err) {
		if (err) return next(err);
		updatePost(form, post, categoryEditable, next);
	});
}

exports.updateReply = function (form, post, categoryEditable, next) {
	updatePost(form, post, categoryEditable, next);
}

var updateThread = function (form, thread, next) {
	thread.categoryId = form.categoryId;
	thread.title = form.title;
	thread.userName  = form.userName ;
	_thread.update(thread);
	next();
}

var updatePost = function (form, post, categoryEditable, next) {
	post.userName  = form.userName ;
	post.text = form.text;
	if (categoryEditable) {
		post.visible = form.visible;
	}
	_post.update(post, form.file, form.delFile, next);
}
