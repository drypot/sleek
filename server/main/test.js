var l = require('./l.js');
var config = require('./config.js');

exports.loadTestConfig = function (next) {
	config.load('config/config-test.json', function (err) {
		if (err) {
			next(err);
		} else {
			config.mongoDropDatabase = true;
			config.esDropIndex = true;
			exports.baseUrl = 'http://localhost:' + config.serverPort;
			next(err);
		}
	});
};
