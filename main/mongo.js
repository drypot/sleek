var _ = require('underscore');
var should = require('should');
var mongolian = require("mongolian")

var l = require('./l.js');
var config = require('./config.js');

var Long = exports.Long = mongolian.Long;
var ObjectId = exports.ObjectId = mongolian.ObjectId;
var Timestamp = exports.Timestamp = mongolian.Timestamp;
var DBRef = exports.DBRef = mongolian.DBRef;

var server;
var db;

l.addInit(function (next) {
	var param = {};

	// param from config
	param.mongoDbName = config.mongoDbName;

	// param from param
	_.extend(param, exports.param);

	server = exports.server = new mongolian;
	db = exports.db = server.db(param.mongoDbName);
	if (param.dropDatabase) {
		db.dropDatabase();
	}
	console.info('mongo initialized: ' + db.name);
	next();
});
