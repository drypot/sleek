var should = require('should');
var crypto = require('crypto');
var bcrypt = require('bcrypt');

describe('crypot', function () {
	it('can make hash', function () {
		var buf = new Buffer('1', 'ucs2');
		var hash = crypto.createHash('sha256');
		hash.update(buf);
		var d = hash.digest('base64');
		d.should.equal('555BjkhiNWnXXip7Ca6I7Zt3sSakRbn/ncaYmgjvoHk=');
	});
});

describe('bcrypt', function () {
	it('should be ok', function () {
		bcrypt.compareSync("1", '$2a$10$jGas7QsBV5ca6AqkUzW72uOpP9JD/czOkdBvnjna9ZpcdEfjplHfq').should.ok;
		bcrypt.compareSync("1", '$2a$10$rXNp3FTBsGYU.kAZYvBMQeKbxuEWZAw2W5fVB4h7PgKqfIV0CDWoy').should.ok;
		bcrypt.compareSync("1", '$2a$10$iwUk043ejFJBsVI1har7B.1f0jW0L5h74ZPTB7YDUCh9KCUZdRPxy').should.ok;
	});
	it('should not be ok', function () {
		bcrypt.compareSync("2", '$2a$10$jGas7QsBV5ca6AqkUzW72uOpP9JD/czOkdBvnjna9ZpcdEfjplHfq').should.not.ok;
		bcrypt.compareSync("2", '$2a$10$rXNp3FTBsGYU.kAZYvBMQeKbxuEWZAw2W5fVB4h7PgKqfIV0CDWoy').should.not.ok;
		bcrypt.compareSync("2", '$2a$10$iwUk043ejFJBsVI1har7B.1f0jW0L5h74ZPTB7YDUCh9KCUZdRPxy').should.not.ok;
	})
})