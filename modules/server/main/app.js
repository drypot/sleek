var init = require('../main/init');
var config = require('../main/config')({ parseArgv: true });
var express = require('../main/express');

require('../main/post-api');
require('../main/post-html');
require('../main/search-api');
require('../main/search-html');
require('../main/session-api');
require('../main/static-html');
require('../main/upload-api');
require('../main/upload-html');
require('../main/hello-api');

init.run(function (err) {
	if (err) throw err;
	express.listen();
});
