var should = require('should');
var async = require('async');

var mongo;
var es;

before(function (next) {
	require('../main/config')({ test: true }, function (_config) {
		require('../main/mongo')({ config: _config, dropDatabase: true }, function (_mongo) {
			require('../main/es')({ config: _config, mongo: _mongo, dropIndex: true }, function (_es) {
				mongo = _mongo;
				es = _es;
				next();
			});
		});
	});
});

describe('es', function () {
	var doc;

	before(function (next) {
		var tid;
		doc = [
			{
				thread: {
					_id: tid = mongo.getNewThreadId(), categoryId: 101, created: new Date(2000, 1, 1),
					title: 'hello world'
				},
				post: {
					_id: mongo.getNewPostId(), created: new Date(2000, 1, 1),
					writer: 'snowman', text: 'apple pine banana'
				}
			},
			{
				thread: {
					_id: tid, categoryId: 101, created: new Date(2000, 1, 1),
					title: 'hello world'
				},
				post: {
					_id: mongo.getNewPostId(), created: new Date(2000, 1, 2),
					writer: 'snowman', text: 'apple pine orange'
				}
			},
			{
				thread: {
					_id: mongo.getNewThreadId(), categoryId: 101, created: new Date(2000, 2, 1),
					title: '안녕하세요. 한글 테스트'
				},
				post: {
					_id: mongo.getNewPostId(), created: new Date(2000, 2, 1),
					writer: '홍길동', text: '둥글게 네모나게 붉게 파랗게'
				}
			},
			{
				thread: {
					_id: mongo.getNewThreadId(), categoryId: 101, created: new Date(2000, 3, 1),
					title: '안녕할까요. 한글 테스트'
				},
				post: {
					_id: mongo.getNewPostId(), created: new Date(2000, 3, 1),
					writer: '개똥이', text: '둥글게 네모나게'
				}
			},
			{
				thread: {
					_id: mongo.getNewThreadId(), categoryId: 101, created: new Date(2000, 4, 1),
					title: '강물엔 유람선이 떠있고'
				},
				post: {
					_id: mongo.getNewPostId(), created: new Date(2000, 4, 1),
					writer: '말똥이', text: '둥글게 붉게 파랗게'
				}
			}
		];
		async.forEachSeries(doc, function (doc, next) {
			es.updatePost(doc.thread, doc.post, function (err, res) {
				if (err) {
					next(err);
				} else {
					should(res.statusCode == 201 || res.statusCode == 200);
					res.body.ok.should.true;
					next();
				}
			});
		}, next);
	});
	before(function (next) {
		es.flush(next);
	});
	it('can get post head', function (next) {
		var doc0 = doc[0];
		es.getPost(doc0.post._id, function (err, res) {
			should.not.exist(err);
			res.status.should.equal(200);
			res.body._id.should.equal(doc0.post._id);
			var s = res.body._source;
			s.threadId.should.equal(doc0.thread._id);
			s.categoryId.should.equal(doc0.thread.categoryId);
			s.created.getTime().should.equal(doc0.post.created.getTime());
			s.title.should.equal(doc0.thread.title);
			s.titlei.should.equal(doc0.thread.title);
			s.writer.should.equal(doc0.post.writer);
			s.text.should.equal(doc0.post.text);
			next();
		});
	});
	it('can get post reply', function (next) {
		var doc1 = doc[1];
		es.getPost(doc1.post._id, function (err, res) {
			should.not.exist(err);
			res.status.should.equal(200);
			res.body._id.should.equal(doc1.post._id);
			var s = res.body._source;
			s.threadId.should.equal(doc1.thread._id);
			s.categoryId.should.equal(doc1.thread.categoryId);
			s.created.getTime().should.equal(doc1.post.created.getTime());
			s.title.should.equal(doc1.thread.title);
			s.titlei.should.equal('');
			s.writer.should.equal(doc1.post.writer);
			s.text.should.equal(doc1.post.text);
			next();
		});
	});
	it('can search in title', function (next) {
		es.searchPost({
			query: { query_string: { query: 'hello', default_operator: 'and' }},
			sort: [{ created : "asc" }]
		},
		function (err, res) {
			should.not.exist(err);
			res.status.should.equal(200);
			res.body.hits.total.should.equal(1);
			res.body.hits.hits[0]._id.should.equal(doc[0].post._id);
			next();
		});
	});
	it('can search in writer', function (next) {
		es.searchPost({
			query: { query_string: { query: 'snowman', default_operator: 'and' }},
			sort: [{ created : "asc" }]
		},
		function (err, res) {
			should.not.exist(err);
			res.status.should.equal(200);
			res.body.hits.total.should.equal(2);
			res.body.hits.hits[0]._id.should.equal(doc[0].post._id);
			res.body.hits.hits[1]._id.should.equal(doc[1].post._id);
			next();
		});
	});
	it('can search in reply', function (next) {
		es.searchPost({
			query: { query_string: { query: 'apple', default_operator: 'and' }},
			sort: [{ created : "asc" }]
		},
		function (err, res) {
			should.not.exist(err);
			res.status.should.equal(200);
			res.body.hits.total.should.equal(2);
			res.body.hits.hits[0]._id.should.equal(doc[0].post._id);
			res.body.hits.hits[1]._id.should.equal(doc[1].post._id);
			next(err);
		});
	});
	it('can search in reply 2', function (next) {
		es.searchPost({
			query: { query_string: { query: 'orange', default_operator: 'and' }},
			sort:[{ created : "asc" }]
		},
		function (err, res) {
			should.not.exist(err);
			res.status.should.equal(200);
			res.body.hits.total.should.equal(1);
			res.body.hits.hits[0]._id.should.equal(doc[1].post._id);
			next();
		});
	});
	it('can search with two word', function (next) {
		es.searchPost({
			query: { query_string: { query: 'apple orange', default_operator: 'and' }},
			sort: [{ created : "asc" }]
		},
		function (err, res) {
			should.not.exist(err);
			res.status.should.equal(200);
			res.body.hits.total.should.equal(1);
			res.body.hits.hits[0]._id.should.equal(doc[1].post._id);
			next();
		});
	});
	it('can search in text order by desc', function (next) {
		es.searchPost({
			query: { query_string: { query: '둥글게', default_operator: 'and' }},
			sort: [{ created : "desc" }]
		},
		function (err, res) {
			should.not.exist(err);
			res.status.should.equal(200);
			res.body.hits.hits.should.length(3);
			res.body.hits.hits[0]._id.should.equal(doc[4].post._id);
			res.body.hits.hits[1]._id.should.equal(doc[3].post._id);
			res.body.hits.hits[2]._id.should.equal(doc[2].post._id);
			next();
		});
	});
	it('can limit result range with from', function (next) {
		es.searchPost({
			query: { query_string: { query: '둥글게', default_operator: 'and' }},
			sort: [{ created : "desc" }],
			size: 16, from: 1
		},
		function (err, res) {
			should.not.exist(err);
			res.status.should.equal(200);
			res.body.hits.hits.should.length(2);
			res.body.hits.hits[0]._id.should.equal(doc[3].post._id);
			res.body.hits.hits[1]._id.should.equal(doc[2].post._id);
			next(err);
		});
	});
	it('can search hangul', function (next) {
		es.searchPost({
			query: { query_string: { query: '안녕', default_operator: 'and' }},
			sort:[{created : "asc"}]
		},
		function (err, res) {
			should.not.exist(err);
			res.status.should.equal(200);
			res.body.hits.total.should.equal(2);
			res.body.hits.hits[0]._id.should.equal(doc[2].post._id);
			res.body.hits.hits[1]._id.should.equal(doc[3].post._id);
			next();
		});
	});
	it('can search hangul 2', function (next) {
		es.searchPost({
			query: { query_string: { query: '파랗게', default_operator: 'and' }},
			sort:[{ created : "asc" }]
		},
		function (err, res) {
			should.not.exist(err);
			res.status.should.equal(200);
			res.body.hits.total.should.equal(2);
			res.body.hits.hits[0]._id.should.equal(doc[2].post._id);
			res.body.hits.hits[1]._id.should.equal(doc[4].post._id);
			next();
		});
	});
	it('can search hangul 3', function (next) {
		es.searchPost({
			query: { query_string: { query: '파랗게 말똥이', default_operator: 'and' }},
			sort: [{ created : 'asc' }]
		},
		function (err, res) {
			should.not.exist(err);
			res.status.should.equal(200);
			res.body.hits.total.should.equal(1);
			res.body.hits.hits[0]._id.should.equal(doc[4].post._id);
			next();
		});
	});
});
