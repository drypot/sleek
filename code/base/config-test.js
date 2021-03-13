
import * as init from "../base/init.js";
import * as config from "../base/config.js";
import assert from "assert";
import * as assert2 from "../base/assert2.js";

before(() => {
  config.setPath('config/test.json');
});

describe('config with valid path', function () {
  it('should succeed', function (done) {
    init.run(function (err) {
      assert.ifError(err);
      assert(config.prop.appName !== undefined);
      assert(config.prop.xxx === undefined);
      done();
    });
  });
});

