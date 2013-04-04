var async = require('async');
var util = require('util');

var config = require('./main/config.js');
var role = require('./main/role.js');
var mongo = require('./main/mongo.js');
var es = require('./main/es.js');
var express = require('./main/express.js');

//require('./main/session-api.js');
//require('./main/upload-api.js');
//require('./main/post-api.js');
//require('./main/search-api.js');
//
//var express = require('./main/express.js');

process.on('uncaughtException', function (err) {
	console.error('UNCAUGHT EXCEPTION');
	console.error(err.stack);
});

var configPath;

async.series([
	function (next) {
		var len = process.argv.length;
		for (var i = 2; i < len; i++ ) {
			var arg = process.argv[i];
			if (arg.indexOf('--') === 0) {
				//
			} else {
				configPath = arg;
			}
		}
		next();
	},
	function (next) {
		config.init({ path: configPath }, next);
	},
	function (next) {
		role.init(next);
	},
	function (next) {
		mongo.init(next);
	},
	function (next) {
		es.init(next);
	},
	function (next) {
		express.init({ redisStore: true }, next);
	},
	function (next) {
		express.listen();
		next();
	}
]);
