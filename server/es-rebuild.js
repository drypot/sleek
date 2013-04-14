var l = require('./main/l');

require('./main/es');

(function () {
	process.on('uncaughtException', function (err) {
		console.log('UNCAUGHT EXCEPTION');
		console.log(err);
	});
})();

(function () {
	var i = 2;
	var len = process.argv.length;
	for (; i < len; i++ ) {
		var arg = process.argv[i];
		if (arg.indexOf('--') === 0) {
			//
		} else {
			config.path = arg;
			config.expressDisabled = true;
		}
	}
})();

(function () {
	l.init.run(function () {
		async.series([
			function (next) {
				l.es.dropIndex(next);
			},
			function (next) {
				console.log('start search index rebuilding.');
				l.es.rebuild(next);
			},
			function (next) {
				l.mongo.db.close(next);
			},
			function (next) {
				process.stdout.write('pushing completed, wait queue flushed, ');
				next();
			}
		]);
	});
})();
