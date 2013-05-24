# Sleek

개인적인 기술 실험용 게시판입니다.

사용하는 DB 나 주변기술을 자주 바꾸기 때문에 이 코드를 실 서비스에 사용하시는 것은 권장하지 않습니다.


# Nginx

프런트 웹 서버 설정 예

	server {
		listen          8080;
		server_name     sleek;
		root            /Users/drypot/code/javascript/sleek/client/public;

		location / {
			proxy_pass http://localhost:8010;
			proxy_set_header Host $http_host;
		}

		location ~ /(?:css|image|js|lib)/ {
		}
	}

	server {
		listen 8080;
		server_name sleekfile;
		root /Users/drypot/code/javascript/sleek/upload/public;
	}


# License

The MIT License (MIT)

Copyright (c) 2012 Kyuhyun Park

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.