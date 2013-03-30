var _ = require('underscore');
var fs = require('fs');

exports.load = function (path) {
	var text = fs.readFileSync(path, 'utf8');
	var config = JSON.parse(text);
	_.extend(exports, config);
	console.log('configuration file loaded: ' + path);
}
