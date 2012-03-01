var _ = require('underscore');
var _should = require('should');
var _async = require("async");
var _mongolian = require("mongolian");

var _lang = require('./lang');
var _config = require('./config');

var Long = exports.Long = _mongolian.Long;
var ObjectId = exports.ObjectId = _mongolian.ObjectId;
var Timestamp = exports.Timestamp = _mongolian.Timestamp;
var DBRef = exports.DBRef = _mongolian.DBRef;

var mongolian;
var db;

_lang.addInit(function (callback) {
	var param = {};
	param.dbName = _config.dbName;
	_.extend(param, exports.initParam);

	mongolian = exports.mongolian = new _mongolian();
	db = exports.db = mongolian.db(param.dbName);
	if (param.dropDatabase) {
		db.dropDatabase();
	}
	extendCursorProto();
	console.info('db initialized: ' + db.name);
	callback(null);
});

function extendCursorProto() {
	var proto = db.collection("postThread").find().__proto__;
	proto.toArrayWithProto = function (proto, callback) {
		this.toArray(function (err, list) {
			for (var i = 0, len = list.length; i < len; ++i) {
				list[i].__proto__ = proto;
			}
			callback(err, list);
		});
	}
}