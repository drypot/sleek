var l = require('./main/l.js');

require('./main/ex-session.js');
require('./main/ex-upload.js');
require('./main/ex-post.js');
require('./main/ex-search.js');

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
