function getFunc() {
	function abc() { console.log("i'm abc"); }
	var i1 = abc;
	var i2 = abc;
	console.log('inner:' + (i1 == i2));
	console.log('inner:' + (i1 === i2));
	return abc;
}

var f1 = getFunc();
var f2 = getFunc();

console.log(f1 == f2);
console.log(f1 === f2);
console.log(getFunc === getFunc);