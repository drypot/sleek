var should = require('should');

var init = require('../base/init');
var config = require('../base/config')({ path: 'config/sleek-test.json' });
var mongo = require('../mongo/mongo')({ dropDatabase: true });

before(function (next) {
	init.run(next);
});

describe("db", function () {
	it("should have databaseName", function () {
		mongo.db.databaseName.should.equal(config.data.mongoDb);
	});
});

describe("empty thread collection", function () {
	it("should exist", function () {
		should.exist(mongo.threads);
	});
	it("should be empty", function (next) {
		mongo.threads.count(function (err, count) {
			should(!err);
			count.should.equal(0);
			next();
		})
	});
	it("should have three index", function (next) {
		mongo.threads.indexes(function (err, indexes) {
			should(!err);
			indexes.should.be.instanceof(Array);
			indexes.should.be.length(3);
			next();
		});
	});
	it("can make serialized ids", function () {
		var id1 = mongo.getNewThreadId();
		var id2 = mongo.getNewThreadId();
		should(id1 < id2);
	});
});

describe("thread collection", function () {

	describe("inserting", function () {
		it("should success", function (next) {
			var t = {
				cid: 100, hit: 10, length: 5, cdate: new Date(10), udate: new Date(10),
				writer: 'snowman', title: 'title'
			};
			mongo.insertThread(t, function (err) {
				should.not.exists(err);
				mongo.threads.count(function (err, count) {
					should(!err);
					count.should.equal(1);
					next();
				});
			});
		});
	});

	describe("finding by id", function () {
		var t = {
			cid: 100, hit: 10, length: 5, cdate: new Date(10), udate: new Date(10),
			writer: 'snowman', title: 'title'
		};
		it("given empty collection", function (next) {
			mongo.threads.remove(next);
		});
		it("given thread", function (next) {
			t._id = mongo.getNewThreadId();
			mongo.insertThread(t, next);
		});
		it("should success", function (next) {
			mongo.findThread(t._id, function (err, _t) {
				should(!err);
				_t.should.eql(t);
				next();
			});
		});
	});

	describe("finding by category", function () {
		it("given empty collection", function (next) {
			mongo.threads.remove(next);
		});
		it("given threads", function (next) {
			var rows = [
				{
					_id: mongo.getNewThreadId(), cid: 101, hit: 10, length: 5, cdate: new Date(10), udate: new Date(10),
					writer: 'snowman', title: 'title1'
				},
				{
					_id: mongo.getNewThreadId(), cid: 101, hit: 10, length: 5, cdate: new Date(10), udate: new Date(20),
					writer: 'snowman', title: 'title2'
				},
				{
					_id: mongo.getNewThreadId(), cid: 101, hit: 10, length: 5, cdate: new Date(10), udate: new Date(30),
					writer: 'snowman', title: 'title3'
				},
				{
					_id: mongo.getNewThreadId(), cid: 101, hit: 10, length: 5, cdate: new Date(10), udate: new Date(40),
					writer: 'snowman', title: 'title4'
				},
				{
					_id: mongo.getNewThreadId(), cid: 103, hit: 10, length: 5, cdate: new Date(10), udate: new Date(50),
					writer: 'snowman', title: 'title5'
				},
				{
					_id: mongo.getNewThreadId(), cid: 103, hit: 10, length: 5, cdate: new Date(10), udate: new Date(60),
					writer: 'snowman', title: 'title6'
				},
				{
					_id: mongo.getNewThreadId(), cid: 104, hit: 10, length: 5, cdate: new Date(10), udate: new Date(70),
					writer: 'snowman', title: 'title7'
				},
				{
					_id: mongo.getNewThreadId(), cid: 104, hit: 10, length: 5, cdate: new Date(10), udate: new Date(80),
					writer: 'snowman', title: 'title8'
				},
				{
					_id: mongo.getNewThreadId(), cid: 104, hit: 10, length: 5, cdate: new Date(10), udate: new Date(90),
					writer: 'snowman', title: 'title9'
				},
				{
					_id: mongo.getNewThreadId(), cid: 104, hit: 10, length: 5, cdate: new Date(10), udate: new Date(100),
					writer: 'snowman', title: 'title10'
				}
			];
			mongo.insertThread(rows, next);
		});
		it("should success with cid 0", function (next) {
			var threads = [];
			var cursor = mongo.findThreads(1, 99);
			function read() {
				cursor.nextObject(function (err, t) {
					should(!err);
					if (t) {
						threads.push(t);
						setImmediate(read);
						return;
					}
					threads.should.length(10);
					threads[0].title.should.equal('title10');
					threads[1].title.should.equal('title9');
					threads[2].title.should.equal('title8');
					threads[9].title.should.equal('title1');
					next();
				});
			}
			read();
		});
		it("should success when cid is 101", function (next) {
			var threads = [];
			var cursor = mongo.findThreadsByCategory(101, 1, 99);
			function read() {
				cursor.nextObject(function (err, t) {
					should(!err);
					if (t) {
						threads.push(t);
						setImmediate(read);
						return;
					}
					threads.should.length(4);
					next();
				});
			}
			read();
		});
		it("should success when page is 2", function (next) {
			var threads = [];
			var cursor = mongo.findThreads(2, 3);
			function read() {
				cursor.nextObject(function (err, t) {
					should(!err);
					if (t) {
						threads.push(t);
						setImmediate(read);
						return;
					}
					threads.should.length(3);
					threads[0].title.should.equal('title7');
					threads[1].title.should.equal('title6');
					threads[2].title.should.equal('title5');
					next();
				});
			}
			read();
		});
	});

	describe("updating", function () {
		var t = {
			cid: 100, hit: 10, length: 5, cdate: new Date(10), udate: new Date(10),
			writer: 'snowman', title: 'title'
		};
		it("given empty collection", function (next) {
			mongo.threads.remove(next);
		});
		it("given thread", function (next) {
			t._id = mongo.getNewThreadId();
			mongo.insertThread(t, next);
		});
		it("should success", function (next) {
			t.writer  = 'oejfivoxkd';
			t.title = 'jfioejfasjdfiosjie'
			t.hit = 29384;
			mongo.updateThread(t, function (err) {
				should(!err);
				mongo.findThread(t._id, function (err, thread) {
					should(!err);
					thread.should.eql(t);
					next();
				});
			});
		});
	});

	describe("increasing hit", function () {
		var t = {
			cid: 100, hit: 10, length: 5, cdate: new Date(10), udate: new Date(10),
			writer: 'snowman', title: 'title'
		};
		it("given empty collection", function (next) {
			mongo.threads.remove(next);
		});
		it("given thread", function (next) {
			t._id = mongo.getNewThreadId();
			mongo.insertThread(t, next);
		});
		it("should success", function (next) {
			mongo.updateThreadHit(t._id, function (err) {
				should(!err);
				mongo.findThread(t._id, function (err, thread) {
					should(!err);
					thread.hit.should.equal(11);
					next();
				});
			});
		});
	});

	describe("updating lenth & udate", function () {
		var t = {
			cid: 100, hit: 10, length: 5, cdate: new Date(10), udate: new Date(10),
			writer: 'snowman', title: 'title'
		};
		it("given empty collection", function (next) {
			mongo.threads.remove(next);
		});
		it("given thread", function (next) {
			t._id = mongo.getNewThreadId();
			mongo.insertThread(t, next);
		});
		it("should success", function (next) {
			var now = new Date();
			mongo.updateThreadLength(t._id, now, function (err) {
				should(!err);
				mongo.findThread(t._id, function (err, thread) {
					should(!err);
					t.udate = now;
					t.length = 6;
					thread.should.eql(t);
					next();
				});
			});
		});
	});

});