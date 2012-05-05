var _ = require('underscore');
var should = require('should');
var path = require('path');

var l = require('../main/l.js');
var msg = require('../main/msg.js');
var upload = require('../main/upload.js');
var test = require('../main/test.js');

before(function (next) {
	test.prepare('config,mongo,es,express', next);
});

describe('post upload file', function () {
	it('assume user', function (next) {
		test.request.post('/api/login', { password: '1' }, next);
	});
	var tid1, pid11, pid12;
	it('prepare head', function (next) {
		test.request.post('/api/thread',
			{ categoryId: 101, userName : 'snowman', title: 'title 1', text: 'head text 1' },
			function (err, res) {
				res.status.should.equal(200);
				tid1 = res.body.threadId;
				pid11 = res.body.postId;
				next(err);
			}
		);
	});
	var tmp;
	it('can upload file1.txt, file2.txt', function (next) {
		test.request.post('/api/file', {}, ['file1.txt', 'file2.txt'],
			function (err, res) {
				res.status.should.equal(200);
				tmp = res.body;
				should(upload.tmpFileExists(tmp[0].tmp));
				should(upload.tmpFileExists(tmp[1].tmp));
				next(err);
			}
		);
	});
	it('can create post with upload', function (next) {
		test.request.post('/api/thread/' + tid1,
			{ userName : 'snowman', text: 'reply text 1', file: tmp },
			function (err, res) {
				res.status.should.equal(200);
				pid12 = res.body.postId;
				should(upload.postFileExists(pid12, 'file1.txt'));
				should(upload.postFileExists(pid12, 'file2.txt'));
				next(err);
			}
		);
	});
	it('can delete file1.txt', function (next) {
		test.request.put('/api/thread/' + tid1 + '/' + pid12,
			{ userName: 'snowman', text: 'reply text', delFile: ['file1.txt'] },
			function (err, res) {
				res.status.should.equal(200);
				should(!upload.postFileExists(pid12, 'file1.txt'));
				should(upload.postFileExists(pid12, 'file2.txt'));
				next(err);
			}
		);
	});
	it('can upload file1.txt', function (next) {
		test.request.post('/api/file', {}, ['file1.txt'],
			function (err, res) {
				res.status.should.equal(200);
				tmp = res.body;
				next(err);
			}
		);
	});
	it('can update with file1.txt', function (next) {
		test.request.put('/api/thread/' + tid1 + '/' + pid12,
			{ userName: 'snowman', text: 'reply text', file: tmp },
			function (err, res) {
				res.status.should.equal(200);
				should(upload.postFileExists(pid12, 'file1.txt'));
				should(upload.postFileExists(pid12, 'file2.txt'));
				next(err);
			}
		);
	});
	it('can delete file1.txt and file2.txt', function (next) {
		test.request.put('/api/thread/' + tid1 + '/' + pid12,
			{ userName: 'snowman', text: 'reply text', delFile: ['file1.txt', 'file2.txt'] },
			function (err, res) {
				res.status.should.equal(200);
				should(!upload.postFileExists(pid12, 'file1.txt'));
				should(!upload.postFileExists(pid12, 'file2.txt'));
				next(err);
			}
		);
	});
	it('can update with not existing tmp', function (next) {
		test.request.put('/api/thread/' + tid1 + '/' + pid12,
			{ userName: 'snowman', text: 'reply text', file: [{ org: 'abc.txt', tmp: 'xxxxxxxx' }] },
			function (err, res) {
				res.status.should.equal(200);
				next(err);
			}
		);
	});
	it('can upload file3.txt', function (next) {
		test.request.post('/api/file', {}, ['file3.txt'],
			function (err, res) {
				res.status.should.equal(200);
				tmp = res.body;
				next(err);
			}
		);
	});
	it('can update with invalid file name', function (next) {
		tmp[0].org = './../.../newName.txt';
		test.request.put('/api/thread/' + tid1 + '/' + pid12,
			{ userName: 'snowman', text: 'reply text', file: tmp },
			function (err, res) {
				res.status.should.equal(200);
				should(upload.postFileExists(pid12, 'newName.txt'));
				next(err);
			}
		);
	});
	it('can upload file4.txt', function (next) {
		test.request.post('/api/file', {}, ['file4.txt'],
			function (err, res) {
				res.status.should.equal(200);
				tmp = res.body;
				next(err);
			}
		);
	});
	it('can update with invalid file name 2', function (next) {
		tmp[0].org = './../.../mygod#1 그리고 한글.txt';
		test.request.put('/api/thread/' + tid1 + '/' + pid12,
			{ userName: 'snowman', text: 'reply text', file: tmp },
			function (err, res) {
				res.status.should.equal(200);
				should(upload.postFileExists(pid12, 'mygod#1 그리고 한글.txt'));
				next(err);
			}
		);
	});
	it('can upload file5.txt', function (next) {
		test.request.post('/api/file', {}, ['file4.txt'],
			function (err, res) {
				res.status.should.equal(200);
				tmp = res.body;
				next(err);
			}
		);
	});
	it('can update with invalid file name 3', function (next) {
		tmp[0].org = './../.../mygod#2 :?<>|.txt';
		test.request.put('/api/thread/' + tid1 + '/' + pid12,
			{ userName: 'snowman', text: 'reply text', file: tmp },
			function (err, res) {
				res.status.should.equal(200);
				should(upload.postFileExists(pid12, 'mygod#2 _____.txt'));
				next(err);
			}
		);
	});
});

