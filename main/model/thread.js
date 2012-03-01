var _ = require('underscore');
var _should = require('should');

var _lang = require('../lang');
var _db = require('../db');

var col;
var idSeed;

_lang.addInit(function (callback) {
	col = exports.col = _db.db.collection("postThread");
	col.ensureIndex({categoryId: 1, udate: -1});
	col.ensureIndex({udate: -1});
	col.find({}, {_id: 1}).sort({_id: -1}).limit(1).next(function (err, obj) {
		idSeed = obj ? obj._id : 0;
		console.info('thread id seed: ' + idSeed);
		callback(err);
	});
});

// Thread

exports.make = function (obj) {
	return new Thread(obj);
}

var setProto = exports.setProto = function (obj) {
	obj.__proto__ = thread;
}

var Thread = function (obj) {
//	int _id;
//	int categoryId;
//	int hit;
//	int length;
//	DateTime cdate;
//	DateTime udate;
//	String userName;
//	String title;
	_.extend(this, obj);
}

var thread = Thread.prototype;

_lang.method(thread, 'setNewId', function () {
	this._id = ++idSeed;
});

_lang.method(thread, 'insert', function (callback) {
	col.insert(this, callback);
});

_lang.method(thread, 'update', function (callback) {
	col.save(this, callback);
});

_lang.method(thread, 'updateHit', function (callback) {
	col.update({_id: this._id}, {$inc: {hit: 1}}, callback);
});

// _thread.*

exports.findById = function (id, callback) {
	return col.findOne({_id: id}, function (err, obj) {
		if (err) callback(err, obj);
		setProto(obj);
		callback(err, obj);
	});
}

exports.updateLength = function (threadId, now, callback) {
	col.update({_id: threadId}, {$inc: {length: 1}, $set: {udate: now}}, callback);
}

//exports.getCount = function (callback) {
//	col.count(callback);
//}
//
//exports.getCountByCategoryId = function (categoryId, callback) {
//	col.find({categoryId: categoryId}).count(callback);
//}

exports.findList = function (categoryId, lastUdate, limit, callback) {
	if (!categoryId) {
		if (!lastUdate) {
			col.find().sort({udate: -1}).limit(limit).toArrayWithProto(thread, callback);
		} else {
			col.find({udate: {$lte: lastUdate}}).sort({udate: -1}).limit(limit).toArrayWithProto(thread, callback);
		}
	} else {
		if (!lastUdate) {
			col.find({categoryId: categoryId}).sort({udate: -1}).limit(limit).toArrayWithProto(thread, callback);
		} else {
			col.find({categoryId: categoryId, udate: {$lte: lastUdate}}).sort({udate: -1}).limit(limit).toArrayWithProto(thread, callback);
		}
	}
}

