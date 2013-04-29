
exports.defineMethod = function (con, methodName, fn) {
	Object.defineProperty(
		con, methodName, { value : fn, writable: true, enumerable: false, configurable: true}
	);
}

exports.find = function (a, fn) {
	for (var i = 0; i < a.length; i++) {
		var item = a[i];
		if (fn(item)) return item;
	}
	return null;
};
