var _ = require('underscore');
var should = require('should');
var async = require('async');
var fs = require('fs');

var l = require('./l.js');
var config = require('./config.js');
var mongo = require('./mongo.js');
var upload = require('./upload.js');

var col;
var idSeed;

l.addInit(function (next) {
	col = exports.col = mongo.db.collection("post");
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
//	String userName ;
//	String text;
//	List<String> fileNameList; file;

// _post.*

exports.setNewId = function (post) {
	post._id = ++idSeed;
}

exports.insert = function (post, file, next) {
	upload.savePostFile(post, file, function (err, saved) {
		if (err) return next(err);
		if (saved) post.file = saved;
		col.insert(post);
		//searchService.newPost(thread, post);
		next();
	});
}

exports.update = function (post, file, delFile, next) {
	upload.deletePostFile(post, delFile, function (err, deleted) {
		if (err) return next(err);
		if (deleted) {
			post.file = _.without(post.file, deleted);
			if (post.file.length == 0) delete post.file;
		}
		upload.savePostFile(post, file, function (err, saved) {
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
