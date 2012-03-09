var _ = require('underscore');
var _should = require('should');
var _async = require('async');


var _lang = require('../main/lang');
var _db = require('../main/db');
var _thread = require('../main/model/thread');

var now = new Date();
var col;

before(function (next) {
	_lang.addBeforeInit(function (next) {
		_db.initParam = { mongoDbName: "sleek-test", dropDatabase: true };
		next();
	});	_lang.runInit(next);
});

before(function () {
	col = _thread.col;
});

describe('thread object,', function () {
	it('can be created', function () {
		var thread = _thread.make({
			categoryId: 101,
			hit: 10,
			length: 5,
			cdate: now,
			udate: now,
			username : 'snowman',
			title: 'cool thread'
		});
		thread.categoryId.should.equal(101);
		thread.title.should.equal('cool thread');
	});
	it('can be set new id', function () {
		var thread = _thread.make({});
		thread.should.not.have.property('_id');
		_thread.setNewId(thread);
		thread.should.have.property('_id');
		thread._id.should.be.a('number');
	});
});

describe('thread collection,', function () {
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

describe('thread data access', function () {
	var prevThread;
	before(function () {
		function insertThread(pojo) {
			var thread = _thread.make(pojo);
			_thread.setNewId(thread);
			_thread.insert(thread);
			return thread;
		}
		insertThread({
			categoryId: 101, hit: 10, length: 5, cdate: new Date(10), udate: new Date(10),
			username : 'snowman', title: 'cool thread 1'
		});
		insertThread({
			categoryId: 101, hit: 10, length: 5, cdate: new Date(10), udate: new Date(11),
			username : 'snowman', title: 'cool thread 2'
		});
		insertThread({
			categoryId: 101, hit: 10, length: 5, cdate: new Date(10), udate: new Date(20),
			username : 'snowman', title: 'cool thread 3'
		});
		insertThread({
			categoryId: 101, hit: 10, length: 5, cdate: new Date(10), udate: new Date(20),
			username : 'snowman', title: 'cool thread 4'
		});
		insertThread({
			categoryId: 103, hit: 10, length: 5, cdate: new Date(10), udate: new Date(30),
			username : 'snowman', title: 'cool thread 5'
		});
		insertThread({
			categoryId: 103, hit: 10, length: 5, cdate: new Date(10), udate: new Date(40),
			username : 'snowman', title: 'cool thread 6'
		});
		prevThread = insertThread({
			categoryId: 104, hit: 10, length: 5, cdate: new Date(10), udate: new Date(50),
			username : 'snowman', title: 'cool thread 7'
		});
	});
	it('can insert record', function (next) {
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
		prevThread.username  = "fireman";
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

	describe('list', function () {
		it('can query all', function (next) {
			_thread.find(0, null, 99, function (err, list) {
				if (err) return next(err);
				list.should.length(7);
				list[0].udate.should.above(list[1].udate);
				list[1].udate.should.above(list[2].udate);
				list[2].udate.should.above(list[3].udate);
				next();
			})
		});
		it('can query with limited', function (next) {
			_thread.find(0, null, 3, function (err, list) {
				if (err) return next(err);
				list.should.length(3);
				next();
			})
		});
		it('can query with lastUpdate', function (next) {
			_thread.find(0, new Date(20), 99, function (err, list) {
				if (err) return next(err);
				list.should.length(4);
				list[0].udate.should.eql(new Date(20));
				list[1].udate.should.eql(new Date(20));
				list[2].udate.should.eql(new Date(11));
				next();
			})
		});
		it('can query with categoryId', function (next) {
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
	}); // describe('list'
}); // describe('Thread data access'

