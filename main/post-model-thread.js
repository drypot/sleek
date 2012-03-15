var _ = require('underscore');
var should = require('should');

var l = require('./l.js');
var mongo = require('./mongo.js');

l.init.add(function (next) {
	Thread.col = exports.col = mongo.db.collection("postThread");
	Thread.col.ensureIndex({categoryId: 1, udate: -1});
	Thread.col.ensureIndex({udate: -1});
	Thread.col.find({}, {_id: 1}).sort({_id: -1}).limit(1).next(function (err, obj) {
		Thread.idSeed = obj ? obj._id : 0;
		console.info('thread id seed: ' + Thread.idSeed);
		next(err);
	});
});

var Thread = module.exports = function () {
//	int _id;
//	int categoryId;
//	int hit;
//	int length;
//	DateTime cdate;
//	DateTime udate;
//	String userName ;
//	String title;
}

Thread.setNewId = function (thread) {
	thread._id = ++Thread.idSeed;
}

Thread.insert = function (thread, next) {
	Thread.col.insert(thread, next);
}

Thread.update = function (thread, next) {
	Thread.col.save(thread, next);
}

Thread.updateHit = function (thread, next) {
	Thread.col.update({_id: thread._id}, {$inc: {hit: 1}}, next);
}

Thread.updateLength = function (thread, now, next) {
	Thread.col.update({_id: thread._id}, {$inc: {length: 1}, $set: {udate: now}}, next);
}

Thread.findById = function (id, next) {
	return Thread.col.findOne({_id: id}, next);
}

Thread.findByCategoryId = function (categoryId, lastUdate, limit, next) {
	if (!categoryId) {
		if (!lastUdate) {
			Thread.col.find().sort({udate: -1}).limit(limit).toArray(next);
		} else {
			Thread.col.find({udate: {$lte: lastUdate}}).sort({udate: -1}).limit(limit).toArray(next);
		}
	} else {
		if (!lastUdate) {
			Thread.col.find({categoryId: categoryId}).sort({udate: -1}).limit(limit).toArray(next);
		} else {
			Thread.col.find({categoryId: categoryId, udate: {$lte: lastUdate}}).sort({udate: -1}).limit(limit).toArray(next);
		}
	}
}
