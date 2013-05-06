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

describe("empty post collection", function () {
	it("should exist", function () {
		should(mongo.posts);
	});
	it("should be empty", function (next) {
		mongo.posts.count(function (err, count) {
			should.not.exist(err);
			count.should.equal(0);
			next();
		})
	});
	it("should have two indexes", function (next) {
		mongo.posts.indexes(function (err, index) {
			should.not.exist(err);
			index.should.be.instanceof(Array);
			index.should.be.length(2);
			next();
		});
	});
	it("can make serialized ids", function () {
		var id1 = mongo.getNewPostId();
		var id2 = mongo.getNewPostId();
		should(id1 < id2);
	});
});

describe("post collection", function () {

	describe("inserting", function () {
		it("should success", function (next) {
			var p = {
				threadId: 1000, cdate: new Date(50), visible: true,
				writer: 'snowman', text: 'text'
			}
			mongo.insertPost(p, function (err) {
				should.not.exists(err);
				mongo.posts.count(function (err, count) {
					should.not.exist(err);
					count.should.equal(1);
					next();
				});
			});
		});
	});

	describe("finding by id", function () {
		var p = {
			threadId: 1000, cdate: new Date(50), visible: true,
			writer: 'snowman', text: 'text'
		}
		it("given empty collection", function (next) {
			mongo.posts.remove(next);
		});
		it("given p", function (next) {
			p._id = mongo.getNewPostId();
			mongo.insertPost(p, next);
		});
		it("should success", function (next) {
			mongo.findPost(p._id, function (err, post) {
				should.not.exist(err);
				post.should.eql(p);
				next();
			});
		});
	});

	describe("finding by thread", function () {
		it("given empty collection", function (next) {
			mongo.posts.remove(next);
		});
		it("given posts", function (next) {
			var rows = [
				{
					_id: mongo.getNewPostId(), threadId: 1000, cdate: new Date(10), visible: true,
					writer: 'snowman', text: 'cool post 11'
				},
				{
					_id: mongo.getNewPostId(), threadId: 1000, cdate: new Date(20), visible: true,
					writer: 'snowman', text: 'cool post 12'
				},
				{
					_id: mongo.getNewPostId(), threadId: 1000, cdate: new Date(30), visible: false,
					writer: 'snowman', text: 'cool post 13'
				},
				{
					_id: mongo.getNewPostId(), threadId: 1010, cdate: new Date(10), visible: true,
					writer: 'snowman', text: 'cool post 21'
				},
				{
					_id: mongo.getNewPostId(), threadId: 1010, cdate: new Date(20), visible: true,
					writer: 'snowman', text: 'cool post 22'
				}
			];
			mongo.insertPost(rows, next);
		});
		it("should success", function (next) {
			var count = 0;
			mongo.findPostsByThread(1000, function (err, post) {
				should.not.exist(err);
				if (post) {
					count++;
					return;
				}
				count.should.equal(3);
				next();
			});
		});
		it("should success", function (next) {
			var count = 0;
			mongo.findPostsByThread(1010, function (err, post) {
				should.not.exist(err);
				if (post) {
					count++;
					return;
				}
				count.should.equal(2);
				next();
			});
		});
		it("should return sorted", function (next) {
			var posts = [];
			mongo.findPostsByThread(1000, function (err, post) {
				should.not.exist(err);
				if (post) {
					posts.push(post);
					return;
				}
				posts[0].cdate.should.below(posts[1].cdate);
				posts[1].cdate.should.below(posts[2].cdate);
				next();
			});
		});
	});

	describe("updating", function () {
		var p = {
			threadId: 1030, cdate: new Date(50), visible: true,
			writer: 'snowman', text: 'text'
		}
		it("given empty collection", function (next) {
			mongo.posts.remove(next);
		});
		it("given p", function (next) {
			p._id = mongo.getNewPostId();
			mongo.insertPost(p, next);
		});
		it("should success", function (next) {
			p.writer  = "fireman";
			p.hit = 17;
			mongo.updatePost(p, function (err) {
				should.not.exist(err);
				mongo.findPost(p._id, function (err, post) {
					should.not.exist(err);
					post.should.eql(p);
					next();
				});
			});
		});
	});
});