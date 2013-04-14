var MongoClient = require('mongodb').MongoClient;
var	Server = require('mongodb').Server;

var init = require('../main/init');
var config = require('../main/config');

var opt = {};

exports.options = function (_opt) {
	for(var p in _opt) {
		opt[p] = _opt[p];
	}
	return exports;
};

init.add(function (next) {

	var server = new Server('localhost', 27017, { /* auto_reconnect: true */ } );
	var client = new MongoClient(server);
	var db;

	client.open(function (err) {
		if (err) return next(err);
		db = exports.db = client.db(config.data.mongoDbName);
		console.log('mongo: ' + db.databaseName);
		(opt.dropDatabase ? db.dropDatabase.bind(db) : function (fn){ fn(); })(function (err) {
			if (err) return next(err);
			initThread(function (err) {
				if (err) return next(err);
				initPost(next);
			});
		});
	});

});

function initThread(next) {
	var threads;
	var threadIdSeed;

	exports.ensureThreads = function (next) {
		threads = exports.threads = exports.db.collection("postThread");
		threads.ensureIndex({ categoryId: 1, updated: -1 }, function (err) {
			if (err) return next(err);
			threads.ensureIndex({ updated: -1 }, function (err) {
				if (err) return next(err);
				threads.find({}, { _id: 1 }).sort({ _id: -1 }).limit(1).nextObject(function (err, obj) {
					if (err) return next(err);
					threadIdSeed = obj ? obj._id : 0;
					next();
				});
			});
		});
	};

	exports.ensureThreads(function (err) {
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

	exports.updateThreadHit = function (threadId, next) {
		threads.update({ _id: threadId }, { $inc: { hit: 1 }}, next);
	};

	exports.updateThreadLength = function (threadId, now, next) {
		threads.update({ _id: threadId }, { $inc: { length: 1 }, $set: { updated: now }}, next);
	};

	exports.findThread = function (id, next) {
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
}

function initPost(next) {
	var posts;
	var postIdSeed;

	exports.ensurePosts = function (next) {
		posts = exports.posts = exports.db.collection("post");

		posts.ensureIndex({ threadId: 1, created: 1 }, function (err) {
			if (err) return next(err);
			posts.find({}, { _id: 1 }).sort({ _id: -1 }).limit(1).nextObject(function (err, obj) {
				if (err) return next(err);
				postIdSeed = obj ? obj._id : 0;
				next();
			});
		});
	};

	exports.ensurePosts(function (err) {
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
		posts.find({ threadId: threadId }).sort({ created: 1 }).each(next);
	};
}
