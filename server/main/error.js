
exports = module.exports = function (arg, arg2) {
	var err, key;
	if (arg instanceof Errors) {
		err = new Error(msg[exports.ERROR_SET]);
		err.rc = exports.ERROR_SET;
		err.errors = arg.errors;
		return err;
	}
	if (arg2) {
		err = new Error(msg[exports.ERROR_SET]);
		err.rc = exports.ERROR_SET;
		err.errors = [{ name: arg, msg: arg2 }];
		return err;
	}
	if (typeof arg === 'number') {
		err = new Error(msg[arg]);
		err.rc = arg;
		return err;
	}
	if (typeof arg === 'string') {
		err = new Error(arg);
		return err;
	}
	err = new Error('unknown error');
	for (key in arg) {
		err[key] = arg[key];
	}
	return err;
};

var Errors = exports.Errors = function () {
	this.errors = [];
};

Errors.prototype.add = function (name, msg) {
	this.errors.push({ name: name, msg: msg });
};

Errors.prototype.hasErrors = function () {
	return this.errors.length > 0;
};

exports.ERROR_SET = 10;

exports.NOT_AUTHENTICATED = 101;
exports.NOT_AUTHORIZED = 102;

exports.INVALID_DATA = 201;
exports.INVALID_CATEGORY = 202;
exports.INVALID_THREAD = 203;
exports.INVALID_POST = 204;

var msg = exports.msg = {};

msg[exports.ERROR_SET] = '*';

msg[exports.NOT_AUTHENTICATED] = '먼저 로그인해 주십시오.';
msg[exports.NOT_AUTHORIZED] = '사용 권한이 없습니다.';

msg[exports.INVALID_DATA] = '비정상적인 값이 입력되었습니다.';
msg[exports.INVALID_CATEGORY] = '정상적인 카테고리가 아닙니다.';
msg[exports.INVALID_THREAD] = '정상적인 글줄이 아닙니다.';
msg[exports.INVALID_POST] = '정상적인 글이 아닙니다.';

msg.FILL_TITLE = '제목을 입력해 주십시오.';
msg.SHORTEN_TITLE = '제목을 줄여 주십시오.';
msg.FILL_WRITER = '필명을 입력해 주십시오.';
msg.SHORTEN_WRITER = '필명을 줄여 주십시오.';
msg.INVALID_PASSWORD = '비밀번호를 다시 확인해 주십시오.';
