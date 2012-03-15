var _ = require('underscore');
var should = require('should');

var l = require('./l.js');
var config = require('./config.js');
var express = require('./express');

process.on('uncaughtException', function (err) {
	console.log( " UNCAUGHT EXCEPTION " );
	console.log( "[Inside 'uncaughtException' event] " + err.stack || err.message );
});

l.init.addBefore(function (next) {
	config.param = { configPath: "config-dev/config-dev.xml" }
	next();
});
l.init.run();

