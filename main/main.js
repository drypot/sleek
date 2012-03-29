var _ = require('underscore');

var l = require('./l.js');
var config = require('./config.js');
var express = require('./express.js');

process.on('uncaughtException', function (err) {
	console.log( " UNCAUGHT EXCEPTION " );
	console.log( "[Inside 'uncaughtException' event] " + err.stack || err.message );
});

l.addBeforeInit(function (next) {
	config.param.configPath = "config-dev/config-dev.json";
	next();
});
l.runInit();

