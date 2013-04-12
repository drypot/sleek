
module.exports = function (opt, next) {

	var exports = {};

	var mongo = opt.mongo;
	var es = opt.es;

	exports.rebuild = function (next) {
		var threadCursor = mongo.threads.find();
		var postCursor;
		var count = 0;

		walkThread(next);

		function walkThread(next) {
			threadCursor.nextObject(function (err, thread) {
				if (err) {
					next(err);
				} else {
					if (!thread) {
						next();
					} else {
						postCursor = mongo.posts.find({ threadId: thread._id });
						walkPost(thread, function (err) {
							if (err) {
								next(err);
							} else {
								walkThread(next);
							}
						});
					}
				}
			});
		}

		function walkPost(thread, next) {
			postCursor.nextObject(function (err, post) {
				if (err) {
					next(err);
				} else {
					if (!post) {
						next();
					} else {
						updateSearchIndex(thread, post, function (err) {
							if (err) {
								next(err);
							} else {
								walkPost(thread, next);
							}
						});
					}
				}
			});
		}

		var updatePost = es.updatePost;

		function updateSearchIndex(thread, post, next) {
			updatePost(thread, post, function (err) {
				count++;
				if (count % 1000 === 0) {
					process.stdout.write(count + ' ');
				}
				//next();
			});
			// node core 의 request socket 을 재사용하기 위해
			// callback 을 기다리지 않고 새로운 request 를 계속 밀어 넣는다.
			next();
		}
	}

};

