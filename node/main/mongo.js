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
			console.log('mongo initialized: ' + db.databaseName);
			next();
		},
	], next);

});

l.init.init(function (next) {
	var threadCol = l.mongo.threadCol = l.mongo.db.collection("postThread");
	var threadIdSeed;

	async.series([
		function (next) {
			threadCol.ensureIndex({ categoryId: 1, updated: -1 }, next);
		},
		function (next) {
			threadCol.ensureIndex({ updated: -1 }, next);
		},
		function (next) {
			threadCol.find({}, { _id: 1 }).sort({ _id: -1 }).limit(1).nextObject(function (err, obj) {
				threadIdSeed = obj ? obj._id : 0;
				console.log('thread id seed: ' + threadIdSeed);
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
		threadCol.update({ _id: thread._id }, { $inc: { length: 1 }, $set: { updated: now }}, next);
	};

	l.mongo.findThreadById = function (id, next) {
		return threadCol.findOne({ _id: id }, next);
	};

	l.mongo.findThreadByCategory = function (categoryId, lastUdate, limit, next) {
		// 스레드의 lastUdate 가 동일한 경우 페이지 경계 부분에서 데이터 누락이 발생할 수 있다.
		// 개선하려면 updated 를 유니크하게 생성해야.
		if (!categoryId) {
			if (!lastUdate) {
				threadCol.find().sort({ updated: -1 }).limit(limit).toArray(next);
			} else {
				threadCol.find({ updated: { $lt: lastUdate }}).sort({ updated: -1 }).limit(limit).toArray(next);
			}
		} else {
			if (!lastUdate) {
				threadCol.find({ categoryId: categoryId }).sort({ updated: -1 }).limit(limit).toArray(next);
			} else {
				threadCol.find({ categoryId: categoryId, updated: { $lt: lastUdate }}).sort({ updated: -1 }).limit(limit).toArray(next);
			}
		}
	};

});

l.init.init(function (next) {
	var postCol = l.mongo.postCol = l.mongo.db.collection("post");
	var postIdSeed;

	async.series([
		function (next) {
			postCol.ensureIndex({ threadId: 1, created: 1 }, next);
		},
		function (next) {
			postCol.find({}, { _id: 1 }).sort({ _id: -1 }).limit(1).nextObject(function (err, obj) {
				if (err) return next(err);
				postIdSeed = obj ? obj._id : 0;
				console.log('post id seed: ' + postIdSeed);
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
		postCol.find({ threadId: threadId }).sort({ created: 1 }).toArray(next);
	};

});
