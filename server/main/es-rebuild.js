var init = require('../main/init');
var mongo = require('../main/mongo');
var es = require('../main/es');

init.add(function () {

	console.log('es-rebuild:');

	exports.rebuild = function (next) {
		var count = 0;

		var threads = mongo.threads.find();
		var posts;

		walkThread();

		function walkThread() {
			threads.nextObject(function (err, thread) {
				if (err) return next(err);
				if (thread) {
					posts = mongo.posts.find({ threadId: thread._id });
					walkPost(thread);
					return;
				}
				next();
			});
		};

		function walkPost(thread) {
			posts.nextObject(function (err, post) {
				if (err) return next(err);
				if (post) {
					es.update(thread, post, function (err) {
						count++;
						if (count % 1000 === 0) {
							process.stdout.write(count + ' ');
						}
						// node core 의 request socket 을 재사용하기 위해
						// callback 을 기다리지 않는다.
					});
					walkPost(thread);
					return;
				}
				walkThread();
			});
		}
	}

});

