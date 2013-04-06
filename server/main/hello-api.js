
module.exports = function (opt) {

	var app = opt.app;

	app.get('/api/hello', function (req, res) {
		res.json('hello');
	});

};
