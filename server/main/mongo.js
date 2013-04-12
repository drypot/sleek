var async = require('async');
var mongo = require("mongodb");

module.exports = function (opt, next) {

	var exports = {};

	var config = opt.config;
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
			var threads;
			var threadIdSeed;

			exports.rebuildThreads = function (next) {
				threads = exports.threads = db.collection("postThread");
				async.series([
					function (next) {
						threads.ensureIndex({ categoryId: 1, updated: -1 }, next);
					},
					function (next) {
						threads.ensureIndex({ updated: -1 }, next);
					},
					function (next) {
						threads.find({}, { _id: 1 }).sort({ _id: -1 }).limit(1).nextObject(function (err, obj) {
							if (err) return next(err);
							threadIdSeed = obj ? obj._id : 0;
							next(err);
						});
					}
				], next);
			}

			exports.rebuildThreads(function (err) {
				console.log('thread id seed: ' + threadIdSeed);
				next(err);
			});

			exports.getNewThreadId = function () {
				return ++threadIdSeed;
			};

			exports.insertThread = function (thread, next) {
				threads.insert(thread, next);
			};

			exports.updateThread = function (thread, next) {
				threads.save(thread, next);
			};

			exports.updateThreadHit = function (thread, next) {
				threads.update({ _id: thread._id }, { $inc: { hit: 1 }}, next);
			};

			exports.updateThreadLength = function (thread, now, next) {
				threads.update({ _id: thread._id }, { $inc: { length: 1 }, $set: { updated: now }}, next);
			};

			exports.findThreadById = function (id, next) {
				return threads.findOne({ _id: id }, next);
			};

			exports.findThreadsByCategory = function (categoryId, page, pageSize, next) {
				var findOp = {};
				var dir = page > 0 ? 1 : -1;
				var skip = (Math.abs(page) - 1) * pageSize;

				if (categoryId) {
					findOp.categoryId = categoryId;
				}
				threads.find(findOp).sort({ updated: -1 * dir }).skip(skip).limit(pageSize).toArray(next);
			};
		},
		function (next) {
			var posts;
			var postIdSeed;

			exports.rebuildPosts = function (next) {
				posts = exports.posts = exports.db.collection("post");
				async.series([
					function (next) {
						posts.ensureIndex({ threadId: 1, created: 1 }, next);
					},
					function (next) {
						posts.find({}, { _id: 1 }).sort({ _id: -1 }).limit(1).nextObject(function (err, obj) {
							if (err) return next(err);
							postIdSeed = obj ? obj._id : 0;
							next();
						});
					}
				], next);
			}

			exports.rebuildPosts(function (err) {
				console.log('post id seed: ' + postIdSeed);
				next(err);
			});

			exports.getNewPostId = function () {
				return ++postIdSeed;
			};

			exports.insertPost = function (post, next) {
				posts.insert(post, next);
			};

			exports.updatePost = function (post, next) {
				posts.save(post, next);
			};

			exports.findPostById = function (id, next) {
				return posts.findOne({ _id: id }, next);
			};

			exports.findPostsByThread = function (threadId, next) {
				posts.find({ threadId: threadId }).sort({ created: 1 }).toArray(next);
			};
		}
	], function (err) {
		if (err) throw err;
		next(exports);
	});

};
