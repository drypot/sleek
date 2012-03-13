var _ = require('underscore');
var should = require('should');
var request = require('request');

var l = require('../main/l');
var config = require('../main/config');
var role$ = require('../main/role.js');
var auth = require('../main/auth');

before(function (next) {
	l.addBeforeInit(function (next) {
		config.param = { configPath: "config-dev/config-dev.xml" }
		next();
	});	l.runInit(next);
});

