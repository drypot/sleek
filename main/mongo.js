var _ = require('underscore');
var should = require('should');
var mongolian = require("mongolian")

var l = require('./l.js');
var config = require('./config.js');

var Long = exports.Long = mongolian.Long;
var ObjectId = exports.ObjectId = mongolian.ObjectId;
var Timestamp = exports.Timestamp = mongolian.Timestamp;
var DBRef = exports.DBRef = mongolian.DBRef;

var param = exports.param = {};
var server;
var db;

l.init.add(function (next) {
	param.dbName = param.dbName || config.mongoDbName;

	server = exports.server = new mongolian;
	db = exports.db = server.db(param.dbName);
	if (param.dropDatabase) {
		db.dropDatabase();
	}
	console.info('mongo initialized: ' + db.name);
	next();
});
