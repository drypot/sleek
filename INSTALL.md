# Install

nginx, mariadb, redis 등이 필요.

## Nginx

Mac 개발환경용 Nginx 설정 예

    server {
      listen 8080;
      server_name sleek.test;
      root /Users/drypot/projects/sleek/sleek/public;
    
      client_max_body_size 512m;
    
      location / {
        try_files $uri @app;
      }
    
      location @app {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $http_host;
      }
    }
    
    server {
      listen 8080;
      server_name file.sleek.test;
      root /Users/drypot/projects/sleek/sleek/upload/sleek/public;
    }
    

## Mroonga

MariaDB 쉘에서 Mroonga 검색 엔진을 활성화 한다. 

	> install soname 'ha_mroonga';
  	> show engines;

## Clone Source

    $ git clone https://github.com/drypot/sleek.git
    $ cd sleek

    $ npm install

## 실행

실행.

    $ node code/main/main.js -c config/sleek-dev.json

## 서비스로 등록

    /etc/systemd/system/sleek.serivce

    [Unit]
    Description=Sleek
    Requires=nginx.service mongodb.service redis.service
    After=nginx.service mongodb.service redis.service

    [Service]
    User=drypot
    Restart=always
    RestartSec=15
    WorkingDirectory=/data/web/sleek
    ExecStart=/usr/bin/node code/main/main.js -c config/sleek-live.json
    Environment=NODE_ENV=production

    [Install]
    WantedBy=multi-user.target

* Group 을 지정하지 않으면 유저 기본 그룹을 사용.
* StandardOutput 을 지정하지 않으면 journal 을 사용.
* syslog 를 지정하면 syslog 에도 쌓이고 journal 에도 쌓인다. journal 에는 기본적으로 쌓임.
* [Install] 파트는 enable, disable 명령에서 사용한다.
