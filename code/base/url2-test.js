
import * as url2 from "../base/url2.js";
import assert from "assert";
import * as assert2 from "../base/assert2.js";

describe('url', function () {
  it('should succeed', function () {
    const params = {a: 10};
    const params2 = {a: 10, b: 'big'};
    assert2.e(url2.url('http://localhost/test'), 'http://localhost/test');
    assert2.e(url2.url('http://localhost/test', params), 'http://localhost/test?a=10');
    assert2.e(url2.url('http://localhost/test', params2), 'http://localhost/test?a=10&b=big');
  });
});

describe("UrlMaker", function () {
  it("url should succeed", function () {
    assert2.e(new url2.UrlMaker('/thread').done(), '/thread');
  });
  it("query param should succeed", function () {
    assert2.e(new url2.UrlMaker('/thread').add('p', 10).done(), '/thread?p=10');
  });
  it("query params should succeed", function () {
    assert2.e(new url2.UrlMaker('/thread').add('p', 10).add('ps', 16).done(), '/thread?p=10&ps=16');
  });
  it("default value should succeed", function () {
    assert2.e(new url2.UrlMaker('/thread').add('p', 0, 0).add('ps', 16, 32).done(), '/thread?ps=16');
  });
});
