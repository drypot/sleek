var _ = require('underscore');
var async = require('async');
var mongo = require("mongodb")

var l = require('./l.js');
var config = require('./config.js');

var server;
var db;

l.addInit(function (next) {
	server = new mongo.Server("127.0.0.1", 27017, { auto_reconnect: true });
	db = exports.db = new mongo.Db(config.mongoDbName, server);
	async.series([
		function (next) {
			db.open(function (err, db) {
				if (err) return next(err);
				next();
			});
		},
		function (next) {
			if (config.mongoDropDatabase) {
				return db.dropDatabase(next);
			}
			next();
		},
		function (next) {
			console.info('mongo initialized: ' + db.databaseName);
			next();
		}
	], next);
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
	async.series([
		function (next) {
			threadCol.ensureIndex({ categoryId: 1, udate: -1 }, next);
		},
		function (next) {
			threadCol.ensureIndex({ udate: -1 }, next);
		},
		function (next) {
			threadCol.find({}, { _id: 1 }).sort({ _id: -1 }).limit(1).nextObject(function (err, obj) {
				threadIdSeed = obj ? obj._id : 0;
				console.info('thread id seed: ' + threadIdSeed);
				next(err);
			});
		}
	], next);
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
	async.series([
		function (next) {
			postCol.ensureIndex({ threadId: 1, cdate: 1 }, next);
		},
		function (next) {
			postCol.find({}, { _id: 1 }).sort({ _id: -1 }).limit(1).nextObject(function (err, obj) {
				if (err) return next(err);
				postIdSeed = obj ? obj._id : 0;
				console.info('post id seed: ' + postIdSeed);
				next();
			});
		}
	], next);
});

exports.getNewPostId = function () {
	return ++postIdSeed;
};

exports.insertPost = function (post, next) {
	postCol.insert(post, next);
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
