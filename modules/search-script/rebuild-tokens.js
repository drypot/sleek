var init = require('../base/init');
var config = require('../base/config')({ parseArgv: true });
var mongo = require('../mongo/mongo');
var post = require('../post/post-base');

init.run(function (err) {
	console.log('start rebuilding:');
	post.rebuildTokens(function (err) {
		if (err) throw err;
		mongo.db.close(function (err) {
			if (err) throw err;
			console.log('done');
		})
	});
});
