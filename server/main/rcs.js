
var rcs = module.exports = exports = {
	SUCCESS: 0,

	NOT_AUTHENTICATED: 101,
	NOT_AUTHORIZED: 102,
	INVALID_PASSWORD: 103,

	INVALID_DATA: 201,
	INVALID_CATEGORY: 202,
	INVALID_THREAD: 203,
	INVALID_POST: 204,

	DB_IO_ERR: 301,
	FILE_IO_ERR: 302,
	SEARCH_IO_ERR: 303
};

var msg = exports.msg = {
	FILL_TITLE: '제목을 입력해 주십시오.',
	SHORTEN_TITLE: '제목을 줄여 주십시오.',
	FILL_WRITER: '필명을 입력해 주십시오.',
	SHORTEN_WRITER: '필명을 줄여 주십시오.'
};

msg[rcs.NOT_AUTHENTICATED] = '먼저 로그인 해주십시오.';
msg[rcs.NOT_AUTHORIZED] = '사용 권한이 없습니다.';
msg[rcs.INVALID_PASSWORD] = '비밀번호를 다시 확인해 주십시오.';

msg[rcs.INVALID_DATA] = '비정상적인 값이 입력되었습니다.';
msg[rcs.INVALID_CATEGORY] = '정상적인 카테고리가 아닙니다.';
msg[rcs.INVALID_THREAD] = '정상적인 글줄이 아닙니다.';
msg[rcs.INVALID_POST] = '정상적인 글이 아닙니다.';

msg[rcs.DB_IO_ERR] = '데이터베이스와의 연결에 문제가 발생하였습니다.';
msg[rcs.FILE_IO_ERR] = '파일 처리에 문제가 발생하였습니다.';
msg[rcs.SEARCH_IO_ERR] = '검색 서버와의 연결에 문제가 발생하였습니다.';
