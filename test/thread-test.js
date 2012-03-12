var _ = require('underscore');
var _should = require('should');
var _async = require('async');


var _l = require('../main/l');
var _db = require('../main/db');
var _thread = require('../main/model/thread');

var now = new Date();
var col;

before(function (next) {
	_l.addBeforeInit(function (next) {
		_db.initParam = { mongoDbName: "sleek-test", dropDatabase: true };
		next();
	});
	_l.runInit(next);
});

before(function () {
	col = _thread.col;
});

describe('thread collection', function () {
	it('should be ok', function () {
		col.should.be.ok;
	});
	it('should have no record', function (next) {
		col.count(function (err, count) {
			if (err) return next(err);
			count.should.equal(0);
			next(err);
		})
	});
	it('should have index', function (next) {
		col.indexes(function (err, indexList) {
			if (err) return next(err);
			indexList.should.be.instanceof(Array);
			indexList.should.be.length(3);
			next(err);
		});
	});
});

describe('setNewId', function () {
	it('can set new id', function () {
		var thread = {};
		thread.should.not.have.property('_id');
		_thread.setNewId(thread);
		thread.should.have.property('_id');
		thread._id.should.be.a('number');
	});
});

describe('thread/db', function () {
	var prevThread;
	it('can insert thread', function () {
		function insertThread(thread) {
			_thread.setNewId(thread);
			_thread.insert(thread);
			return thread;
		}
		insertThread({
			categoryId: 101, hit: 10, length: 5, cdate: new Date(10), udate: new Date(10),
			userName : 'snowman', title: 'cool thread 1'
		});
		insertThread({
			categoryId: 101, hit: 10, length: 5, cdate: new Date(10), udate: new Date(11),
			userName : 'snowman', title: 'cool thread 2'
		});
		insertThread({
			categoryId: 101, hit: 10, length: 5, cdate: new Date(10), udate: new Date(20),
			userName : 'snowman', title: 'cool thread 3'
		});
		insertThread({
			categoryId: 101, hit: 10, length: 5, cdate: new Date(10), udate: new Date(20),
			userName : 'snowman', title: 'cool thread 4'
		});
		insertThread({
			categoryId: 103, hit: 10, length: 5, cdate: new Date(10), udate: new Date(30),
			userName : 'snowman', title: 'cool thread 5'
		});
		insertThread({
			categoryId: 103, hit: 10, length: 5, cdate: new Date(10), udate: new Date(40),
			userName : 'snowman', title: 'cool thread 6'
		});
		prevThread = insertThread({
			categoryId: 104, hit: 10, length: 5, cdate: new Date(10), udate: new Date(50),
			userName : 'snowman', title: 'cool thread 7'
		});
	});
	it('can count record', function (next) {
		col.count(function (err, count) {
			if (err) return next(err);
			count.should.equal(7);
			next();
		});
	});
	it('can get by id', function (next) {
		_thread.findById(prevThread._id, function (err, thread) {
			if (err) return next(err);
			thread._id.should.equal(prevThread._id);
			thread.title.should.equal(prevThread.title);
			next(err);
		});
	});
	it('can update record', function (next) {
		prevThread.userName  = "fireman";
		prevThread.hit = 17;
		_thread.update(prevThread);
		_thread.findById(prevThread._id, function (err, thread) {
			if (err) return next(err);
			thread.should.eql(prevThread);
			next();
		});
	});
	it('can increase hit', function (next) {
		_thread.updateHit(prevThread);
		_thread.findById(prevThread._id, function (err, thread) {
			if (err) return next(err);
			thread.hit.should.equal(prevThread.hit + 1);
			next();
		});
	});
	it('can update lenth & udate', function (next) {
		var now2 = new Date();
		_thread.updateLength(prevThread, now2);
		_thread.findById(prevThread._id, function (err, thread) {
			if (err) return next(err);
			thread.length.should.equal(prevThread.length + 1);
			thread.udate.should.eql(now2);
			next();
		});
	});
	it('can find all', function (next) {
		_thread.find(0, null, 99, function (err, list) {
			if (err) return next(err);
			list.should.length(7);
			list[0].udate.should.above(list[1].udate);
			list[1].udate.should.above(list[2].udate);
			list[2].udate.should.above(list[3].udate);
			next();
		})
	});
	it('can find with limited', function (next) {
		_thread.find(0, null, 3, function (err, list) {
			if (err) return next(err);
			list.should.length(3);
			next();
		})
	});
	it('can find with lastUpdate', function (next) {
		_thread.find(0, new Date(20), 99, function (err, list) {
			if (err) return next(err);
			list.should.length(4);
			list[0].udate.should.eql(new Date(20));
			list[1].udate.should.eql(new Date(20));
			list[2].udate.should.eql(new Date(11));
			next();
		})
	});
	it('can find with categoryId', function (next) {
		_thread.find(101, null, 99, function (err, list) {
			if (err) return next(err);
			list.should.length(4);
			_thread.find(103, null, 99, function (err, list) {
				if (err) return next(err);
				list.should.length(2);
				next(err);
			})
		})
	});
});

