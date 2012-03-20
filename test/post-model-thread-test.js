var _ = require('underscore');
var should = require('should');
var async = require('async');

var l = require('../main/l.js');
var Thread = require('../main/post-model-thread.js');
var test = require('../main/test.js');

var col;

before(function (next) {
	test.prepare('config,mongo', next);
});

before(function () {
	col = Thread.col;
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

describe('thread/mongo', function () {
	var pthread;
	it('can set new id', function () {
		var id1 = Thread.getNewId();
		var id2 = Thread.getNewId();
		should(id1 < id2);
	});
	it('can insert thread', function () {
		function insertThread(thread) {
			thread._id = Thread.getNewId();
			Thread.insert(thread);
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
		pthread = insertThread({
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
		Thread.findById(pthread._id, function (err, thread) {
			if (err) return next(err);
			thread._id.should.equal(pthread._id);
			thread.title.should.equal(pthread.title);
			next(err);
		});
	});
	it('can update record', function (next) {
		pthread.userName  = "fireman";
		pthread.hit = 17;
		Thread.update(pthread);
		Thread.findById(pthread._id, function (err, thread) {
			if (err) return next(err);
			thread.should.eql(pthread);
			next();
		});
	});
	it('can increase hit', function (next) {
		Thread.updateHit(pthread);
		Thread.findById(pthread._id, function (err, thread) {
			if (err) return next(err);
			thread.hit.should.equal(pthread.hit + 1);
			next();
		});
	});
	it('can update lenth & udate', function (next) {
		var now = new Date();
		Thread.updateLength(pthread, now);
		Thread.findById(pthread._id, function (err, thread) {
			if (err) return next(err);
			thread.length.should.equal(pthread.length + 1);
			thread.udate.should.eql(now);
			next();
		});
	});
	it('can find all', function (next) {
		Thread.findByCategoryId(0, null, 99, function (err, list) {
			if (err) return next(err);
			list.should.length(7);
			list[0].udate.should.above(list[1].udate);
			list[1].udate.should.above(list[2].udate);
			list[2].udate.should.above(list[3].udate);
			next();
		})
	});
	it('can find with limited', function (next) {
		Thread.findByCategoryId(0, null, 3, function (err, thread) {
			if (err) return next(err);
			thread.should.length(3);
			next();
		})
	});
	it('can find with lastUpdate', function (next) {
		Thread.findByCategoryId(0, new Date(20), 99, function (err, thread) {
			if (err) return next(err);
			thread.should.length(4);
			thread[0].udate.should.eql(new Date(20));
			thread[1].udate.should.eql(new Date(20));
			thread[2].udate.should.eql(new Date(11));
			next();
		})
	});
	it('can find with categoryId', function (next) {
		Thread.findByCategoryId(101, null, 99, function (err, thread) {
			if (err) return next(err);
			thread.should.length(4);
			next(err);
		});
	});
	it('can find with categoryId 2', function (next) {
		Thread.findByCategoryId(103, null, 99, function (err, thread) {
			if (err) return next(err);
			thread.should.length(2);
			next(err);
		});
	});
});
