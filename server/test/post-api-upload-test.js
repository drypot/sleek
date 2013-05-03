var should = require('should');
var request = require('superagent').agent();

var init = require('../main/init');
var config = require('../main/config').options({ test: true });
var mongo = require('../main/mongo').options({ dropDatabase: true });
var es = require('../main/es').options({ dropIndex: true });
var upload = require('../main/upload');
var express = require('../main/express');
var error = require('../main/error');
var test = require('../main/test').options({ request: request });

require('../main/session-api');
require('../main/post-api');
require('../main/upload-api');

before(function (next) {
	init.run(next);
});

before(function () {
	express.listen();
});

var t1, p1, files;

describe("preparing t1", function () {
	it("given user session", function (next) {
		test.loginUser(next);
	});
	it("should success", function (next) {
		var form = { categoryId: 101, writer: 'snowman', title: 'title', text: 'text' };
		request.post(test.url + '/api/threads').send(form).end(function (err, res) {
			should.not.exist(res.error);
			should.not.exist(res.body.err);
			t1 = res.body.threadId;
			next();
		});
	});
});

describe("saving dummy.txt, dummy2.txt", function () {
	it("given dummy.txt, dummy2.txt", function (next) {
		request
			.post(test.url + '/api/upload')
			.attach('file', 'server/test/fixture/dummy.txt')
			.attach('file', 'server/test/fixture/dummy2.txt')
			.end(function (err, res) {
				should.not.exist(res.error);
				should.not.exist(res.body.err);
				files = res.body.files;
				files.should.have.property('dummy.txt');
				files.should.have.property('dummy2.txt');
				next();
			}
		);
	});
	it("should success", function (next) {
		var form = { writer: 'snowman', text: 'text', files: files };
		request.post(test.url + '/api/threads/' + t1).send(form).end(function (err, res) {
			should.not.exist(res.error);
			should.not.exist(res.body.err);
			p1 = res.body.postId;
			upload.postFileExists(p1, 'dummy.txt').should.be.true;
			upload.postFileExists(p1, 'dummy2.txt').should.be.true;
			request.get(test.url + '/api/threads/' + t1 + '/' + p1, function (err, res) {
				should.not.exist(res.error);
				should.not.exist(res.body.err);
				res.body.post.files.should.length(2);
				res.body.post.files[0].name.should.equal('dummy.txt');
				res.body.post.files[0].should.have.property('url')
				res.body.post.files[1].name.should.equal('dummy2.txt');
				res.body.post.files[1].should.have.property('url')
				next();
			});
		});
	});
	describe("deleting dummy.txt", function () {
		it("should success", function (next) {
			var form = { writer: 'snowman', text: 'text', delFiles: [ 'dummy.txt' ] };
			request.put(test.url + '/api/threads/' + t1 + '/' + p1).send(form).end(function (err, res) {
				should.not.exist(res.error);
				should.not.exist(res.body.err);
				upload.postFileExists(p1, 'dummy.txt').should.be.false;
				upload.postFileExists(p1, 'dummy2.txt').should.be.true;
				request.get(test.url + '/api/threads/' + t1 + '/' + p1, function (err, res) {
					should.not.exist(res.error);
					should.not.exist(res.body.err);
					res.body.post.files.should.length(1);
					res.body.post.files[0].name.should.equal('dummy2.txt');
					res.body.post.files[0].should.have.property('url')
					next();
				});
			});
		});
	});
	describe("saving dummy3.txt again", function () {
		it("given dummy3.txt", function (next) {
			request
				.post(test.url + '/api/upload')
				.attach('file', 'server/test/fixture/dummy3.txt')
				.end(function (err, res) {
					should.not.exist(res.error);
					should.not.exist(res.body.err);
					files = res.body.files;
					next();
				}
			);
		});
		it("should success", function (next) {
			var form = { writer: 'snowman', text: 'text', files: files };
			request.put(test.url + '/api/threads/' + t1 + '/' + p1).send(form).end(function (err, res) {
				should.not.exist(res.error);
				should.not.exist(res.body.err);
				upload.postFileExists(p1, 'dummy2.txt').should.be.true;
				upload.postFileExists(p1, 'dummy3.txt').should.be.true;
				request.get(test.url + '/api/threads/' + t1 + '/' + p1, function (err, res) {
					should.not.exist(res.error);
					should.not.exist(res.body.err);
					res.body.post.files.should.length(2);
					next();
				});
			});
		});
	});
	describe("deleting dummy2.txt, dummy3.txt", function () {
		it("should success", function (next) {
			var form = { writer: 'snowman', text: 'text', delFiles: [ 'dummy2.txt', 'dummy3.txt' ] };
			request.put(test.url + '/api/threads/' + t1 + '/' + p1).send(form).end(function (err, res) {
				should.not.exist(res.error);
				should.not.exist(res.body.err);
				upload.postFileExists(p1, 'dummy2.txt').should.be.false;
				upload.postFileExists(p1, 'dummy3.txt').should.be.false;
				request.get(test.url + '/api/threads/' + t1 + '/' + p1, function (err, res) {
					should.not.exist(res.error);
					should.not.exist(res.body.err);
					should.not.exists(res.body.post.files);
					next();
				});
			});
		});
	});
});

