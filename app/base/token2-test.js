'use strict';

const { tokenize } = require('./token2');
const assert = require('assert');
const assert2 = require('./assert2');

function assertTokens(tokenized, len) {
  var tokens = [].slice.call(arguments, 2);
  if (tokenized.length !== len) {
    assert.fail(tokenized.length, len, 'length mismatch', 'tokenzie', assertTokens);
  }
  tokens.forEach(function (token) {
    if (tokenized.indexOf(token) === -1) {
      assert.fail(tokenized, token, 'token missed', 'tokenzie', assertTokens);
    }
  });
}

describe('tokenizer', function () {
  it('can parse emtpy', function () {
    assertTokens(tokenize(''), 0);
  });
  it('can parse space', function () {
    assertTokens(tokenize(' \t\n'), 0);
  });
  it('can parse numbers', function () {
    assertTokens(tokenize('1'), 1, '1');
    assertTokens(tokenize('12'), 1, '12');
    assertTokens(tokenize('123'), 1, '123');
    assertTokens(tokenize('1 2'), 2, '1', '2');
    assertTokens(tokenize('12 345'), 2, '12', '345');
  });
  it('can parse latins', function () {
    assertTokens(tokenize('x'), 1, 'x');
    assertTokens(tokenize('x abc'), 2, 'x', 'abc');
  });
  it('can skip latin dupes', function () {
    assertTokens(tokenize('abc def abc'), 2, 'abc', 'def');
  });
  it('should ignore case', function () {
    assertTokens(tokenize('abc AbC dEf'), 2, 'abc', 'def');
  });
  it('can parse latins with numbers', function () {
    assertTokens(tokenize('abc123'), 1, 'abc123');
  });
  it('can parse punctuations', function () {
    assertTokens(tokenize('abc!'), 1, 'abc');
    assertTokens(tokenize('hello, world.'), 2, 'hello', 'world');
  });
  it('can parse stop words', function () {
    assertTokens(tokenize('what a beautiful world it is!'), 3, 'what', 'beautiful', 'world');
  });
  it('can parse multiple arguments', function () {
    assertTokens(tokenize('abc 123', 'def 123'), 3, 'abc', 'def', '123')
  });
  it('can parse hangul', function () {
    assertTokens(tokenize('한'), 0);
    assertTokens(tokenize('한글'), 1, '한글');
    assertTokens(tokenize('한글나'), 2, '한글', '글나');
    assertTokens(tokenize('한글나라'), 3, '한글', '글나', '나라');
    assertTokens(tokenize('누나하고 나하고'), 3, '누나', '나하', '하고');
  });

});
