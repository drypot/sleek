var o = {
	f1: 10,
	func1: function () {
		console.log('inside:' + this.f1);
	},
	func2: function () {
		this.func1();
	},
	func3: function () {
		func1();
	}
}

var func1 = function () {
	console.log('outside')
}

o.func2();
o.func3();