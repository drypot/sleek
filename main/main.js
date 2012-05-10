var _ = require('underscore');

var l = require('./l.js');
var config = require('./config.js');
var express = require('./express.js');

process.on('uncaughtException', function (err) {
	console.log('UNCAUGHT EXCEPTION');
	console.log(err);
});

if (process.argv.length < 3) {
	console.log('specify configuration file path.');
	process.exit();
}
config.configPath = process.argv[2];

l.runInit();

