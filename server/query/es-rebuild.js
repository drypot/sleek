var init = require('../main/init');
var config = require('../main/config')({ parseArgv: true });
var mongo = require('../main/mongo');
var es = require('../main/es');
var rebuild = require('../main/es-rebuild');

init.run(function (err) {
	if (err) throw err;
	es.dropIndex(function (err) {
		if (err) throw err;
		es.setSchema(function (err) {
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
});
