var _ = require('underscore');
var express = require('express');
var Bliss = require('bliss');
var l = require('../main/l.js');

var e = express();

e.configure(function () {

	e.set('views', process.cwd() + '/view');
	e.set('view engine', 'bliss');
	e.set('view options', {});

	var bliss = new Bliss({
		cacheEnabled: e.set('view cache'),
		context: {
			_: _,
			l: l
		}
	});
	e.engine('bliss', function (path, options, next) {
		next(null,bliss.render(path, options));
	});

	e.get('/', function (req, res) {
		res.render('index', { writer : 'rich', item: [ 'mac book pro', 'iPhone', 'iPad' ] });
	});

});

//	view/index.bliss
//
//	@!(p)
//	<!DOCTYPE html>
//	<html>
//		<head>
//			<title></title>
//		</head>
//		<body>
//			<h1>Hello Bliss 4</h1>
//			<p>user name: @p.param1</p>
//		</body>
//	</html>