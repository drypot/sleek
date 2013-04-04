var _ = require('underscore');
var async = require('async');
var mongo = require("mongodb")

var l = require('./l.js');
var config = require('./config.js');

exports.init = function (opt, next) {

	if (typeof opt === 'function') {
		next = opt;
		opt = {};
	}

	var server = exports.server = new mongo.Server("127.0.0.1", 27017, { auto_reconnect: true });
	var db = exports.db = new mongo.Db(config.mongoDbName, server, { safe: false });

	async.series([
		function (next) {
			db.open(next);
		},
		function (next) {
			if (opt.dropDatabase) {
				db.dropDatabase(next);
			} else {
				next();
			}
		},
		function (next) {
			console.log('mongo: ' + db.databaseName);
			next();
		},
		function (next) {
			var threadCol = exports.threadCol = db.collection("postThread");
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
						if (err) return next(err);
						threadIdSeed = obj ? obj._id : 0;
						console.log('thread id seed: ' + threadIdSeed);
						next(err);
					});
				}
			], next);

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
				threadCol.update({ _id: thread._id }, { $inc: { length: 1 }, $set: { updated: now }}, next);
			};

			exports.findThreadById = function (id, next) {
				return threadCol.findOne({ _id: id }, next);
			};

			exports.findThreadByCategory = function (categoryId, page, pageSize, next) {
				var findOp = {};
				var dir = page > 0 ? 1 : -1;
				var skip = (Math.abs(page) - 1) * pageSize;

				if (categoryId) {
					findOp.categoryId = categoryId;
				}
				threadCol.find(findOp).sort({ updated: -1 * dir }).skip(skip).limit(pageSize).toArray(next);
			};
		},
		function (next) {
			var postCol = exports.postCol = exports.db.collection("post");
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
				postCol.find({ threadId: threadId }).sort({ created: 1 }).toArray(next);
			};
		}
	], next);

};
