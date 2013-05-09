var init = require('../main/init');
var config = require('../main/config')({ parseArgv: true });
var mongo = require('../main/mongo');

init.run(function (err) {
	if (err) throw err;
	var posts = mongo.posts.find();
	(function nextPost() {
		posts.nextObject(function (err, post) {
			if (err) throw err;
			if (!post) {
				console.log('ended');
				return;
			}
			if (post.files) {
				console.log(post.files);
				if (post.files.length === 0) {
					delete post.files;
					mongo.posts.save(post, function (err) {
						if (err) throw err;
						console.log('files removed.');
						setImmediate(nextPost);
					});
					return;
				}
				if (typeof post.files[0] === 'string') {
					for (var i = 0; i < post.files.length; i++) {
						post.files[i] = { name: post.files[i] };
					}
					mongo.posts.save(post, function (err) {
						if (err) throw err;
						console.log('files converted.');
						setImmediate(nextPost);
					});
					return;
				}
				console.log('skip conversion.');
			}
			setImmediate(nextPost);
		});
	})();
});
