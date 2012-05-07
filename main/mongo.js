var _ = require('underscore');
var mongolian = require("mongolian")

var l = require('./l.js');
var config = require('./config.js');

var Long = exports.Long = mongolian.Long;
var ObjectId = exports.ObjectId = mongolian.ObjectId;
var Timestamp = exports.Timestamp = mongolian.Timestamp;
var DBRef = exports.DBRef = mongolian.DBRef;

var server;
var db;

l.addInit(function (next) {
	server = exports.server = new mongolian;
	db = exports.db = server.db(config.mongoDbName);
	if (config.mongoDropDatabase) {
		db.dropDatabase();
	}
	console.info('mongo initialized: ' + db.name);
	next();
});

// postThread

// int _id;
// int categoryId;
// int hit;
// int length;
// DateTime cdate;
// DateTime udate;
// String userName ;
// String title;

var threadCol;
var threadIdSeed;

l.addInit(function (next) {
	threadCol = exports.threadCol = db.collection("postThread");
	threadCol.ensureIndex({ categoryId: 1, udate: -1 });
	threadCol.ensureIndex({ udate: -1 });
	threadCol.find({}, { _id: 1 }).sort({ _id: -1 }).limit(1).next(function (err, obj) {
		threadIdSeed = obj ? obj._id : 0;
		console.info('thread id seed: ' + threadIdSeed);
		next(err);
	});
});

exports.getNewThreadId = function () {
	return ++threadIdSeed;
};

exports.insertThread = function (thread, next) {
	threadCol.insert(thread, next);
};

exports.updateThread = function (thread, next) {
	threadCol.save(thread, next);
};

exports.updateThreadHit = function (thread, next) {
	threadCol.update({ _id: thread._id }, { $inc: { hit: 1 }}, next);
};

exports.updateThreadLength = function (thread, now, next) {
	threadCol.update({ _id: thread._id }, { $inc: { length: 1 }, $set: { udate: now }}, next);
};

exports.findThreadById = function (id, next) {
	return threadCol.findOne({ _id: id }, next);
};

exports.findThreadByCategory = function (categoryId, lastUdate, limit, next) {
	if (!categoryId) {
		if (!lastUdate) {
			threadCol.find().sort({ udate: -1 }).limit(limit).toArray(next);
		} else {
			threadCol.find({ udate: { $lte: lastUdate }}).sort({ udate: -1 }).limit(limit).toArray(next);
		}
	} else {
		if (!lastUdate) {
			threadCol.find({ categoryId: categoryId }).sort({ udate: -1 }).limit(limit).toArray(next);
		} else {
			threadCol.find({ categoryId: categoryId, udate: { $lte: lastUdate }}).sort({ udate: -1 }).limit(limit).toArray(next);
		}
	}
};

// post

// int _id;
// int threadId;
// DateTime cdate;
// boolean visible;
// String userName ;
// String text;
// List<String> file;

var postCol;
var postIdSeed;

l.addInit(function (next) {
	postCol = exports.postCol = db.collection("post");
	postCol.ensureIndex({ threadId: 1, cdate: 1 });
	postCol.find({}, { _id: 1 }).sort({ _id: -1 }).limit(1).next(function (err, obj) {
		if (err) return next(err);
		postIdSeed = obj ? obj._id : 0;
		console.info('post id seed: ' + postIdSeed);
		next();
	});
});

exports.getNewPostId = function () {
	return ++postIdSeed;
};

exports.insertPost = function (post, next) {
	postCol.insert(post);
	next();
};

exports.updatePost = function (post, next) {
	postCol.save(post, next);
};

exports.findPostById = function (id, next) {
	return postCol.findOne({ _id: id }, next);
};

exports.findPostByThread = function (threadId, next) {
	postCol.find({ threadId: threadId }).sort({ cdate: 1 }).toArray(next);
};
