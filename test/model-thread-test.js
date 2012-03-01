var _should = require('should');

var _lang = require('../main/lang');
var _db = require('../main/db');
var _thread = require('../main/model/thread');

_db.initParam = { dbName: "sleek-test", dropDatabase: true };

var now = new Date();
var col;

before(function (done) {
	_lang.runInit(done);
});

before(function () {
	col = _thread.col;
});

describe('thread object', function () {
	it('can be created', function () {
		var obj = _thread.make({
			categoryId: 101,
			hit: 10,
			length: 5,
			cdate: now,
			udate: now,
			userName: 'snowman',
			title: 'cool thread'
		});
		obj.categoryId.should.equal(101);
		obj.title.should.equal('cool thread');
	});
	it('can be set new id', function () {
		var obj = _thread.make({});
		obj.should.not.have.property('_id');
		obj.setNewId();
		obj.should.have.property('_id');
		obj._id.should.be.a('number');
	});
});

describe('thread collection', function () {
	it('should be ok', function () {
		col.should.be.ok;
	});
	it('should have no record', function (done) {
		col.count(function (err, count) {
			_should.ifError(err);
			count.should.equal(0);
			done(err);
		})
	});
	it('should have index', function (done) {
		col.indexes(function (err, indexList) {
			_should.ifError(err);
			indexList.should.be.instanceof(Array);
			indexList.should.be.length(3);
			done(err);
		});
	});
});

describe('thread data access', function () {
	before(function () {
		function insertThread(pojo) {
			var obj = _thread.make(pojo);
			obj.setNewId();
			obj.insert();
		}
		insertThread({
			categoryId: 101, hit: 10, length: 5, cdate: new Date(10), udate: new Date(10),
			userName: 'snowman', title: 'cool thread 1'
		});
		insertThread({
			categoryId: 101, hit: 10, length: 5, cdate: new Date(10), udate: new Date(11),
			userName: 'snowman', title: 'cool thread 2'
		});
		insertThread({
			categoryId: 101, hit: 10, length: 5, cdate: new Date(10), udate: new Date(20),
			userName: 'snowman', title: 'cool thread 3'
		});
		insertThread({
			categoryId: 101, hit: 10, length: 5, cdate: new Date(10), udate: new Date(20),
			userName: 'snowman', title: 'cool thread 4'
		});
		insertThread({
			categoryId: 103, hit: 10, length: 5, cdate: new Date(10), udate: new Date(30),
			userName: 'snowman', title: 'cool thread 5'
		});
		insertThread({
			categoryId: 103, hit: 10, length: 5, cdate: new Date(10), udate: new Date(40),
			userName: 'snowman', title: 'cool thread 6'
		});
		insertThread({
			categoryId: 104, hit: 10, length: 5, cdate: new Date(10), udate: new Date(50),
			userName: 'snowman', title: 'cool thread 7'
		});
	});
	function findOne(callback) {
		col.findOne({title: 'cool thread 7'}, function (err, obj) {
			_thread.setProto(obj);
			callback(err, obj);
		});
	}
	it('can insert record', function (done) {
		col.count(function (err, count) {
			_should.ifError(err);
			count.should.equal(7);
			done(err);
		});
	});
	it('can get by id', function (done) {
		findOne(function (err, obj) {
			_should.ifError(err);
			obj._id.should.ok;
			obj._id.should.be.a('number');
			_thread.findById(obj._id, function (err, thread2) {
				_should.ifError(err);
				thread2._id.should.equal(obj._id);
				thread2.title.should.equal(obj.title);
				done(err);
			});
		});
	});
	it('can update record', function (done) {
		findOne(function (err, obj) {
			obj.userName = "fireman";
			obj.hit = 17;
			obj.update();
			_thread.findById(obj._id, function (err, obj2) {
				_should.ifError(err);
				obj2.should.eql(obj);
				done(err);
			});
		});
	});
	it('can increase hit', function (done) {
		findOne(function (err, obj) {
			obj.updateHit();
			_thread.findById(obj._id, function (err, obj2) {
				_should.ifError(err);
				obj2.hit.should.equal(obj.hit + 1);
				done(err);
			});
		});
	});
	it('can update lenth & udate', function (done) {
		findOne(function (err, obj) {
			var now2 = new Date();
			_thread.updateLength(obj._id, now2);
			_thread.findById(obj._id, function (err, obj2) {
				_should.ifError(err);
				obj2.length.should.equal(obj.length + 1);
				obj2.udate.should.eql(now2);
				done(err);
			});
		});
	});

	describe('list', function () {
		it('can query all', function (done) {
			_thread.findList(0, null, 99, function (err, list) {
				_should.ifError(err);
				list.should.length(7);
				list[0].__proto__.should.equal(_thread.make({}).__proto__);
				list[0].udate.should.above(list[1].udate);
				list[1].udate.should.above(list[2].udate);
				list[2].udate.should.above(list[3].udate);
				done(err);
			})
		});
		it('can query with limited', function (done) {
			_thread.findList(0, null, 3, function (err, list) {
				_should.ifError(err);
				list.should.length(3);
				done(err);
			})
		});
		it('can query with lastUpdate', function (done) {
			_thread.findList(0, new Date(20), 99, function (err, list) {
				_should.ifError(err);
				list.should.length(4);
				list[0].udate.should.eql(new Date(20));
				list[1].udate.should.eql(new Date(20));
				list[2].udate.should.eql(new Date(11));
				done(err);
			})
		});
		it('can query with categoryId', function (done) {
			_thread.findList(101, null, 99, function (err, list) {
				_should.ifError(err);
				list.should.length(4);
				_thread.findList(103, null, 99, function (err, list) {
					_should.ifError(err);
					list.should.length(2);
					done(err);
				})
			})
		});
	}); // describe('list'
}); // describe('Thread data access'

