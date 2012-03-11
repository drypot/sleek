var _ = require('underscore');
var _should = require('should');
var _async = require("async");
var _mongolian = require("mongolian");

var _l = require('./l');
var _config = require('./config');

var Long = exports.Long = _mongolian.Long;
var ObjectId = exports.ObjectId = _mongolian.ObjectId;
var Timestamp = exports.Timestamp = _mongolian.Timestamp;
var DBRef = exports.DBRef = _mongolian.DBRef;

var mongolian;
var db;

_l.addInit(function (next) {
	var param = {};
	param.mongoDbName = _config.mongoDbName;
	_.extend(param, exports.initParam);

	mongolian = exports.mongolian = new _mongolian();
	db = exports.db = mongolian.db(param.mongoDbName);
	if (param.dropDatabase) {
		db.dropDatabase();
	}
//	extendCursorProto();
	console.info('db initialized: ' + db.name);
	next();
});

//function extendCursorProto() {
//	var proto = db.collection("postThread").find().__proto__;
//	proto.toArrayWithProto = function (proto, next) {
//		this.toArray(function (err, list) {
//			for (var i = 0, len = list.length; i < len; ++i) {
//				list[i].__proto__ = proto;
//			}
//			next(err, list);
//		});
//	}
//}