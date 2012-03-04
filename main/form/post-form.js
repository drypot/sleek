var _ = require('underscore');
var _should = require('should');

var _lang = require('./../lang');
var _thread = require("./../model/thread");
var _post = require("./../model/post");

exports.make = function (req) {
	return new PostForm(req);
}

var PostForm = function (req) {
	this.now = new Date();
	this.threadId = threadId;
	this.postId = postId;
	this.categoryId = parseInt(body.categoryId || 0);
	this.userName = String(body.userName).trim();
	this.title = String(body.title).trim();
	this.text = String(body.text).trim();
	this.visible = Boolean(body.visible);
	this.delFiles = body.delFiles;
	this.files = files;
}

var form = PostForm.prototype;

form.validateThread = function (errors) {
	if (!this.title) errors.push({title: '제목을 입력해 주십시오.'});
	if (this.title.length > 128) errors.push({title: '제목을 줄여 주십시오.'});
}

form.validatePost = function (errors) {
	if (!this.userName) errors.push({userName: '필명을 입력해 주십시오.'});
	if (this.userName.length > 32) errors.push({userName: '필명을 줄여 주십시오.'});
}

form.insertThread = function (postList) {
	var thread = _thread.make({
		categoryId: this.categoryId, hit: 0, length: 1, cdate: this.now, udate: this.now,
		userName: this.userName, title: this.title
	});
	thread.setNewId();
	thread.insert();
	this.threadId = thread._id;
}

form.updateThreadLength = function () {
	_thread.updateLength(this.threadId, this.now);
}

form.insertPost = function (postList) {
	var post = _post.make({
		threadId: this.threadId, cdate: this.now, visible: true,
		userName: this.userName, text: this.text
	});
	post.setNewId();
//	fileService.savePostFile(post, req.getFiles("file"));
	post.insert();
	postList.push(post._id);
//	searchService.newPost(thread, post);

}

form.updateThread = function (thread) {
	thread.categoryId = this.categoryId;
	thread.title = this.title;
	thread.userName = this.userName;
	thread.update();
}

form.updatePost = function (role, post) {
	_async.series({
//		delFiles: function (next) {
//			next()
//		},
//		saveFiles: functino (next) {
//
//		},
		updatePost: function (next) {
			post.userName = this.userName;
			post.text = this.text;
			if (role.categoryList[this.categoryId].editable) {
				post.visible = this.visible;
			}
			post.update();
			next();
		}

		//	searchService.updatePost(thread, post);

	});
}
