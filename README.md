
# novel-dl

browser-based novel downloader for 📖🐰 (stable)
  
[![Hits](https://hits.sh/github.com/yeorinhieut/novel-dl.svg)](https://hits.sh/github.com/yeorinhieut/novel-dl/)
[![Daily](https://data.jsdelivr.com/v1/stats/packages/gh/yeorinhieut/novel-dl/badge?type=hits&period=day)](https://data.jsdelivr.com/v1/stats/packages/gh/yeorinhieut/novel-dl/badge?type=hits&period=day)
[![Weekly](https://data.jsdelivr.com/v1/stats/packages/gh/yeorinhieut/novel-dl/badge?type=hits&period=week)](https://data.jsdelivr.com/v1/stats/packages/gh/yeorinhieut/novel-dl/badge?type=hits&period=week)
[![Monthly](https://data.jsdelivr.com/v1/stats/packages/gh/yeorinhieut/novel-dl/badge?type=hits&period=month)](https://data.jsdelivr.com/v1/stats/packages/gh/yeorinhieut/novel-dl/badge?type=hits&period=month)
  
## Features

-   📖🐰 북토끼 소설 다운로드
-   자동 파일 병합 기능
-   브라우저 콘솔/북마크를 통한 빠른 실행
-   프로그램 설치 불필요

## Usage (사용 전 상단 star 부탁드립니다!)

### Via Bookmark (다회성 사용/권장)
1. 아래 [스크립트](https://raw.githubusercontent.com/yeorinhieut/novel-dl/main/bookmark.js)를 복사하기 (우측 복사버튼)
    ```javascript
    javascript:(function(){fetch('https://cdn.jsdelivr.net/gh/yeorinhieut/novel-dl/script.min.js').then(response=>{if(!response.ok){throw new Error(`Failed to fetch script: ${response.statusText}`);}return response.text();}).then(scriptContent=>{const script=document.createElement('script');script.textContent=scriptContent;document.head.appendChild(script);console.log('Script loaded and executed.');}).catch(error=>{console.error(error);});})();
    ```
2. 브라우저에서, `ctrl+shift+b` 를 통해 북마크바 표시하기
3. `ctrl+d` 를 통해 아무 페이지에서 북마크 추가
4. 북마크 우클릭 - 수정
5. 북마크 "url" 부분에 복사한 스크립트 붙여넣기 (제목 x)
6. 다운로드 받을 소설의 회차 목록 페이지에서, 해당 북마크 클릭하기

### Via Browser Console (일회성 사용/비권장)
1. [script.js](https://raw.githubusercontent.com/yeorinhieut/novel-dl/main/script.js) 를 복사하기
2. 다운로드 받을 소설의 회차 목록 페이지에서, `f12` 혹은 `ctrl+shift+i` 를 눌러 브라우저 콘솔 진입
3. 콘솔에 복사한 스크립트 붙여넣기

## FAQ

### 한번에 여러 소설 다운로드가 가능한가요?

여러 탭에서, 한번에 여러 소설을 다운로드를 시도하면, 차단 정책으로 인해 사이트 접속이 불가할 수 있습니다. 권장되지 않습니다. (분당 60회 이상 요청시 차단됨)

### 오류가 발생했습니다.

[issues](https://github.com/yeorinhieut/novel-dl/issues) 섹션에 해당 오류를 제보하거나, PR을 통해 기여해 주세요.

### 개선 사항을 요청하고 싶습니다.

[issues](https://github.com/yeorinhieut/novel-dl/issues) 섹션에 해당 개선사항을 제시하거나, PR을 통해 기여해 주세요.

---
## 다른 프로그램도 만들어 주세요!
- 공익적인 목적의 프로그램인 경우 언제나 문의를 받고 있습니다.
- 사적 사용 프로그램 역시 외주 형식으로 제작하고 있습니다.
- [이메일](mailto:yeorinhieut@gmail.com) 혹은 디스코드 yeorinhieut 으로 연락 부탁드립니다.


