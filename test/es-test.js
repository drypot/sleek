var _ = require('underscore');
var should = require('should');
var async = require('async');
var l = require('../main/l');

require('../main/es.js');
require('../main/test.js');

before(function (next) {
	l.init.run(next);
});

describe('es', function () {
	var doc;
	it('given sample docs', function (next) {
		var tid;
		doc = [
			{
				thread: {
					_id: tid = l.mongo.getNewThreadId(), categoryId: 101, cdate: new Date(2000, 1, 1),
					title: 'hello world'
				},
				post: {
					_id: l.mongo.getNewPostId(), cdate: new Date(2000, 1, 1),
					userName: 'snowman', text: 'apple pine banana'
				}
			},
			{
				thread: {
					_id: tid, categoryId: 101, cdate: new Date(2000, 1, 1),
					title: 'hello world'
				},
				post: {
					_id: l.mongo.getNewPostId(), cdate: new Date(2000, 1, 2),
					userName: 'snowman', text: 'apple pine orange'
				}
			},
			{
				thread: {
					_id: l.mongo.getNewThreadId(), categoryId: 101, cdate: new Date(2000, 2, 1),
					title: '안녕하세요. 한글 테스트'
				},
				post: {
					_id: l.mongo.getNewPostId(), cdate: new Date(2000, 2, 1),
					userName: '홍길동', text: '둥글게 네모나게 붉게 파랗게'
				}
			},
			{
				thread: {
					_id: l.mongo.getNewThreadId(), categoryId: 101, cdate: new Date(2000, 3, 1),
					title: '안녕할까요. 한글 테스트'
				},
				post: {
					_id: l.mongo.getNewPostId(), cdate: new Date(2000, 3, 1),
					userName: '개똥이', text: '둥글게 네모나게'
				}
			},
			{
				thread: {
					_id: l.mongo.getNewThreadId(), categoryId: 101, cdate: new Date(2000, 4, 1),
					title: '강물엔 유람선이 떠있고'
				},
				post: {
					_id: l.mongo.getNewPostId(), cdate: new Date(2000, 4, 1),
					userName: '말똥이', text: '둥글게 붉게 파랗게'
				}
			}
		];
		async.forEachSeries(doc, function (doc, next) {
			l.es.updatePost(doc.thread, doc.post, function (err, res) {
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
	it('and flushed data', function (next) {
		l.es.flush(next);
	});
	it('can get post head', function (next) {
		var doc0 = doc[0];
		l.es.getPost(doc0.post._id, function (err, res) {
			res.status.should.equal(200);
			res.body._id.should.equal(doc0.post._id);
			var s = res.body._source;
			s.threadId.should.equal(doc0.thread._id);
			s.categoryId.should.equal(doc0.thread.categoryId);
			s.cdate.getTime().should.equal(doc0.post.cdate.getTime());
			s.title.should.equal(doc0.thread.title);
			s.titlei.should.equal(doc0.thread.title);
			s.userName.should.equal(doc0.post.userName);
			s.text.should.equal(doc0.post.text);
			next(err);
		});
	});
	it('can get post reply', function (next) {
		var doc1 = doc[1];
		l.es.getPost(doc1.post._id, function (err, res) {
			res.status.should.equal(200);
			res.body._id.should.equal(doc1.post._id);
			var s = res.body._source;
			s.threadId.should.equal(doc1.thread._id);
			s.categoryId.should.equal(doc1.thread.categoryId);
			s.cdate.getTime().should.equal(doc1.post.cdate.getTime());
			s.title.should.equal(doc1.thread.title);
			s.titlei.should.equal('');
			s.userName.should.equal(doc1.post.userName);
			s.text.should.equal(doc1.post.text);
			next(err);
		});
	});
	it('can search in title', function (next) {
		l.es.searchPost({
				query: { query_string: { query: 'hello', default_operator: 'and' }},
				sort:[{cdate : "asc"}]
			},
			function (err, res) {
				res.status.should.equal(200);
				res.body.hits.total.should.equal(1);
				res.body.hits.hits[0]._id.should.equal(doc[0].post._id);
				next(err);
			}
		);
	});
	it('can search in userName', function (next) {
		l.es.searchPost({
				query: { query_string: { query: 'snowman', default_operator: 'and' }},
				sort:[{cdate : "asc"}]
			},
			function (err, res) {
				res.status.should.equal(200);
				res.body.hits.total.should.equal(2);
				res.body.hits.hits[0]._id.should.equal(doc[0].post._id);
				res.body.hits.hits[1]._id.should.equal(doc[1].post._id);
				next(err);
			}
		);
	});
	it('can search in reply', function (next) {
		l.es.searchPost({
				query: { query_string: { query: 'apple', default_operator: 'and' }},
				sort:[{cdate : "asc"}]
			},
			function (err, res) {
				res.status.should.equal(200);
				res.body.hits.total.should.equal(2);
				res.body.hits.hits[0]._id.should.equal(doc[0].post._id);
				res.body.hits.hits[1]._id.should.equal(doc[1].post._id);
				next(err);
			}
		);
	});
	it('can search in reply 2', function (next) {
		l.es.searchPost({
				query: { query_string: { query: 'orange', default_operator: 'and' }},
				sort:[{cdate : "asc"}]
			},
			function (err, res) {
				res.status.should.equal(200);
				res.body.hits.total.should.equal(1);
				res.body.hits.hits[0]._id.should.equal(doc[1].post._id);
				next(err);
			}
		);
	});
	it('can search with two word', function (next) {
		l.es.searchPost({
				query: { query_string: { query: 'apple orange', default_operator: 'and' }},
				sort:[{cdate : "asc"}]
			},
			function (err, res) {
				res.status.should.equal(200);
				res.body.hits.total.should.equal(1);
				res.body.hits.hits[0]._id.should.equal(doc[1].post._id);
				next(err);
			}
		);
	});
	it('can search in text order by desc', function (next) {
		l.es.searchPost({
				query: { query_string: { query: '둥글게', default_operator: 'and' }},
				sort:[{cdate : "desc"}]
			},
			function (err, res) {
				res.status.should.equal(200);
				res.body.hits.hits.should.length(3);
				res.body.hits.hits[0]._id.should.equal(doc[4].post._id);
				res.body.hits.hits[1]._id.should.equal(doc[3].post._id);
				res.body.hits.hits[2]._id.should.equal(doc[2].post._id);
				next(err);
			}
		);
	});
	it('can limit result range with from', function (next) {
		l.es.searchPost({
				query: { query_string: { query: '둥글게', default_operator: 'and' }},
				sort:[{cdate : "desc"}],
				size: 16, from: 1
			},
			function (err, res) {
				res.status.should.equal(200);
				res.body.hits.hits.should.length(2);
				res.body.hits.hits[0]._id.should.equal(doc[3].post._id);
				res.body.hits.hits[1]._id.should.equal(doc[2].post._id);
				next(err);
			}
		);
	});
	it('can search hangul', function (next) {
		l.es.searchPost({
				query: { query_string: { query: '안녕', default_operator: 'and' }},
				sort:[{cdate : "asc"}]
			},
			function (err, res) {
				res.status.should.equal(200);
				res.body.hits.total.should.equal(2);
				res.body.hits.hits[0]._id.should.equal(doc[2].post._id);
				res.body.hits.hits[1]._id.should.equal(doc[3].post._id);
				next(err);
			}
		);
	});
	it('can search hangul 2', function (next) {
		l.es.searchPost({
				query: { query_string: { query: '파랗게', default_operator: 'and' }},
				sort:[{cdate : "asc"}]
			},
			function (err, res) {
				res.status.should.equal(200);
				res.body.hits.total.should.equal(2);
				res.body.hits.hits[0]._id.should.equal(doc[2].post._id);
				res.body.hits.hits[1]._id.should.equal(doc[4].post._id);
				next(err);
			}
		);
	});
	it('can search hangul 3', function (next) {
		l.es.searchPost({
				query: { query_string: { query: '파랗게 말똥이', default_operator: 'and' }},
				sort:[{cdate : "asc"}]
			},
			function (err, res) {
				res.status.should.equal(200);
				res.body.hits.total.should.equal(1);
				res.body.hits.hits[0]._id.should.equal(doc[4].post._id);
				next(err);
			}
		);
	});
});
