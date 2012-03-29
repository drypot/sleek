var _ = require('underscore');
var should = require('should');
var async = require('async');

var l = require('../main/l');
var mongo = require('../main/mongo.js');
var upload = require('../main/upload.js');
var test = require('../main/test.js');

before(function (next) {
	test.prepare('config,mongo', next);
})

describe('upload/post', function () {
	var post = {
		threadId: 1010, cdate: new Date(20), visible: true,
		userName : 'snowman', text: 'cool post 22'
	};
	before(function () {
		post._id =  mongo.getNewPostId();
	})
	it('can save file', function (next) {
		var file = [
			{size: 10, name: '1.jpg', __skip:true},
			{size: 10, name: '2.jpg', __skip:true},
			{size: 10, name: '3.jpg', __skip:true}
		];
		upload.savePostFile(post, file, function (err) {
			post.file.should.length(3);
			post.file.should.include('1.jpg');
			post.file.should.include('2.jpg');
			post.file.should.include('3.jpg');
			next();
		});
	});
	it('can delete file', function (next) {
		var delFile = ['2.jpg', '3.jpg', '4.jpg'];
		upload.deletePostFile(post, delFile, function (err) {
			post.file.should.length(1);
			post.file.should.include('1.jpg');
			next(err);
		});
	});
	it('can delete all', function (next) {
		var delFile = ['1.jpg', '2.jpg'];
		upload.deletePostFile(post, delFile, function (err) {
			should(!post.file);
			next(err);
		});
	});
});