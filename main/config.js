var _ = require('underscore');
var _should = require('should');
var _fs = require("fs");

var _ = require("underscore");
var _xml2js = require('xml2js');

var _lang = require('./lang');

_lang.addInit(function (callback) {
	var param = _.extend({}, exports.initParam);

	if (!param.configPath) {
		console.log('configuration file passed.');
		callback();
		return;
	}

	_fs.readFile(param.configPath, fileHandler);

	function fileHandler(err, data) {
		_should.ifError(err);
		new _xml2js.Parser().parseString(data, xmlHandler);
	}

	function xmlHandler(err, xml) {
		_should.ifError(err);
		xml.roleList = _.map(xml.role, function (el) { return el["@"]; });
		delete xml.role;
		xml.categoryList = _.map(xml.category, function (el) { return el["@"]; });
		delete xml.category;
		_.extend(exports, xml);
		console.info('configuration file loaded: ' + param.configPath);
		callback(err);
	}
});