# Install

아래는 Arch Linux 를 가정.

## Nginx

Mac 개발환경용 Nginx 설정 예

    server {
      listen 8080;
      server_name sleek.local;
      root /Users/drypot/projects/sleek/website/public;

      client_max_body_size 512m;
      
      location / {
        proxy_pass http://localhost:8800;
        proxy_set_header Host $http_host;
      }

      location /static/ {
      }

      location /static/bower/ {
        alias /Users/drypot/projects/sleek/website/bower_components/;
      }
    }

    server {
      listen 8080;
      server_name file.sleek.local;
      root /Users/drypot/projects/sleek/website/upload/public;
    }

## Requirements

mariadb, redis.

## Clone Source

    $ mkdir /data/web
    $ cd /data/web

    $ git clone https://github.com/drypot/sleek.git
    $ cd sleek

    $ npm install
    $ bower install

## 실행

설정파일 생성.

    config/sleek-live.json

실행.

    bin/run sleek live

## 서비스로 등록

/usr/lib/systemd 디렉토리는 패키지의 유닛 파일들만 들어간다.
사용자 추가 유닛들은 /etc/systemd/system 에 생성.

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
    ExecStart=/usr/bin/node app/main/main.js --config config/sleek-live.json
    Environment=NODE_ENV=production

    [Install]
    WantedBy=multi-user.target

* Group 을 지정하지 않으면 유저 기본 그룹을 사용.
* StandardOutput 을 지정하지 않으면 journal 을 사용.
* syslog 를 지정하면 syslog 에도 쌓이고 journal 에도 쌓인다. journal 에는 기본적으로 쌓임.
* [Install] 파트는 enable, disable 명령에서 사용한다.
