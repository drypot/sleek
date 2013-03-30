var l = require('./main/l.js');

require('./main/session-api.js');
require('./main/upload-api.js');
require('./main/post-api.js');
require('./main/search-api.js');

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
//	console.log('specify configuration file path.')
//	process.exit();

})();

(function () {
	l.init.run();
})();
