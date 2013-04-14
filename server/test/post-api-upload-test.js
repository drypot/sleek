var _ = require('underscore');
var should = require('should');
var path = require('path');
var l = require('../main/l');

require('../main/session-api');
require('../main/upload-api');
require('../main/post-api');
require('../main/test');

before(function (next) {
	l.init.run(next);
});

describe('uploading post file', function () {
	it('given user session', function (next) {
		request.post(url + '/api/sessions', { password: '1' }, next);
	});
	var t1, p11, p12;
	it('and head', function (next) {
		request.post(url + '/api/threads',
			{ categoryId: 101, writer: 'snowman', title: 'title 1', text: 'head text 1' },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
				t1 = res.body.threadId;
				p11 = res.body.postId;
				next(err);
			}
		);
	});
	var tmpFiles;
	it('and file1.txt, file2.txt upload', function (next) {
		request.post(url + '/api/upload', {}, ['file1.txt', 'file2.txt'],
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
				tmpFiles = res.body.tmpFiles;
				should.exist(tmpFiles['file1.txt']);
				should.exist(tmpFiles['file2.txt']);
				next(err);
			}
		);
	});
	it('when creating post with upload, upload files must be saved', function (next) {
		request.post(url + '/api/threads/' + t1,
			{ writer: 'snowman', text: 'reply text 1', tmpFiles: tmpFiles },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
				p12 = res.body.postId;
				l.upload.postFileExists(p12, 'file1.txt').should.be.true;
				l.upload.postFileExists(p12, 'file2.txt').should.be.true;
				next(err);
			}
		);
	});
	it('and get post response should have file field', function (next) {
		request.get(test.url + '/api/threads/' + t1 + '/' + p12, function (err, res) {
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.post.upload[0].name.should.equal('file1.txt');
			res.body.post.upload[0].url.should.equal(l.upload.postFileUrl(p12, 'file1.txt'));
			res.body.post.upload[1].name.should.equal('file2.txt');
			res.body.post.upload[1].url.should.equal(l.upload.postFileUrl(p12, 'file2.txt'));
			next(err);
		});
	});
	it('when delFiles file1.txt, file1.txt should be gone', function (next) {
		request.put('/api/threads/' + t1 + '/' + p12,
			{ writer: 'snowman', text: 'reply text', delFiles: ['file1.txt'] },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
				l.upload.postFileExists(p12, 'file1.txt').should.be.false;
				l.upload.postFileExists(p12, 'file2.txt').should.be.true;
				next(err);
			}
		);
	});
	it('given file1.txt re-upload', function (next) {
		request.post(url + '/api/upload', {}, ['file1.txt'],
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
				tmpFiles = res.body.tmpFiles;
				next(err);
			}
		);
	});
	it('when updating post with file1.txt, post should have file1.txt again', function (next) {
		request.put('/api/threads/' + t1 + '/' + p12,
			{ writer: 'snowman', text: 'reply text', tmpFiles: tmpFiles },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
				l.upload.postFileExists(p12, 'file1.txt').should.be.true;
				l.upload.postFileExists(p12, 'file2.txt').should.be.true;
				next(err);
			}
		);
	});
	it('when deleting file1.txt and file2.txt, they should be gone', function (next) {
		request.put('/api/threads/' + t1 + '/' + p12,
			{ writer: 'snowman', text: 'reply text', delFiles: ['file1.txt', 'file2.txt'] },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
				l.upload.postFileExists(p12, 'file1.txt').should.be.false;
				l.upload.postFileExists(p12, 'file2.txt').should.be.false;
				next(err);
			}
		);
	});
	it('when updating post with non existing upload, should success', function (next) {
		request.put('/api/threads/' + t1 + '/' + p12,
			{ writer: 'snowman', text: 'reply text', tmpFiles: [{ name: 'abc.txt', tmpName: 'xxxxxxxx' }] },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
				next(err);
			}
		);
	});
	it('given file3.txt upload', function (next) {
		request.post(url + '/api/upload', {}, ['file3.txt'],
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
				tmpFiles = res.body.tmpFiles;
				next(err);
			}
		);
	});
	it('when updating with invalid file name, should success', function (next) {
		tmpFiles['./../.../newName.txt'] = tmpFiles['file3.txt'];
		delete tmpFiles['file3.txt'];
		request.put('/api/threads/' + t1 + '/' + p12,
			{ writer: 'snowman', text: 'reply text', tmpFiles: tmpFiles },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
				l.upload.postFileExists(p12, 'newName.txt').should.be.true;
				next(err);
			}
		);
	});
	it('given file4.txt upload', function (next) {
		request.post(url + '/api/upload', {}, ['file4.txt'],
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
				tmpFiles = res.body.tmpFiles;
				next(err);
			}
		);
	});
	it('when updating with invalid file name 2, should success', function (next) {
		tmpFiles['./../.../mygod#1 그리고 한글.txt'] = tmpFiles['file4.txt'];
		delete tmpFiles['file4.txt'];
		request.put('/api/threads/' + t1 + '/' + p12,
			{ writer: 'snowman', text: 'reply text', tmpFiles: tmpFiles },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
				l.upload.postFileExists(p12, 'mygod#1 그리고 한글.txt').should.be.true;
				next(err);
			}
		);
	});
	it('given file4.txt upload', function (next) {
		request.post(url + '/api/upload', {}, ['file4.txt'],
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
				tmpFiles = res.body.tmpFiles;
				next(err);
			}
		);
	});
	it('when updating with invalid file name 3, should success', function (next) {
		tmpFiles['./../.../mygod#2 :?<>|.txt'] = tmpFiles['file4.txt'];
		delete tmpFiles['file4.txt'];
		request.put('/api/threads/' + t1 + '/' + p12,
			{ writer: 'snowman', text: 'reply text', tmpFiles: tmpFiles },
			function (err, res) {
				res.status.should.equal(200);
				res.body.rc.should.equal(rcs.SUCCESS);
				should(l.upload.postFileExists(p12, 'mygod#2 _____.txt'));
				next(err);
			}
		);
	});
});
