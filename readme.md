# Sleek

개인적인 기술 실험용 게시판입니다.

사용하는 DB 나 주변기술을 자주 바꾸기 때문에 이 코드를 실 서비스에 사용하시는 것은 권장하지 않습니다.


## Nginx

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

## History

2013.05 14 개월 만에 Node.js 버전 오픈

2012.03 Node.js 로 재개발 시작

2011.12 Java, Jetty, Mongo, Lucene, Spring, Hibernate, JSP

2010.11 Java, Tomcat, MySQL, Lucene, Spring, Hibernate, JSP

2010.07 Java, Tomcat, H2, Lucene, Scala, Scalate

2010.03 Java, Jetty, H2, Lucene, Scala, Scalate

2009.11 Java, Jetty, H2, Groovy

2009.10 Java, Jetty, Derby, Groovy, Grails

M$ 계를 떠남.

2009.06 Windows NT, SQL Server, IIS. ASP.NET, F#

2009.05 Windows NT, SQL Server, IIS. ASP.NET, C#

8 년간 업그레이드 안 함.

2001.06 Winodws NT, SQL Server, IIS, ASP

2000.09 Winodws NT, SQL Server, IIS, ColdFusion

199X.00 newsgroup 서버로 운영시작


## License

The MIT License (MIT)

Copyright (c) 2012 Kyuhyun Park

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.