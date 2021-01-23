# Upgrade

## 서비스 중지

    sudo systemctl stop sleek

## MySQL 백업

    $ mysqldump -u drypot -p sleek > sleek-0000.sql

## Arch Linux 업데이트

    sudo pacman -Syu

invalid or corrupted package 오류나면 키 업데이트

    sudo pacman-key --refresh-keys

Arch 서비스 Fail 나면

    pacman -Rs ... 로 패키지 삭제했다가
    pacman -S ... 로 재설치.

## 전역 툴 업데이트

    sudo npm install -g mocha

## 코드 업데이트

    git pull
    
    npm install

## 설정 업데이트

    config/...

## 테스트 런

    $ node code/main/main.js -c config/sleek-live.json

## 재부팅

    reboot

## 필요하면 서비스 재실행

    sudo systemctl restart sleek
