var l = require('./l.js');

l.rc = {
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

l.msg = {
	FILL_TITLE: '제목을 입력해 주십시오.',
	SHORTEN_TITLE: '제목을 줄여 주십시오.',
	FILL_WRITER: '필명을 입력해 주십시오.',
	SHORTEN_WRITER: '필명을 줄여 주십시오.'
};
