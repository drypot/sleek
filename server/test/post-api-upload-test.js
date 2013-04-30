var should = require('should');
var request = require('superagent').agent();

var l = require('../main/l');
var init = require('../main/init');
var config = require('../main/config')({ test: true });
var mongo = require('../main/mongo')({ dropDatabase: true });
var es = require('../main/es')({ dropIndex: true });
var upload = require('../main/upload');
var express = require('../main/express');
var error = require('../main/error');
var test = require('../main/test')({ request: request });

require('../main/session-api');
require('../main/post-api');
require('../main/upload-api');

before(function (next) {
	init.run(next);
});

before(function () {
	express.listen();
});

var dummy = 'server/test/fixture/dummy.txt';
var dummy2 = 'server/test/fixture/dummy2.txt';
var dummy3 = 'server/test/fixture/dummy3.txt';

function findFile(files, filename) {
	return l.find(files, function (file) {
		return file.name == filename;
	});
}

var files, t1, p1;

describe("creating thread", function () {
	it("given user session", function (next) {
		test.loginUser(next);
	});
	it("should success", function (next) {
		var form = { categoryId: 101, title: 't', writer: 'w', text: 't' };
		request.post(test.url + '/api/threads').send(form).end(function (err, res) {
			should(!err);
			should(!res.error);
			should(!res.body.err);
			t1 = res.body.threadId;
			next();
		});
	});
});

describe("saving files", function () {
	it("given dummy.txt, dummy3.txt", function (next) {
		request.post(test.url + '/api/upload').attach('file', dummy).attach('file', dummy2).end(function (err, res) {
			should(!res.error);
			should(!res.body.err);
			files = res.body.files;
			findFile(files, 'dummy.txt').should.be.ok;
			findFile(files, 'dummy2.txt').should.be.ok;
			next();
		});
	});
	it("should success", function (next) {
		var form = { categoryId: 101, title: 't', writer: 'w', text: 't', files: files };
		request.post(test.url + '/api/threads/' + t1).send(form).end(function (err, res) {
			should(!res.error);
			should(!res.body.err);
			p1 = res.body.postId;
			upload.postFileExists(p1, 'dummy.txt').should.be.true;
			upload.postFileExists(p1, 'dummy2.txt').should.be.true;
			next();
		});
	});
	it("can be confirmed", function (next) {
		request.get(test.url + '/api/threads/' + t1 + '/' + p1, function (err, res) {
			should(!res.error);
			should(!res.body.err);
			var files = res.body.post.files;
			files.should.length(2);
			files[0].should.property('name', 'dummy.txt');
			files[0].should.property('url')
			files[1].should.property('name', 'dummy2.txt');
			files[1].should.property('url')
			next();
		});
	});
});

describe("deleting files", function () {
	it("should success", function (next) {
		var form = { writer: 'w', text: 't', delFiles: [ 'dummy.txt' ] };
		request.put(test.url + '/api/threads/' + t1 + '/' + p1).send(form).end(function (err, res) {
			should(!res.error);
			should(!res.body.err);
			upload.postFileExists(p1, 'dummy.txt').should.be.false;
			upload.postFileExists(p1, 'dummy2.txt').should.be.true;
			next();
		});
	});
	it("can be confirmed", function (next) {
		request.get(test.url + '/api/threads/' + t1 + '/' + p1, function (err, res) {
			should(!res.error);
			should(!res.body.err);
			var files = res.body.post.files;
			files.should.length(1);
			files[0].should.property('name', 'dummy2.txt');
			files[0].should.property('url')
			next();
		});
	});
});

describe("appending files", function () {
	it("given dummy3.txt", function (next) {
		request.post(test.url + '/api/upload').attach('file', dummy3).end(function (err, res) {
			should(!res.error);
			should(!res.body.err);
			files = res.body.files;
			next();
		});
	});
	it("should success", function (next) {
		var form = { writer: 'w', text: 't', files: files };
		request.put(test.url + '/api/threads/' + t1 + '/' + p1).send(form).end(function (err, res) {
			should(!res.error);
			should(!res.body.err);
			upload.postFileExists(p1, 'dummy2.txt').should.be.true;
			upload.postFileExists(p1, 'dummy3.txt').should.be.true;
			next();
		});
	});
	it("can be confirmed", function (next) {
		request.get(test.url + '/api/threads/' + t1 + '/' + p1, function (err, res) {
			should(!res.error);
			should(!res.body.err);
			res.body.post.files.should.length(2);
			next();
		});
	});
});

