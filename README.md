
# novel-dl

novel downloader for 📖🐰 (currently public beta)



## Features

- 📖🐰 소설 다운로드 (htdl 대비 빠른 속도)
- 파일 병합 기능
- 크로스 플랫폼 (윈도우, 리눅스, 맥 지원)
- ~~병렬 다운로드 지원~~ (2개 이상 스레드 사용시 차단됨)


## Installation

[Releases](https://github.com/yeorinhieut/novel-dl/releases) 에서 OS와 플랫폼에 맞는 실행파일을 제공합니다.


### Building

```bash
  go build
```
    
## Usage/Examples

```bash
./novel-dl
```

```bash
                      _           _ _ 
 _ __   _____   _____| |       __| | |
| '_ \ / _ \ \ / / _ \ |_____ / _\ ` | 
| | | | (_) \ V /  __/ |_____| (_| | |
|_| |_|\___/ \_/ \___|_|      \__,_|_|
                                      
novel-dl
https://github.com/yeorinhieut/novel-dl

다운로드할 소설의 회차 목록 URL을 입력하세요: https://example.com/novel/1234
소설의 마지막 회차 번호를 입력하세요: 123
다운로드를 시작하시겠습니까? (y/n): y
다운로드할 스레드 수를 입력하세요 (일반적으로 1을 권장합니다): 1
```


## FAQ

#### "0개의 링크를 찾았습니다." 만 반복됩니다.

원본 사이트에 정상적으로 접근되어야 다운로드가 가능합니다.

#### "403" 오류를 반환합니다

스레드를 2개 이상으로 설정하였을 경우 발생하는 이슈입니다.
프록시 기능 지원을 통해 해결할 예정입니다.

#### "Windows의 PC 보호" 로 프로그램 실행이 불가합니다

프로그램을 서명하지 않아서 발생한 문제입니다.
실행파일 내 어떠한 바이러스도 존재하지 않으며, 직접 코드를 확인 후 빌드해서도 사용 가능합니다.
"추가 정보" 를 누른 후 실행하세요.

