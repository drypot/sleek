
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

var init = require('./main/init');
var config = require('./main/config').options({ path: configPath });
var mongo = require('./main/mongo');
var es = require('./main/es');
var rebuild = require('./main/es-rebuild');

init.run(function (err) {
	if (err) throw err;
	es.dropIndex(function (err) {
		if (err) throw err;
		console.log('start rebuilding:');
		rebuild.rebuild(function (err) {
			if (err) throw err;
			mongo.db.close(function (err) {
				if (err) throw err;
			})
		});
	});
});
