var _ = require('underscore');
var _should = require('should');

var _lang = require('../lang');
var _db = require('../db');

var col;
var idSeed;

_lang.addInit(function (next) {
	col = exports.col = _db.db.collection("postThread");
	col.ensureIndex({categoryId: 1, udate: -1});
	col.ensureIndex({udate: -1});
	col.find({}, {_id: 1}).sort({_id: -1}).limit(1).next(function (err, obj) {
		idSeed = obj ? obj._id : 0;
		console.info('thread id seed: ' + idSeed);
		next(err);
	});
});

// thread

//	int _id;
//	int categoryId;
//	int hit;
//	int length;
//	DateTime cdate;
//	DateTime udate;
//	String username ;
//	String title;

// _thread.*;

exports.setNewId = function (thread) {
	thread._id = ++idSeed;
}

exports.insert = function (thread, next) {
	col.insert(thread, next);
}

exports.update = function (thread, next) {
	col.save(thread, next);
}

exports.updateHit = function (thread, next) {
	col.update({_id: thread._id}, {$inc: {hit: 1}}, next);
}

exports.updateLength = function (thread, now, next) {
	col.update({_id: thread._id}, {$inc: {length: 1}, $set: {udate: now}}, next);
}

exports.findById = function (id, next) {
	return col.findOne({_id: id}, next);
}

exports.find = function (categoryId, lastUdate, limit, next) {
	if (!categoryId) {
		if (!lastUdate) {
			col.find().sort({udate: -1}).limit(limit).toArray(next);
		} else {
			col.find({udate: {$lte: lastUdate}}).sort({udate: -1}).limit(limit).toArray(next);
		}
	} else {
		if (!lastUdate) {
			col.find({categoryId: categoryId}).sort({udate: -1}).limit(limit).toArray(next);
		} else {
			col.find({categoryId: categoryId, udate: {$lte: lastUdate}}).sort({udate: -1}).limit(limit).toArray(next);
		}
	}
}

//exports.getCount = function (next) {
//	col.count(next);
//}
//
//exports.getCountByCategoryId = function (categoryId, next) {
//	col.find({categoryId: categoryId}).count(next);
//}

