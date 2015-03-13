var should = require('should');

var tokenize = require('../main/tokenizer').tokenize;

describe("tokenizer", function () {
	it("can parse emtpy", function () {
		tokenize('').should.have.length(0);
	});
	it("can pass space", function () {
		tokenize(' \t\n').should.have.length(0);
	});
	it("can parse numbers", function () {
		tokenize('1').should.have.length(1).include('1');
		tokenize('12').should.have.length(1).include('12');
		tokenize('123').should.have.length(1).include('123');
		tokenize('1 2').should.have.length(2).include('1').include('2');
		tokenize('12 345').should.have.length(2).include('12').include('345');
	});
	it("can parse latins", function () {
		tokenize('x').should.have.length(1).include('x');
		tokenize('x abc').should.have.length(2).include('x').include('abc');
	});
	it("can skip latin dupes", function () {
		tokenize('abc def abc').should.have.length(2).include('abc').include('def');
	});
	it("should ignore case", function () {
		tokenize('abc AbC dEf').should.have.length(2).include('abc').include('def');
	});
	it("can parse latins with numbers", function () {
		tokenize('abc123').should.have.length(1).include('abc123');
	});
	it("can pass punctuations", function () {
		tokenize('abc!').should.have.length(1).include('abc');
		tokenize('hello, world.').should.have.length(2).include('hello').include('world');
	});
	it("can pass stop words", function () {
		tokenize('what a beautiful world it is!').should.have.length(3).include('what').include('beautiful').include('world');
	});
	it("can parse multiple arguments", function () {
		tokenize('abc 123', 'def 123').should.have.length(3).include('abc').include('def').include('123')
	});
	it("can parse hangul", function () {
		tokenize('한').should.have.length(0);
		tokenize('한글').should.have.length(1).include('한글');
		tokenize('한글나').should.have.length(2).include('한글').include('글나');
		tokenize('한글나라').should.have.length(3).include('한글').include('글나').include('나라');
		tokenize('누나하고 나하고').should.have.length(3).include('누나').include('나하').include('하고');
	});

});
