var _ = require('underscore');
var fs = require('fs');
var l = require('./l.js');

l.config = {};

l.config.path = undefined;
l.config.override = {};

l.init(function () {
	if (!l.config.path) {
		console.log('specify configuration file path.')
		process.exit();
	} else {
		var text = fs.readFileSync(l.config.path, 'utf8');
		var config = JSON.parse(text);
		_.extend(l.config, config, l.config.override);
		console.log('configuration file loaded: ' + l.config.path);
	}
});
