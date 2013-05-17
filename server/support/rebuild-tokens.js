var init = require('../main/init');
var config = require('../main/config')({ parseArgv: true });
var mongo = require('../main/mongo');
var post = require('../main/post');

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
