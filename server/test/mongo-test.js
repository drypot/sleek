var should = require('should');

var init = require('../main/init');
var config = require('../main/config').options({ test: true });
var mongo = require('../main/mongo').options({ dropDatabase: true, w: 1});

before(function (next) {
	init.run(next);
});

describe('mongo module', function () {
	it('should have db property', function () {
		should.exist(mongo.db);
	});
});

describe('db', function () {
	it('should have databaseName', function () {
		mongo.db.databaseName.should.equal('sleek-test');
	});
});

describe('empty post collection', function () {
	it('should exist', function () {
		should(mongo.posts);
	});
	it('should be empty', function (next) {
		mongo.posts.count(function (err, count) {
			should.not.exist(err);
			count.should.equal(0);
			next();
		})
	});
	it('should have two indexes', function (next) {
		mongo.posts.indexes(function (err, index) {
			should.not.exist(err);
			index.should.be.instanceof(Array);
			index.should.be.length(2);
			next();
		});
	});
	it('can make serialized ids', function () {
		var id1 = mongo.getNewPostId();
		var id2 = mongo.getNewPostId();
		should(id1 < id2);
	});
});

describe('filled post collection', function () {
	var ppost;

	before(function (next) {
		var rows = [
			{
				threadId: 1000, created: new Date(10), visible: true,
				writer: 'snowman', text: 'cool post 11'
			},
			{
				threadId: 1000, created: new Date(20), visible: true,
				writer: 'snowman', text: 'cool post 12',
			},
			{
				threadId: 1000, created: new Date(30), visible: false,
				writer: 'snowman', text: 'cool post 13',
			},
			{
				threadId: 1010, created: new Date(10), visible: true,
				writer: 'snowman', text: 'cool post 21'
			},
			{
				threadId: 1010, created: new Date(20), visible: true,
				writer: 'snowman', text: 'cool post 22'
			}
		];

		var i = 0;
		var len = rows.length;

		(function insert() {
			if (i === len) {
				return next();
			}
			var row = rows[i];
			row._id = mongo.getNewPostId();
			if (row.text === 'cool post 21') {
				ppost = row;
			}
			mongo.insertPost(row, function (err) {
				if (err) {
					return next(err);
				}
				i++;
				process.nextTick(insert);
			});
		})();
	});
	it('can count records', function (next) {
		mongo.posts.count(function (err, count) {
			should.not.exist(err);
			count.should.equal(5);
			next();
		});
	});
	it('can find post by id', function (next) {
		mongo.findPostById(ppost._id, function (err, post) {
			should.not.exist(err);
			post._id.should.equal(ppost._id);
			post.text.should.equal(ppost.text);
			next();
		});
	});
	it('can update', function (next) {
		ppost.writer  = "fireman";
		ppost.hit = 17;
		mongo.updatePost(ppost, function (err) {
			mongo.findPostById(ppost._id, function (err, post) {
				should.not.exist(err);
				post.should.eql(ppost);
				next();
			});
		});
	});
	it.skip('can find posts by thread id', function (next) {
		mongo.findPostsByThread(1000, function (err, post) {
			should.not.exist(err);
			post.should.length(3);
			next();
		})
	});
	it.skip('can find posts by thread id, 2', function (next) {
		mongo.findPostsByThread(1010, function (err, post) {
			should.not.exist(err);
			post.should.length(2);
			next();
		})
	});
	it.skip('can find posts as sorted', function (next) {
		mongo.findPostsByThread(1000, function (err, post) {
			should.not.exist(err);
			post[0].created.should.below(post[1].created);
			post[1].created.should.below(post[2].created);
			next();
		})
	});
});

describe('empty thread collection', function () {
	it('should exist', function () {
		should.exist(mongo.threads);
	});
	it('should be empty', function (next) {
		mongo.threads.count(function (err, count) {
			should.not.exist(err);
			count.should.equal(0);
			next();
		})
	});
	it('should have one index', function (next) {
		mongo.threads.indexes(function (err, indexList) {
			should.not.exist(err);
			indexList.should.be.instanceof(Array);
			indexList.should.be.length(3);
			next();
		});
	});
	it('can make serialized ids', function () {
		var id1 = mongo.getNewThreadId();
		var id2 = mongo.getNewThreadId();
		should(id1 < id2);
	});
});

