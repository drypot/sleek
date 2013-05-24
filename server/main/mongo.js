var MongoClient = require('mongodb').MongoClient;
var Server = require('mongodb').Server;

var init = require('../main/init');
var config = require('../main/config');

var opt = {};

exports = module.exports = function (_opt) {
	for(var p in _opt) {
		opt[p] = _opt[p];
	}
	return exports;
};

init.add(function (next) {

	var log = 'mongo:';

	openDb(function (err, db) {
		if (err) return next(err);
		dropDatabase(db, function (err) {
			if (err) return next(err);
			initThread(db, function (err) {
				if (err) return next(err);
				initPost(db, function (err) {
					console.log(log);
					next(err);
				});
			});
		});
	});

	function openDb(next) {
		var server = new Server('localhost', 27017, { auto_reconnect: true } );
		var client = new MongoClient(server);
		client.open(function (err) {
			if (err) return next(err);
			var db = exports.db = client.db(config.data.mongoDb);
			log += ' ' + db.databaseName;
			if (config.data.mongoUser) {
				log += ' auth-database';
				db.authenticate(config.data.mongoUser, config.data.mongoPassword, function(err, res) {
					if (err) return next(err);
					next(null, db);
				});
				return;
			}
			next(null, db);
		});
	}

	function dropDatabase(db, next) {
		if (opt.dropDatabase) {
			log += ' drop-database';
			db.dropDatabase(next);
		} else {
			next();
		}
	}

	function initThread(db, next) {
		var threads;
		var tidSeed;

		exports.getNewThreadId = function () {
			return ++tidSeed;
		};

		exports.insertThread = function (thread, next) {
			threads.insert(thread, next);
		};

		exports.updateThread = function (thread, next) {
			threads.save(thread, next);
		};

		exports.updateThreadHit = function (tid, next) {
			threads.update({ _id: tid }, { $inc: { hit: 1 }}, next);
		};

		exports.updateThreadLength = function (tid, now, next) {
			threads.update({ _id: tid }, { $inc: { length: 1 }, $set: { udate: now }}, next);
		};

		exports.findThread = function (id, next) {
			threads.findOne({ _id: id }, next);
		};

		exports.findThreads = function (pg, pgsize) {
			return threads.find({}).sort({ udate: -1 }).skip((Math.abs(pg) - 1) * pgsize).limit(pgsize);
		};

		exports.findThreadsByCategory = function (cid, pg, pgsize) {
			return threads.find({ cid: cid }).sort({ udate: -1 }).skip((Math.abs(pg) - 1) * pgsize).limit(pgsize);
		};

		threads = exports.threads = db.collection("threads");
		threads.ensureIndex({ cid: 1, udate: -1 }, function (err) {
			if (err) return next(err);
			threads.ensureIndex({ udate: -1 }, function (err) {
				if (err) return next(err);
				threads.find({}, { _id: 1 }).sort({ _id: -1 }).limit(1).nextObject(function (err, obj) {
					if (err) return next(err);
					tidSeed = obj ? obj._id : 0;
					console.log('thread id seed: ' + tidSeed);
					next();
				});
			});
		});
	}

	function initPost(db, next) {
		var posts;
		var pidSeed;

		exports.getNewPostId = function () {
			return ++pidSeed;
		};

		exports.insertPost = function (post, next) {
			posts.insert(post, next);
		};

		exports.updatePost = function (post, next) {
			posts.save(post, next);
		};

		exports.findPost = function (pid, next) {
			var opt = {
				fields: { tokens: 0 }
			};
			posts.findOne({ _id: pid }, opt, next);
		};

		exports.findPostsByThread = function (tid) {
			var opt = {
				fields: { tokens: 0 },
				sort: { cdate: 1 }
			};
			return posts.find({ tid: tid }, opt);
		};

		exports.searchPosts = function (tokens, pg, pgsize, next) {
			var opt = {
				fields: { tokens: 0 },
				skip: (pg - 1) * pgsize,
				sort: { cdate: -1 },
				limit: pgsize
			};
			return posts.find({ tokens: { $all: tokens } }, opt);
		}

		posts = exports.posts = db.collection("posts");
		posts.ensureIndex({ tid: 1, cdate: 1 }, function (err) {
			if (err) return next(err);
			posts.ensureIndex({ tokens: 1 }, function (err) {
				if (err) return next(err);
				posts.find({}, { _id: 1 }).sort({ _id: -1 }).limit(1).nextObject(function (err, obj) {
					if (err) return next(err);
					pidSeed = obj ? obj._id : 0;
					console.log('post id seed: ' + pidSeed);
					next();
				});
			});
		});
	}

});
