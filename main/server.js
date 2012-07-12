var l = require('./l.js');

require('./session.js');
require('./upload.js');
require('./post.js');

//if (process.argv.length < 3) {
//	l.log('specify configuration file path.');
//	process.exit();
//}
//l.config.path = process.argv[2];
//l.init.run(function () {
//	async.series([
//		function (next) {
//			l.es.dropIndex(next);
//		},
//		function (next) {
//			l.log('start search index rebuilding.');
//			l.es.rebuild.rebuild(next);
//		},
//		function (next) {
//			l.mongo.db.close(next);
//		},
//		function (next) {
//			l.log('completed.');
//			next();
//		}
//	]);
//});

process.on('uncaughtException', function (err) {
	l.log('UNCAUGHT EXCEPTION');
	l.log(err);
});

if (process.argv.length < 3) {
	l.log('specify configuration file path.');
	process.exit();

}

l.configPath = process.argv[2];
l.init.run();
