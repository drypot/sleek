var _ = require('underscore');
var _should = require('should');
var _async = require('async');
var _fs = require('fs');

var _lang = require('../lang');
var _config = require("../config");
var _db = require('../db');
var _upload = require('../upload');

var col;
var idSeed;

_lang.addInit(function (next) {
	col = exports.col = _db.db.collection("post");
	col.ensureIndex({threadId: 1, cdate: 1});
	col.find({}, {_id: 1}).sort({_id: -1}).limit(1).next(function (err, obj) {
		if (err) return next(err);
		idSeed = obj ? obj._id : 0;
		console.info('post id seed: ' + idSeed);
		next();
	});
});

// post

//	int _id;
//	int threadId;
//	DateTime cdate;
//	boolean visible;
//	String username ;
//	String text;
//	List<String> fileNameList; file;

// _post.*

exports.setNewId = function (post) {
	post._id = ++idSeed;
}

exports.insert = function (post, file, next) {
	_upload.savePostFile(post, file, function (err, saved) {
		if (err) return next(err);
		if (saved) post.file = saved;
		col.insert(post);
		//searchService.newPost(thread, post);
		next();
	});
}

exports.update = function (post, file, delFile, next) {
	_upload.deletePostFile(post, delFile, function (err, deleted) {
		if (err) return next(err);
		if (deleted) {
			post.file = _.without(post.file, deleted);
			if (post.file.length == 0) delete post.file;
		}
		_upload.savePostFile(post, file, function (err, saved) {
			if (err) return next(err);
			if (saved) post.file = _.union(post.file || [], saved);
			col.save(post);
			//searchService.newPost(thread, post);
			next();
		});
	})
}

exports.findById = function (id, next) {
	return col.findOne({_id: id}, next);
}

exports.findByThreadId = function (threadId, next) {
	col.find({threadId: threadId}).sort({cdate: 1}).toArray(next);
}
