var http = require('http');
var should = require('should');
var request = require('request');
var util = require('util');
var test = require('../main/test.js');

var server = http.createServer();

server.on('rwp', function (req, res) {
	req.setEncoding('utf8');
	console.log('rwp: ' + req.url);
	console.log('headers: ' + util.inspect(req.headers, false, 1));
	req.on('data', function (chunk) {
		console.log(chunk);
	});
	req.on('end', function () {
		res.end('');
	})
});

server.listen(8090, function () {
	test.request('http://localhost:8090/api/test/upload', {writer: 'snowman', age: 39}, ['file1.txt', 'file222.txt']).end(function (err, res) {
	});

//	request({
//		method: 'POST',
//		uri: 'http://localhost:8090/upload',
//		headers: { 'content-type': 'multipart/form-data'},
//		multipart: [
//			{
//				'Content-Disposition': 'form-data; name="writer"',
//				body: 'Larry'
//			}, {
//				'Content-Disposition': 'form-data; name="file"; filename="file1.txt"',
//				'Content-Type': 'text/plain',
//				body: 'I am an attachment'
//			}
//		]
//	},
//	function (err, res, body) {
//		res.status.should.equal(200);
//	});
});