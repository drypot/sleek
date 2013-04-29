
process.on('uncaughtException', function (err) {
	console.error('UNCAUGHT EXCEPTION');
	if (err.stack) {
		console.error(err.stack);
	} else {
		console.log(require('util').inspect(err));
	}
});

var configPath;

for (var i = 2; i < process.argv.length; i++) {
	var arg = process.argv[i];
	if (arg.indexOf('--') === 0) {
		//
	} else {
		configPath = arg;
	}
}

var init = require('../main/init');
var config = require('../main/config')({ path: configPath });
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
