
# novel-dl (v2 Alpha)

**⚠️ 경고: 이 버전은 아직 개발 중인 알파 버전입니다. 예기치 않은 오류가 발생할 수 있으며, 기능이 불안정할 수 있습니다.**

[![Hits](https://hits.sh/github.com/yeorinhieut/novel-dl.svg)](https://hits.sh/github.com/yeorinhieut/novel-dl/)

**기존 북마크/콘솔 스크립트는 더 이상 지원되지 않으니, 아래의 확장 프로그램 설치 방법을 이용해 주세요.**

## 설치 (크롬 브라우저 권장)

### 1. 확장 프로그램 파일 다운로드
- 아래 `extension.zip` 파일을 다운로드하세요.
- **[Download extension.zip](https://raw.githubusercontent.com/yeorinhieut/novel-dl/main/extension.zip)**

  *또는, 이 저장소를 클론하여 직접 빌드할 수도 있습니다:*
  ```bash
  git clone https://github.com/yeorinhieut/novel-dl.git
  cd novel-dl
  sh deploy.sh
  ```

### 2. 개발자 모드 활성화
- 크롬 브라우저에서 주소창에 `chrome://extensions`를 입력하여 확장 프로그램 관리 페이지로 이동합니다.
- 우측 상단의 **'개발자 모드'** 토글을 활성화합니다.

### 3. 확장 프로그램 로드
- **'압축해제된 확장 프로그램을 로드합니다'** 버튼을 클릭합니다.
- `extension.zip`의 압축을 해제한 폴더를 선택하여 로드합니다.

## 사용법
1. 다운로드할 소설의 회차 목록 페이지로 이동합니다.
2. 브라우저의 확장 프로그램 아이콘(퍼즐 모양)을 클릭하고, `novel-dl`을 찾아 아이콘을 누릅니다.
3. 페이지에 설정 모달이 나타나면 시작/종료 회차와 딜레이를 설정하고 '시작' 버튼을 누릅니다.
4. 페이지에 진행 상황을 나타내는 모달이 표시되며, 완료 시 자동으로 텍스트 파일이 다운로드됩니다.
5. 캡챠(보안문자)가 감지되면 작업이 일시정지되고 새 탭이 열립니다. 해당 탭에서 캡챠를 해결한 후, 원래 탭의 모달에 나타난 '재개' 버튼을 눌러 다운로드를 계속합니다.

## FAQ

### 오류가 발생했습니다.
알파 버전이므로 오류가 발생할 가능성이 높습니다. 문제가 발생하면 [issues](https://github.com/yeorinhieut/novel-dl/issues)에 구체적인 상황(오류 메시지, 시도한 소설 URL 등)과 함께 제보해 주세요.

### 개선 사항을 요청하고 싶습니다.
기능 개선이나 아이디어 제안은 언제나 환영입니다. [issues](https://github.com/yeorinhieut/novel-dl/issues)에 자유롭게 의견을 남겨주세요.

---
## 문의
- 기타 문의는 [이메일](mailto:yeorinhieut@gmail.com) 혹은 디스코드 `yeorinhieut` 으로 연락 부탁드립니다.


