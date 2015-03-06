# Upgrade

## 전역 툴 업데이트

    $ npm install -g mocha
    $ npm install -g bower

## 서비스 중지

    $ sudo systemctl stop sleek
    $ sudo systemctl stop willy
    $ sudo systemctl stop billy
    $ sudo systemctl stop dmlab

## 코드 업데이트

    $ git pull
    $ npm install
    $ bower install

## 설정 업데이트

    ftp config files.

## 테스트 런

    $ node bin/run sleek live

## 서비스 재실행

    $ sudo systemctl start sleek
    $ sudo systemctl start willy
    $ sudo systemctl start billy
    $ sudo systemctl start dmlab
