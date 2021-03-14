import * as array2 from "./array2.js";
import * as assert2 from "./assert2.js";

describe('find', function () {
  it('should succeed', function () {
    const item = array2.find([1, 2, 3], function (item) {
      return item === 2;
    });
    assert2.e(item, 2);
  });
  it('should succeed', function () {
    const item = array2.find([1, 2, 3], function (item) {
      return item === 4;
    });
    assert2.e(item, null);
  });
});

describe('mergeArray', function () {
  function eq(item1, item2) {
    return item1.name === item2.name;
  }
  it('should succeed', function () {
    const obj1 = [];
    const obj2 = [{name: 'n1', value: 'v1'}];
    array2.merge(obj1, obj2, eq);
    assert2.e(obj1.length, 1);
    assert2.e(obj1[0].name, 'n1');
    assert2.e(obj1[0].value, 'v1');
  });
  it('should succeed', function () {
    const obj1 = [{name: 'n1', value: 'v1'}, {name: 'n2', value: 'v2'}];
    const obj2 = [{name: 'n2', value: 'v2n'}, {name: 'n3', value: 'v3n'}, {name: 'n4', value: 'v4n'}];
    array2.merge(obj1, obj2, eq);
    assert2.e(obj1.length, 4);
    assert2.e(obj1[0].name, 'n1');
    assert2.e(obj1[0].value, 'v1');
    assert2.e(obj1[1].name, 'n2');
    assert2.e(obj1[1].value, 'v2n');
    assert2.e(obj1[2].name, 'n3');
    assert2.e(obj1[2].value, 'v3n');
    assert2.e(obj1[3].name, 'n4');
    assert2.e(obj1[3].value, 'v4n');
  });
});
