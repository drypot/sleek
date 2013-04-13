var should = require('should');

var init = require('../main/init');
var config = require('../main/config');
var rcs = require('../main/rcs');

var opt = {};

exports.options = function (_opt) {
	for(var p in _opt) {
		opt[p] = _opt[p];
	}
	return exports;
};

init.add(function () {

	var url = exports.url = 'http://localhost:' + config.data.port;
	var request = opt.request;

	exports.logout = function (next) {
		request.del(url + '/api/sessions', function (err, res) {
			should.not.exist(err);
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			next();
		});
	}

	exports.loginUser = function (next) {
		request.post(url + '/api/sessions').send({ password: '1' }).end(function (err, res) {
			should.not.exist(err);
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.role.name.should.equal('user');
			next();
		});
	}

	exports.loginAdmin = function (next) {
		request.post(url + '/api/sessions').send({ password: '3' }).end(function (err, res) {
			should.not.exist(err);
			res.status.should.equal(200);
			res.body.rc.should.equal(rcs.SUCCESS);
			res.body.role.name.should.equal('admin');
			next();
		});
	}

});
