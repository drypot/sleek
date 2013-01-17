
var f1 = function () {
    //console.log(this);
    function f2() {
        console.log(this);
    }

    f2();
};

f1();