describe('filled thread collection', function () {
	var pthread;

	before(function (next) {
		var rows = [
			{
				categoryId: 101, hit: 10, length: 5, created: new Date(10), updated: new Date(10),
				writer: 'snowman', title: 'title1'
			},
			{
				categoryId: 101, hit: 10, length: 5, created: new Date(10), updated: new Date(20),
				writer: 'snowman', title: 'title2'
			},
			{
				categoryId: 101, hit: 10, length: 5, created: new Date(10), updated: new Date(30),
				writer: 'snowman', title: 'title3'
			},
			{
				categoryId: 101, hit: 10, length: 5, created: new Date(10), updated: new Date(40),
				writer: 'snowman', title: 'title4'
			},
			{
				categoryId: 103, hit: 10, length: 5, created: new Date(10), updated: new Date(50),
				writer: 'snowman', title: 'title5'
			},
			{
				categoryId: 103, hit: 10, length: 5, created: new Date(10), updated: new Date(60),
				writer: 'snowman', title: 'title6'
			},
			{
				categoryId: 104, hit: 10, length: 5, created: new Date(10), updated: new Date(70),
				writer: 'snowman', title: 'title7'
			},
			{
				categoryId: 104, hit: 10, length: 5, created: new Date(10), updated: new Date(80),
				writer: 'snowman', title: 'title8'
			},
			{
				categoryId: 104, hit: 10, length: 5, created: new Date(10), updated: new Date(90),
				writer: 'snowman', title: 'title9'
			},
			{
				categoryId: 104, hit: 10, length: 5, created: new Date(10), updated: new Date(100),
				writer: 'snowman', title: 'title10'
			}
		];

		var i = 0;
		var len = rows.length;

		(function insert() {
			if (i === len) {
				return next();
			}
			var row = rows[i];
			row._id = mongo.getNewThreadId();
			if (row.title === 'title10') {
				pthread = row;
			}
			mongo.insertThread(row, function (err) {
				if (err) {
					return next(err);
				}
				i++;
				process.nextTick(insert);
			});
		})();
	});
	it('can count records', function (next) {
		mongo.threads.count(function (err, count) {
			should.not.exist(err);
			count.should.equal(10);
			next();
		});
	});
	it('can find by id', function (next) {
		mongo.findThread(pthread._id, function (err, thread) {
			should.not.exist(err);
			thread._id.should.equal(pthread._id);
			thread.title.should.equal(pthread.title);
			next();
		});
	});
	it('can update record', function (next) {
		pthread.writer  = "fireman";
		pthread.hit = 17;
		mongo.updateThread(pthread, function (err) {
			should.not.exist(err);
			mongo.findThread(pthread._id, function (err, thread) {
				should.not.exist(err);
				thread.should.eql(pthread);
				next();
			});
		});
	});
	it('can increase hit', function (next) {
		mongo.updateThreadHit(pthread._id, function (err) {
			should.not.exist(err);
			mongo.findThread(pthread._id, function (err, thread) {
				should.not.exist(err);
				thread.hit.should.equal(pthread.hit + 1);
				next();
			});
		});
	});
	it('can update lenth & updated', function (next) {
		var now = new Date();
		mongo.updateThreadLength(pthread._id, now, function (err) {
			should.not.exist(err);
			mongo.findThread(pthread._id, function (err, thread) {
				should.not.exist(err);
				thread.length.should.equal(pthread.length + 1);
				thread.updated.getTime().should.equal(now.getTime());
				next();
			});
		});
	});
	describe('findThreadsByCategory', function () {
		it('should success when categoryId is 0', function (next) {
			mongo.findThreadsByCategory(0, 1, 99, function (err, thread) {
				should.not.exist(err);
				thread.should.length(10);
				thread[0].title.should.equal('title10');
				thread[1].title.should.equal('title9');
				thread[2].title.should.equal('title8');
				thread[9].title.should.equal('title1');
				next();
			})
		});
		it('should success when categoryId is 101', function (next) {
			mongo.findThreadsByCategory(101, 1, 99, function (err, thread) {
				should.not.exist(err);
				thread.should.length(4);
				next();
			});
		});
		it('should success when page is 2', function (next) {
			mongo.findThreadsByCategory(0, 2, 3, function (err, thread) {
				should.not.exist(err);
				thread.should.length(3);
				thread[0].title.should.equal('title7');
				thread[1].title.should.equal('title6');
				thread[2].title.should.equal('title5');
				next();
			})
		});
		it('should success when page is -1', function (next) {
			mongo.findThreadsByCategory(0, -1, 3, function (err, thread) {
				should.not.exist(err);
				thread.should.length(3);
				thread[0].title.should.equal('title1');
				thread[1].title.should.equal('title2');
				thread[2].title.should.equal('title3');
				next();
			})
		});
	});
});