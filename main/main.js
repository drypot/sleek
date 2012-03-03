var _ = require('underscore');
var _should = require('should');

var _lang = require('./lang');
var _config = require('./config');
var _express = require('./express');

process.on('uncaughtException', function (err) {
	console.log( " UNCAUGHT EXCEPTION " );
	console.log( "[Inside 'uncaughtException' event] " + err.stack || err.message );
});

_lang.addBeforeInit(function (callback) {
	_config.initParam = { configPath: "config-dev/config-dev.xml" }
	callback();
});
_lang.runInit();

