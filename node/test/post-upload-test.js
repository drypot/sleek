var _ = require('underscore');
var should = require('should');
var path = require('path');
var l = require('../main/l.js');

require('../main/session.js');
require('../main/upload.js');
require('../main/post.js');
require('../main/test.js');

before(function (next) {
	l.init.run(next);
});

describe('uploading post file', function () {
	it('given user session', function (next) {
		l.test.request.post('/api/session', { password: '1' }, next);
	});
	var t1, p11, p12;
	it('and head', function (next) {
		l.test.request.post('/api/thread',
			{ categoryId: 101, writer : 'snowman', title: 'title 1', text: 'head text 1' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				t1 = res.body.threadId;
				p11 = res.body.postId;
				next(err);
			}
		);
	});
	var uploadTmp;
	it('and file1.txt, file2.txt upload', function (next) {
		l.test.request.post('/api/upload', {}, ['file1.txt', 'file2.txt'],
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				uploadTmp = res.body.uploadTmp;
				l.upload.existsTmp(uploadTmp[0].tmpName).should.be.true;
				l.upload.existsTmp(uploadTmp[1].tmpName).should.be.true;
				next(err);
			}
		);
	});
	it('when creating post with upload, upload files must be saved', function (next) {
		l.test.request.post('/api/thread/' + t1,
			{ writer : 'snowman', text: 'reply text 1', uploadTmp: uploadTmp },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				p12 = res.body.postId;
				l.upload.postUploadExists(p12, 'file1.txt').should.be.true;
				l.upload.postUploadExists(p12, 'file2.txt').should.be.true;
				next(err);
			}
		);
	});
	it('and get post response should have file field', function (next) {
		l.test.request.get('/api/thread/' + t1 + '/' + p12, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(l.rc.SUCCESS);
			res.body.upload[0].name.should.equal('file1.txt');
			res.body.upload[0].url.should.equal(l.upload.postUploadUrl(p12, 'file1.txt'));
			res.body.upload[1].name.should.equal('file2.txt');
			res.body.upload[1].url.should.equal(l.upload.postUploadUrl(p12, 'file2.txt'));
			next(err);
		});
	});
	it('when deleting file1.txt, file1.txt should be gone', function (next) {
		l.test.request.put('/api/thread/' + t1 + '/' + p12,
			{ writer: 'snowman', text: 'reply text', deleting: ['file1.txt'] },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				l.upload.postUploadExists(p12, 'file1.txt').should.be.false;
				l.upload.postUploadExists(p12, 'file2.txt').should.be.true;
				next(err);
			}
		);
	});
	it('given file1.txt re-upload', function (next) {
		l.test.request.post('/api/upload', {}, ['file1.txt'],
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				uploadTmp = res.body.uploadTmp;
				next(err);
			}
		);
	});
	it('when updating post with file1.txt, post should have file1.txt again', function (next) {
		l.test.request.put('/api/thread/' + t1 + '/' + p12,
			{ writer: 'snowman', text: 'reply text', uploadTmp: uploadTmp },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				l.upload.postUploadExists(p12, 'file1.txt').should.be.true;
				l.upload.postUploadExists(p12, 'file2.txt').should.be.true;
				next(err);
			}
		);
	});
	it('when deleting file1.txt and file2.txt, they should be gone', function (next) {
		l.test.request.put('/api/thread/' + t1 + '/' + p12,
			{ writer: 'snowman', text: 'reply text', deleting: ['file1.txt', 'file2.txt'] },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				l.upload.postUploadExists(p12, 'file1.txt').should.be.false;
				l.upload.postUploadExists(p12, 'file2.txt').should.be.false;
				next(err);
			}
		);
	});
	it('when updating post with non existing upload, should success', function (next) {
		l.test.request.put('/api/thread/' + t1 + '/' + p12,
			{ writer: 'snowman', text: 'reply text', uploadTmp: [{ name: 'abc.txt', tmpName: 'xxxxxxxx' }] },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				next(err);
			}
		);
	});
	it('given file3.txt upload', function (next) {
		l.test.request.post('/api/upload', {}, ['file3.txt'],
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				uploadTmp = res.body.uploadTmp;
				next(err);
			}
		);
	});
	it('when updating with invalid file name, should success', function (next) {
		uploadTmp[0].name = './../.../newName.txt';
		l.test.request.put('/api/thread/' + t1 + '/' + p12,
			{ writer: 'snowman', text: 'reply text', uploadTmp: uploadTmp },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				l.upload.postUploadExists(p12, 'newName.txt').should.be.true;
				next(err);
			}
		);
	});
	it('given file4.txt upload', function (next) {
		l.test.request.post('/api/upload', {}, ['file4.txt'],
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				uploadTmp = res.body.uploadTmp;
				next(err);
			}
		);
	});
	it('when updating with invalid file name 2, should success', function (next) {
		uploadTmp[0].name = './../.../mygod#1 그리고 한글.txt';
		l.test.request.put('/api/thread/' + t1 + '/' + p12,
			{ writer: 'snowman', text: 'reply text', uploadTmp: uploadTmp },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				l.upload.postUploadExists(p12, 'mygod#1 그리고 한글.txt').should.be.true;
				next(err);
			}
		);
	});
	it('given file4.txt upload', function (next) {
		l.test.request.post('/api/upload', {}, ['file4.txt'],
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				uploadTmp = res.body.uploadTmp;
				next(err);
			}
		);
	});
	it('when updating with invalid file name 3, should success', function (next) {
		uploadTmp[0].name = './../.../mygod#2 :?<>|.txt';
		l.test.request.put('/api/thread/' + t1 + '/' + p12,
			{ writer: 'snowman', text: 'reply text', uploadTmp: uploadTmp },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(l.rc.SUCCESS);
				should(l.upload.postUploadExists(p12, 'mygod#2 _____.txt'));
				next(err);
			}
		);
	});
});
