import * as assert2 from "../base/assert2.js";
import * as init from "../base/init.js";
import * as config from "../base/config.js";

before(() => {
  config.setPath('config/test.json');
});

describe('config with valid path', function () {
  it('should succeed', function (done) {
    init.run(function (err) {
      assert2.ifError(err);
      assert2.ne(config.prop.appName, undefined);
      assert2.e(config.prop.xxx, undefined);
      done();
    });
  });
});

