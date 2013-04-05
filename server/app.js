var express = require('express');

process.on('uncaughtException', function (err) {
	console.error('UNCAUGHT EXCEPTION');
	console.error(err.stack);
});

var configPath;

for (var i = 2; i < process.argv.length; i++) {
	var arg = process.argv[i];
	if (arg.indexOf('--') === 0) {
		//
	} else {
		configPath = arg;
	}
}

require('./main/config')({ path: configPath }, function (_config) {
	require('./main/role')({ config: _config }, function (_role) {
		require('./main/mongo')({ config: _config }, function (_mongo) {
			require('./main/es')({ config: _config }, function (_es) {
				var app = express();
				require('./main/express')({ config: _config, role: _role, store: 'redis', app: app });
				require('./main/hello-api')({ app: app });
				app.listen(_config.port);
				console.log("express: %d", _config.port);
			});
		});
	});
});

//require('./main/session-api.js');
//require('./main/upload-api.js');
//require('./main/post-api.js');
//require('./main/search-api.js');
