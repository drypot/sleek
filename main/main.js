var _ = require('underscore');
var _should = require('should');

var _l = require('./l');
var _config = require('./config');
var _express = require('./express');

process.on('uncaughtException', function (err) {
	console.log( " UNCAUGHT EXCEPTION " );
	console.log( "[Inside 'uncaughtException' event] " + err.stack || err.message );
});

_l.addBeforeInit(function (next) {
	_config.initParam = { configPath: "config-dev/config-dev.xml" }
	next();
});
_l.runInit();

