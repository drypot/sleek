var l = require('./main/l.js');

require('./main/session.js');
require('./main/upload.js');
require('./main/post.js');
require('./main/es.js');

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
			l.config.path = arg;
		}
	}
})();

(function () {
	l.init.run();
})();
