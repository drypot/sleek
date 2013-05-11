var should = require('should');
var fs = require('fs');

var l = require('../main/l');
var init = require('../main/init');
var fs2 = require('../main/fs');
var config = require('../main/config')({ test: true });
var mongo = require('../main/mongo')({ dropDatabase: true });
var upload = require('../main/upload');
var es = require('../main/es')({ dropIndex: true });
var express = require('../main/express');
var post = require('../main/post');
var error = require('../main/error');
var ufix = require('../test/user-fixture');

require('../main/session-api');
require('../main/post-api');

before(function (next) {
	fs2.emptyDir('tmp', next);
});

before(function (next) {
	init.run(next);
});

before(function () {
	express.listen();
});

var dummy1 = 'server/test/fixture/dummy1.txt';
var dummy2 = 'server/test/fixture/dummy2.txt';
var dummy3 = 'server/test/fixture/dummy3.txt';

require('superagent').Request.prototype.fields = function (obj) {
	for(var key in obj) {
		this.field(key, String(obj[key]));
	}
	return this;
}

function findFile(files, filename) {
	return l.find(files, function (file) {
		return file.name == filename;
	});
}

function fileExists(pid, fname) {
	return fs.existsSync(post.filePath(pid) + '/' + fname);
}

var files, tid1, pid1;

describe("creating thread", function () {
	it("given user session", function (next) {
		ufix.loginUser(next);
	});
	it("should success", function (next) {
		var form = { cid: 101, title: 't', writer: 'w', text: 't' };
		express.post('/api/threads').send(form).end(function (err, res) {
			should(!err);
			should(!res.error);
			should(!res.body.err);
			tid1 = res.body.tid;
			next();
		});
	});
});

describe("saving files", function () {
	it("should success", function (next) {
		var form = { cid: 101, title: 't', writer: 'w', text: 't' };
		express.post('/api/threads/' + tid1).fields(form).attach('file', dummy1).attach('file', dummy2).end(function (err, res) {
			should(!res.error);
			should(!res.body.err);
			pid1 = res.body.pid;
			fileExists(pid1, 'dummy1.txt').should.be.true;
			fileExists(pid1, 'dummy2.txt').should.be.true;
			next();
		});
	});
	it("can be confirmed", function (next) {
		express.get('/api/threads/' + tid1 + '/' + pid1, function (err, res) {
			should(!res.error);
			should(!res.body.err);
			var files = res.body.post.files;
			files.should.length(2);
			files[0].should.property('name', 'dummy1.txt');
			files[0].should.property('url')
			files[1].should.property('name', 'dummy2.txt');
			files[1].should.property('url')
			next();
		});
	});
});

describe("deleting files", function () {
	it("should success", function (next) {
		var form = { writer: 'w', text: 't', delFiles: [ 'dummy1.txt' ] };
		express.put('/api/threads/' + tid1 + '/' + pid1).send(form).end(function (err, res) {
			should(!res.error);
			should(!res.body.err);
			fileExists(pid1, 'dummy1.txt').should.be.false;
			fileExists(pid1, 'dummy2.txt').should.be.true;
			next();
		});
	});
	it("can be confirmed", function (next) {
		express.get('/api/threads/' + tid1 + '/' + pid1, function (err, res) {
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
	it("should success", function (next) {
		var form = { writer: 'w', text: 't' };
		express.put('/api/threads/' + tid1 + '/' + pid1).fields(form).attach('file', dummy3).end(function (err, res) {
			should(!res.error);
			should(!res.body.err);
			fileExists(pid1, 'dummy2.txt').should.be.true;
			fileExists(pid1, 'dummy3.txt').should.be.true;
			next();
		});
	});
	it("can be confirmed", function (next) {
		express.get('/api/threads/' + tid1 + '/' + pid1, function (err, res) {
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
		express.put('/api/threads/' + tid1 + '/' + pid1).send(form).end(function (err, res) {
			should(!res.error);
			should(!res.body.err);
			fileExists(pid1, 'dummy2.txt').should.be.false;
			fileExists(pid1, 'dummy3.txt').should.be.false;
			next();
		});
	});
	it("can be confirmed", function (next) {
		express.get('/api/threads/' + tid1 + '/' + pid1, function (err, res) {
			should(!res.error);
			should(!res.body.err);
			should(!res.body.post.files);
			next();
		});
	});
});
