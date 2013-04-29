var should = require('should');

var init = require('../main/init');
var config = require('../main/config')({ test: true });
var mongo = require('../main/mongo')({ dropDatabase: true });

before(function (next) {
	init.run(next);
});

describe("db", function () {
	it("should have databaseName", function () {
		mongo.db.databaseName.should.equal('sleek-test');
	});
});

describe("empty thread collection", function () {
	it("should exist", function () {
		should.exist(mongo.threads);
	});
	it("should be empty", function (next) {
		mongo.threads.count(function (err, count) {
			should.not.exist(err);
			count.should.equal(0);
			next();
		})
	});
	it("should have three index", function (next) {
		mongo.threads.indexes(function (err, indexes) {
			should.not.exist(err);
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
				categoryId: 100, hit: 10, length: 5, created: new Date(10), updated: new Date(10),
				writer: 'snowman', title: 'title'
			};
			mongo.insertThread(t, function (err) {
				should.not.exists(err);
				mongo.threads.count(function (err, count) {
					should.not.exist(err);
					count.should.equal(1);
					next();
				});
			});
		});
	});

	describe("finding by id", function () {
		var t = {
			categoryId: 100, hit: 10, length: 5, created: new Date(10), updated: new Date(10),
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
			mongo.findThread(t._id, function (err, thread) {
				should.not.exist(err);
				thread.should.eql(t);
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
					_id: mongo.getNewThreadId(), categoryId: 101, hit: 10, length: 5, created: new Date(10), updated: new Date(10),
					writer: 'snowman', title: 'title1'
				},
				{
					_id: mongo.getNewThreadId(), categoryId: 101, hit: 10, length: 5, created: new Date(10), updated: new Date(20),
					writer: 'snowman', title: 'title2'
				},
				{
					_id: mongo.getNewThreadId(), categoryId: 101, hit: 10, length: 5, created: new Date(10), updated: new Date(30),
					writer: 'snowman', title: 'title3'
				},
				{
					_id: mongo.getNewThreadId(), categoryId: 101, hit: 10, length: 5, created: new Date(10), updated: new Date(40),
					writer: 'snowman', title: 'title4'
				},
				{
					_id: mongo.getNewThreadId(), categoryId: 103, hit: 10, length: 5, created: new Date(10), updated: new Date(50),
					writer: 'snowman', title: 'title5'
				},
				{
					_id: mongo.getNewThreadId(), categoryId: 103, hit: 10, length: 5, created: new Date(10), updated: new Date(60),
					writer: 'snowman', title: 'title6'
				},
				{
					_id: mongo.getNewThreadId(), categoryId: 104, hit: 10, length: 5, created: new Date(10), updated: new Date(70),
					writer: 'snowman', title: 'title7'
				},
				{
					_id: mongo.getNewThreadId(), categoryId: 104, hit: 10, length: 5, created: new Date(10), updated: new Date(80),
					writer: 'snowman', title: 'title8'
				},
				{
					_id: mongo.getNewThreadId(), categoryId: 104, hit: 10, length: 5, created: new Date(10), updated: new Date(90),
					writer: 'snowman', title: 'title9'
				},
				{
					_id: mongo.getNewThreadId(), categoryId: 104, hit: 10, length: 5, created: new Date(10), updated: new Date(100),
					writer: 'snowman', title: 'title10'
				}
			];
			mongo.insertThread(rows, next);
		});
		it("should success with categoryId 0", function (next) {
			var threads = [];
			mongo.findThreadsByCategory(0, 1, 99, function (err, thread) {
				should.not.exist(err);
				if (thread) {
					threads.push(thread);
					return;
				}
				threads.should.length(10);
				threads[0].title.should.equal('title10');
				threads[1].title.should.equal('title9');
				threads[2].title.should.equal('title8');
				threads[9].title.should.equal('title1');
				next();
			})
		});
		it("should success when categoryId is 101", function (next) {
			var threads = [];
			mongo.findThreadsByCategory(101, 1, 99, function (err, thread) {
				should.not.exist(err);
				if (thread) {
					threads.push(thread);
					return;
				}
				threads.should.length(4);
				next();
			});
		});
		it("should success when page is 2", function (next) {
			var threads = [];
			mongo.findThreadsByCategory(0, 2, 3, function (err, thread) {
				should.not.exist(err);
				if (thread) {
					threads.push(thread);
					return;
				}
				threads.should.length(3);
				threads[0].title.should.equal('title7');
				threads[1].title.should.equal('title6');
				threads[2].title.should.equal('title5');
				next();
			})
		});
	});

	describe("updating", function () {
		var t = {
			categoryId: 100, hit: 10, length: 5, created: new Date(10), updated: new Date(10),
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
				should.not.exist(err);
				mongo.findThread(t._id, function (err, thread) {
					should.not.exist(err);
					thread.should.eql(t);
					next();
				});
			});
		});
	});

	describe("increasing hit", function () {
		var t = {
			categoryId: 100, hit: 10, length: 5, created: new Date(10), updated: new Date(10),
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
				should.not.exist(err);
				mongo.findThread(t._id, function (err, thread) {
					should.not.exist(err);
					thread.hit.should.equal(11);
					next();
				});
			});
		});
	});

	describe("updating lenth & updated", function () {
		var t = {
			categoryId: 100, hit: 10, length: 5, created: new Date(10), updated: new Date(10),
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
				should.not.exist(err);
				mongo.findThread(t._id, function (err, thread) {
					should.not.exist(err);
					t.updated = now;
					t.length = 6;
					thread.should.eql(t);
					next();
				});
			});
		});
	});

});