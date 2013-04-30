var should = require('should');

var init = require('../main/init');
var config = require('../main/config')({ test: true });
var es = require('../main/es')({ dropIndex: true });

before(function (next) {
	init.run(next);
});

var docs = [
	{
		thread: {
			_id: 1000, categoryId: 101, created: new Date(2000, 1, 1),
			title: 'hello world'
		},
		post: {
			_id: 700, created: new Date(2000, 1, 1),
			writer: 'snowman', text: 'apple pine banana'
		}
	},
	{
		thread: {
			_id: 1000, categoryId: 101, created: new Date(2000, 1, 1),
			title: 'hello world'
		},
		post: {
			_id: 701, created: new Date(2000, 1, 2),
			writer: 'snowman', text: 'apple pine orange'
		}
	},
	{
		thread: {
			_id: 1001, categoryId: 101, created: new Date(2000, 2, 1),
			title: '안녕하세요. 한글 테스트'
		},
		post: {
			_id: 703, created: new Date(2000, 2, 1),
			writer: '홍길동', text: '둥글게 네모나게 붉게 파랗게'
		}
	},
	{
		thread: {
			_id: 1002, categoryId: 101, created: new Date(2000, 3, 1),
			title: '안녕할까요. 한글 테스트'
		},
		post: {
			_id: 704, created: new Date(2000, 3, 1),
			writer: '개똥이', text: '둥글게 네모나게'
		}
	},
	{
		thread: {
			_id: 1003, categoryId: 101, created: new Date(2000, 4, 1),
			title: '강물엔 유람선이 떠있고'
		},
		post: {
			_id: 705, created: new Date(2000, 4, 1),
			writer: '말똥이', text: '둥글게 붉게 파랗게'
		}
	}
];

describe("searching empty db", function () {
	it("should success", function (next) {
		es.search({
			query: { query_string: { query: 'apple', default_operator: 'and' }},
			sort: [{ created : "asc" }]
		},
		function (err, res) {
			should.not.exist(err);
			should(!res.error);
			res.body.hits.total.should.equal(0);
			next();
		});
	});
});

describe("filling db", function () {
	it("should success", function (next) {
		var i = 0;
		var len = docs.length;
		(function insert() {
			if (i == len) {
				es.flush(next);
				return;
			};
			var doc = docs[i++];
			es.update(doc.thread, doc.post, function (err, res) {
				should.not.exist(err);
				should(res.statusCode == 201 || res.statusCode == 200);
				res.body.ok.should.true;
				setImmediate(insert);
			});
		})();
	});
});

