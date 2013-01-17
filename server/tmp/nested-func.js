var x = 0;

function f1() {
	x += sub1();

	function sub1() {
		return 1;
	}
}

function f2() {
	x += sub2();
}

function sub2() {
	return 1;
}

function loop(f) {
	for (var i = 0; i < 1000000; ++i) {
		f();
	}
}

var start = new Date();
loop(f1);
var mid = new Date();
loop(f2);
var end = new Date();

console.log("Test 1: " + (mid - start) + "\nTest 2: " + (end - mid));

//
// 제 기계에서 결과
//
// Test 1: 18
// Test 2: 13
//