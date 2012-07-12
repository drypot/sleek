var _ = require('underscore');
var async = require('async');
var mongo = require("mongodb")
var l = require('./l.js');

require('./config.js');

l.mongo = {};

l.init.init(function (next) {

	var server = l.mongo.server = new mongo.Server("127.0.0.1", 27017, { auto_reconnect: true });
	var db = l.mongo.db = new mongo.Db(l.config.mongoDbName, server);

	async.series([
		function (next) {
			db.open(function (err, db) {
				next(err);
			});
		},
		function (next) {
			if (l.config.mongoDropDatabase) {
				db.dropDatabase(function (err) {
					next();
				});
			} else {
				next();
			}
		},
		function (next) {
			l.log('mongo initialized: ' + db.databaseName);
			next();
		},
	], next);

});

l.init.init(function (next) {
	var threadCol = l.mongo.threadCol = l.mongo.db.collection("postThread");
	var threadIdSeed;

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
				l.log('thread id seed: ' + threadIdSeed);
				next(err);
			});
		}
	], next);

	l.mongo.getNewThreadId = function () {
		return ++threadIdSeed;
	};

	l.mongo.insertThread = function (thread, next) {
		threadCol.insert(thread, next);
	};

	l.mongo.updateThread = function (thread, next) {
		threadCol.save(thread, next);
	};

	l.mongo.updateThreadHit = function (thread, next) {
		threadCol.update({ _id: thread._id }, { $inc: { hit: 1 }}, next);
	};

	l.mongo.updateThreadLength = function (thread, now, next) {
		threadCol.update({ _id: thread._id }, { $inc: { length: 1 }, $set: { udate: now }}, next);
	};

	l.mongo.findThreadById = function (id, next) {
		return threadCol.findOne({ _id: id }, next);
	};

	l.mongo.findThreadByCategory = function (categoryId, lastUdate, limit, next) {
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

});

l.init.init(function (next) {
	var postCol = l.mongo.postCol = l.mongo.db.collection("post");
	var postIdSeed;

	async.series([
		function (next) {
			postCol.ensureIndex({ threadId: 1, cdate: 1 }, next);
		},
		function (next) {
			postCol.find({}, { _id: 1 }).sort({ _id: -1 }).limit(1).nextObject(function (err, obj) {
				if (err) return next(err);
				postIdSeed = obj ? obj._id : 0;
				l.log('post id seed: ' + postIdSeed);
				next();
			});
		}
	], next);

	l.mongo.getNewPostId = function () {
		return ++postIdSeed;
	};

	l.mongo.insertPost = function (post, next) {
		postCol.insert(post, next);
	};

	l.mongo.updatePost = function (post, next) {
		postCol.save(post, next);
	};

	l.mongo.findPostById = function (id, next) {
		return postCol.findOne({ _id: id }, next);
	};

	l.mongo.findPostByThread = function (threadId, next) {
		postCol.find({ threadId: threadId }).sort({ cdate: 1 }).toArray(next);
	};

});
