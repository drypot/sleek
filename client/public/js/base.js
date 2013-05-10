var request = superagent;

(function () {

	// for IE 7

	if (!window.localStorage) {
		window.localStorage = {
			getItem: function () {},
			setItem: function () {},
			removeItem: function () {}
		}
		window.sessionStorage = {
			getItem: function () {},
			setItem: function () {},
			removeItem: function () {}
		}
	}

	if (!window.console) {
		window.console = {
			log: function () {}
		}
	}

})();

(function () {

	window.init = {};

	var funcs = [];

	window.init.add = function (func) {
		funcs.push(func);
	};

	$(function () {
		console.log('init:');

		var i = 0;
		var len = funcs.length;

		for (i = 0; i < len; i++) {
			funcs[i]();
		}
	});

})();

init.add(function () {

	window.dt = {};

	function pad(n) {
		var s = "0" + n;
		return s.substr(s.length - 2, 2);
	}

	dt.format = function (d) {
		return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' +
			pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
	};

	dt.isNew = function (d) {
		return d > lastAccess;
	};

	var now = dt.format(new Date());
	var lastAccess = sessionStorage.getItem('last-access');

	if (!lastAccess) {
		lastAccess = localStorage.getItem('last-access') || now;
		sessionStorage.setItem('last-access', lastAccess);
	}
	localStorage.setItem('last-access', now);

});

init.add(function () {

	var error = window.error = {};

	error.NOT_AUTHENTICATED = 101;
	error.NOT_AUTHORIZED = 102;
	error.INVALID_PASSWORD = 103;

	error.INVALID_DATA = 201;
	error.INVALID_CATEGORY = 202;
	error.INVALID_THREAD = 203;
	error.INVALID_POST = 204

});

init.add(function () {

	window.$window = $(window);
	window.$document = $(document);

	window.url = {};
	window.url.pathnames = window.location.pathname.slice(1).split('/');
	window.url.query = (function () {
		var plusPattern = /\+/g;
		var paramPattern = /([^&=]+)=?([^&]*)/g;
		var search = window.location.search.slice(1);
		var query = {};
		var match;
		while (match = paramPattern.exec(search)) {
			query[match[1]] = decodeURIComponent(match[2].replace(plusPattern, " "));
		}
		return query;
	})();

});

init.add(function () {

	window.setInterval(function() {
		request.get('/api/hello').end(function (err, res) {
			if (err || res.error) {
				console.log('ping: error');
				return;
			}
			console.log('ping:');
		});
	}, 1000 * 60 * 5); // 5 min

});
