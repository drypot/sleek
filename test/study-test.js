var _ = require('underscore');

describe('_.has', function() {
	it('should return false with null obj', function () {
		_.has(null, 'a').should.not.ok;
	})
});