describe("deleting again", function () {
	it("should success", function (next) {
		var form = { writer: 'w', text: 't', delFiles: [ 'dummy2.txt', 'dummy3.txt' ] };
		request.put(test.url + '/api/threads/' + t1 + '/' + p1).send(form).end(function (err, res) {
			should(!res.error);
			should(!res.body.err);
			upload.postFileExists(p1, 'dummy2.txt').should.be.false;
			upload.postFileExists(p1, 'dummy3.txt').should.be.false;
			next();
		});
	});
	it("can be confirmed", function (next) {
		request.get(test.url + '/api/threads/' + t1 + '/' + p1, function (err, res) {
			should(!res.error);
			should(!res.body.err);
			should(!res.body.post.files);
			next();
		});
	});
});

describe("saving non-existing file", function () {
	it("should success", function (next) {
		var form = { writer: 'w', text: 't', files: [{ name: 'abc.txt', tmpName: 'xxxxxxxx' }] };
		request.post(test.url + '/api/threads/' + t1).send(form).end(function (err, res) {
			should(!res.error);
			should(!res.body.err);
			next();
		});
	});
});

describe("saving file with invalid name", function () {
	it("given dummy.txt", function (next) {
		request.post(test.url + '/api/upload').attach('file', dummy).end(function (err, res) {
			should(!res.error);
			should(!res.body.err);
			files = res.body.files;
			next();
		});
	});
	it("should success", function (next) {
		var form = { writer: 'w', text: 't', files: files };
		files[0].name = './../.../newName.txt';
		request.post(test.url + '/api/threads/' + t1).send(form).end(function (err, res) {
			should(!res.error);
			should(!res.body.err);
			p1 = res.body.postId;
			upload.postFileExists(p1, 'newName.txt').should.be.true;
			next();
		});
	});
	it("can be confirmed", function (next) {
		request.get(test.url + '/api/threads/' + t1 + '/' + p1, function (err, res) {
			should(!res.error);
			should(!res.body.err);
			var files = res.body.post.files;
			files.should.length(1);
			files[0].should.property('name', 'newName.txt');
			files[0].should.property('url')
			next();
		});
	});
});

describe("saving file with invalid name 2", function () {
	it("given dummy.txt", function (next) {
		request.post(test.url + '/api/upload').attach('file', dummy).end(function (err, res) {
			should(!res.error);
			should(!res.body.err);
			files = res.body.files;
			next();
		});
	});
	it("should success", function (next) {
		var form = { writer: 'w', text: 't', files: files };
		files[0].name = './../.../mygod#1 그리고 한글.txt';
		request.post(test.url + '/api/threads/' + t1).send(form).end(function (err, res) {
			should(!res.error);
			should(!res.body.err);
			p1 = res.body.postId;
			upload.postFileExists(p1, 'mygod#1 그리고 한글.txt').should.be.true;
			next();
		});
	});
	it("can be confirmed", function (next) {
		request.get(test.url + '/api/threads/' + t1 + '/' + p1, function (err, res) {
			should(!res.error);
			should(!res.body.err);
			var files = res.body.post.files;
			files.should.length(1);
			files[0].should.property('name', 'mygod#1 그리고 한글.txt');
			files[0].should.property('url')
			next();
		});
	});
});

describe("saving file with invalid name 3", function () {
	it("given dummy.txt", function (next) {
		request.post(test.url + '/api/upload').attach('file', dummy).end(function (err, res) {
			should(!res.error);
			should(!res.body.err);
			files = res.body.files;
			next();
		});
	});
	it("should success", function (next) {
		var form = { writer: 'w', text: 't', files: files };
		files[0].name = './../.../mygod#2 :?<>|.txt';
		request.post(test.url + '/api/threads/' + t1).send(form).end(function (err, res) {
			should(!res.error);
			should(!res.body.err);
			p1 = res.body.postId;
			upload.postFileExists(p1, 'mygod#2 _____.txt').should.be.true;
			next();
		});
	});
	it("can be confirmed", function (next) {
		request.get(test.url + '/api/threads/' + t1 + '/' + p1, function (err, res) {
			should(!res.error);
			should(!res.body.err);
			res.body.post.files.should.length(1);
			res.body.post.files[0].should.property('name', 'mygod#2 _____.txt');
			res.body.post.files[0].should.property('url')
			next();
		});
	});
});