describe("saving non-existing file", function () {
	it("should success", function (next) {
		var form = { writer: 'snowman', text: 'text', files: { 'abc.txt': 'xxxxxxxx' } };
		request.post(test.url + '/api/threads/' + t1).send(form).end(function (err, res) {
			should.not.exist(res.error);
			should.not.exist(res.body.err);
			next();
		});
	});
});

describe("saving file with invalid name", function () {
	it("given dummy.txt upload", function (next) {
		request
			.post(test.url + '/api/upload')
			.attach('file', 'server/test/fixture/dummy.txt')
			.end(function (err, res) {
				should.not.exist(res.error);
				should.not.exist(res.body.err);
				files = res.body.files;
				next();
			}
		);
	});
	it("should success", function (next) {
		var form = { writer: 'snowman', text: 'text', files: { './../.../newName.txt': files['dummy.txt'] } };
		request.post(test.url + '/api/threads/' + t1).send(form).end(function (err, res) {
			should.not.exist(res.error);
			should.not.exist(res.body.err);
			p1 = res.body.postId;
			upload.postFileExists(p1, 'newName.txt').should.be.true;
			request.get(test.url + '/api/threads/' + t1 + '/' + p1, function (err, res) {
				should.not.exist(res.error);
				should.not.exist(res.body.err);
				res.body.post.files.should.length(1);
				res.body.post.files[0].name.should.equal('newName.txt');
				res.body.post.files[0].should.have.property('url')
				next();
			});
		});
	});
});

describe("saving file with invalid name 2", function () {
	it("given dummy.txt upload", function (next) {
		request
			.post(test.url + '/api/upload')
			.attach('file', 'server/test/fixture/dummy.txt')
			.end(function (err, res) {
				should.not.exist(res.error);
				should.not.exist(res.body.err);
				files = res.body.files;
				next();
			}
		);
	});
	it("should success", function (next) {
		var form = { writer: 'snowman', text: 'text', files: { './../.../mygod#1 그리고 한글.txt': files['dummy.txt'] } };
		request.post(test.url + '/api/threads/' + t1).send(form).end(function (err, res) {
			should.not.exist(res.error);
			should.not.exist(res.body.err);
			p1 = res.body.postId;
			upload.postFileExists(p1, 'mygod#1 그리고 한글.txt').should.be.true;
			request.get(test.url + '/api/threads/' + t1 + '/' + p1, function (err, res) {
				should.not.exist(res.error);
				should.not.exist(res.body.err);
				res.body.post.files.should.length(1);
				res.body.post.files[0].name.should.equal('mygod#1 그리고 한글.txt');
				res.body.post.files[0].should.have.property('url')
				next();
			});
		});
	});
});

describe("saving file with invalid name 3", function () {
	it("given dummy.txt upload", function (next) {
		request
			.post(test.url + '/api/upload')
			.attach('file', 'server/test/fixture/dummy.txt')
			.end(function (err, res) {
				should.not.exist(res.error);
				should.not.exist(res.body.err);
				files = res.body.files;
				next();
			}
		);
	});
	it("should success", function (next) {
		var form = { writer: 'snowman', text: 'text', files: { './../.../mygod#2 :?<>|.txt': files['dummy.txt'] } };
		request.post(test.url + '/api/threads/' + t1).send(form).end(function (err, res) {
			should.not.exist(res.error);
			should.not.exist(res.body.err);
			p1 = res.body.postId;
			upload.postFileExists(p1, 'mygod#2 _____.txt').should.be.true;
			request.get(test.url + '/api/threads/' + t1 + '/' + p1, function (err, res) {
				should.not.exist(res.error);
				should.not.exist(res.body.err);
				res.body.post.files.should.length(1);
				res.body.post.files[0].name.should.equal('mygod#2 _____.txt');
				res.body.post.files[0].should.have.property('url')
				next();
			});
		});
	});
});

