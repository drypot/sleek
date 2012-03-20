var _ = require('underscore');
var should = require('should');
var async = require('async');

var l = require('./l.js');
var config = require('./config.js');
var mongo = require('./mongo.js');
var upload = require('./upload.js');

l.init.add(function (next) {
	Post.col = mongo.db.collection("post");
	Post.col.ensureIndex({threadId: 1, cdate: 1});
	Post.col.find({}, {_id: 1}).sort({_id: -1}).limit(1).next(function (err, obj) {
		if (err) return next(err);
		Post.idSeed = obj ? obj._id : 0;
		console.info('post id seed: ' + Post.idSeed);
		next();
	});
});

l.init.add(function (next) {
	l.fs.mkdirs([config.uploadDir, 'Post'], next);
});

var Post = module.exports = function () {
//	int _id;
//	int threadId;
//	DateTime cdate;
//	boolean visible;
//	String userName ;
//	String text;
//	List<String> file;
};

Post.getNewId = function () {
	return ++Post.idSeed;
};

Post.insert = function (post, file, next) {
	saveUploadFile(post, file, function (err, saved) {
		if (err) return next(err);
		if (saved) post.file = saved;
		Post.col.insert(post);
		//searchService.newPost(thread, post);
		next();
	});
};

Post.update = function (post, file, delFile, next) {
	deleteUploadFile(post, delFile, function (err, deleted) {
		if (err) return next(err);
		if (deleted) {
			post.file = _.without(post.file, deleted);
			if (post.file.length == 0) delete post.file;
		}
		saveUploadFile(post, file, function (err, saved) {
			if (err) return next(err);
			if (saved) post.file = _.union(post.file || [], saved);
			Post.col.save(post);
			//searchService.newPost(thread, post);
			next();
		});
	})
};

// find

Post.findById = function (id, next) {
	return Post.col.findOne({_id: id}, next);
};

Post.findByThreadId = function (threadId, next) {
	Post.col.find({threadId: threadId}).sort({cdate: 1}).toArray(next);
};

// upload

Post.getUploadDir = function (post) {
	return config.uploadDir + '/post/' + Math.floor(post._id / 10000) + '/' + post._id
};

var saveUploadFile = function (post, file, next /* (err, saved) */) {
	if (!file) return next();
	upload.saveFile([config.uploadDir, 'Post', Math.floor(post._id / 10000), post._id], file, next);
};

var deleteUploadFile = function (post, delFile, next /* (err, deleted) */) {
	if (!delFile) return next();
	upload.deleteFile(Post.getUploadDir(post), delFile, next);
};