describe("getPost", function () {
	it("should success for head", function (next) {
		var doc0 = docs[0];
		es.getPost(doc0.post._id, function (err, res) {
			should.not.exist(err);
			should(!res.error);
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
	it("should success for reply", function (next) {
		var doc1 = docs[1];
		es.getPost(doc1.post._id, function (err, res) {
			should.not.exist(err);
			should(!res.error);
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
});

describe("searching non-existing", function () {
	it("should success", function (next) {
		es.search({
			query: { query_string: { query: 'jifeoajfiefjs', default_operator: 'and' }},
			sort: [{ created : "asc" }]
		},
		function (err, res) {
			should.not.exist(err);
			should(!res.error);
			res.body.hits.total.should.equal(0);
			next();
		});
	});
});

describe("searching empty string", function () {
	it("should fail", function (next) {
		es.search({
				query: { query_string: { query: ' ', default_operator: 'and' }},
				sort: [{ created : "asc" }]
			},
			function (err, res) {
				should.exist(err);
				next();
			});
	});
});

describe("searching title", function () {
	it("should success", function (next) {
		es.search({
			query: { query_string: { query: 'hello', default_operator: 'and' }},
			sort: [{ created : "asc" }]
		},
		function (err, res) {
			should.not.exist(err);
			should(!res.error);
			res.body.hits.total.should.equal(1);
			res.body.hits.hits[0]._id.should.equal(docs[0].post._id);
			next();
		});
	});
});

describe("searching writer", function () {
	it("should success", function (next) {
		es.search({
				query: { query_string: { query: 'snowman', default_operator: 'and' }},
				sort: [{ created : "asc" }]
			},
			function (err, res) {
				should.not.exist(err);
				should(!res.error);
				res.body.hits.total.should.equal(2);
				res.body.hits.hits[0]._id.should.equal(docs[0].post._id);
				res.body.hits.hits[1]._id.should.equal(docs[1].post._id);
				next();
			});
	});
});

describe("searching apple in text", function () {
	it("should success", function (next) {
		es.search({
				query: { query_string: { query: 'apple', default_operator: 'and' }},
				sort: [{ created : "asc" }]
			},
			function (err, res) {
				should.not.exist(err);
				should(!res.error);
				res.body.hits.total.should.equal(2);
				res.body.hits.hits[0]._id.should.equal(docs[0].post._id);
				res.body.hits.hits[1]._id.should.equal(docs[1].post._id);
				next(err);
			});
	});
});

describe("searching orange in text", function () {
	it("should success", function (next) {
		es.search({
				query: { query_string: { query: 'orange', default_operator: 'and' }},
				sort:[{ created : "asc" }]
			},
			function (err, res) {
				should.not.exist(err);
				should(!res.error);
				res.body.hits.total.should.equal(1);
				res.body.hits.hits[0]._id.should.equal(docs[1].post._id);
				next();
			});
	});
});

describe("searching two words", function () {
	it("should success", function (next) {
		es.search({
			query: { query_string: { query: 'apple orange', default_operator: 'and' }},
			sort: [{ created : "asc" }]
		},
		function (err, res) {
			should.not.exist(err);
			should(!res.error);
			res.body.hits.total.should.equal(1);
			res.body.hits.hits[0]._id.should.equal(docs[1].post._id);
			next();
		});
	});
});

describe("searching order by desc", function () {
	it("should success", function (next) {
		es.search({
				query: { query_string: { query: '둥글게', default_operator: 'and' }},
				sort: [{ created : "desc" }]
			},
			function (err, res) {
				should.not.exist(err);
				should(!res.error);
				res.body.hits.hits.should.length(3);
				res.body.hits.hits[0]._id.should.equal(docs[4].post._id);
				res.body.hits.hits[1]._id.should.equal(docs[3].post._id);
				res.body.hits.hits[2]._id.should.equal(docs[2].post._id);
				next();
			});
	});
});

describe("searching results limit", function () {
	it("should work", function (next) {
		es.search({
			query: { query_string: { query: '둥글게', default_operator: 'and' }},
			sort: [{ created : "desc" }],
			size: 16,
			from: 1
		},
		function (err, res) {
			should.not.exist(err);
			should(!res.error);
			res.body.hits.hits.should.length(2);
			res.body.hits.hits[0]._id.should.equal(docs[3].post._id);
			res.body.hits.hits[1]._id.should.equal(docs[2].post._id);
			next(err);
		});
	});
});

describe("searching hangul", function () {
	it("should success", function (next) {
		es.search({
			query: { query_string: { query: '안녕', default_operator: 'and' }},
			sort:[{created : "asc"}]
		},
		function (err, res) {
			should.not.exist(err);
			should(!res.error);
			res.body.hits.total.should.equal(2);
			res.body.hits.hits[0]._id.should.equal(docs[2].post._id);
			res.body.hits.hits[1]._id.should.equal(docs[3].post._id);
			next();
		});
	});
	it("should success", function (next) {
		es.search({
			query: { query_string: { query: '파랗게', default_operator: 'and' }},
			sort:[{ created : "asc" }]
		},
		function (err, res) {
			should.not.exist(err);
			should(!res.error);
			res.body.hits.total.should.equal(2);
			res.body.hits.hits[0]._id.should.equal(docs[2].post._id);
			res.body.hits.hits[1]._id.should.equal(docs[4].post._id);
			next();
		});
	});
	it("should success", function (next) {
		es.search({
			query: { query_string: { query: '파랗게 말똥이', default_operator: 'and' }},
			sort: [{ created : 'asc' }]
		},
		function (err, res) {
			should.not.exist(err);
			should(!res.error);
			res.body.hits.total.should.equal(1);
			res.body.hits.hits[0]._id.should.equal(docs[4].post._id);
			next();
		});
	});
});
