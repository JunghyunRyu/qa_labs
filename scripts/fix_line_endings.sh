#!/bin/bash
# 줄바꿈 변환 스크립트
# Windows에서 작성된 파일의 CRLF를 LF로 변환

sed -i 's/\r$//' scripts/auto_resolve_cherry_pick.sh
chmod +x scripts/auto_resolve_cherry_pick.sh
echo "줄바꿈 변환 완료!"
