package main

import (
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/PuerkitoBio/goquery"
	"github.com/fatih/color"
	"net/http"
)

func main() {
	fmt.Print("소설의 URL을 입력하세요: ")
	var url string
	fmt.Scanln(&url)

	fmt.Print("마지막 회차 번호를 입력하세요: ")
	var lastChapter int
	fmt.Scanln(&lastChapter)

	// 사용자 에이전트 설정
	userAgent := "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36"

	// URL에서 HTML 가져오기
	fmt.Println("페이지에서 HTML을 가져오는 중...")
	html, err := fetchHTML(url, userAgent)
	if err != nil {
		log.Fatalf("HTML 가져오기 실패: %v\n", err)
	}

	// HTML을 파싱하여 링크 추출
	links := extractLinks(html, lastChapter)

	// 추출된 링크를 파일에 저장
	err = saveLinksToFile(links, "links.txt")
	if err != nil {
		log.Fatalf("링크를 파일에 저장하는데 실패했습니다: %v\n", err)
	}

	fmt.Println(color.GreenString("링크를 성공적으로 저장했습니다."))
}

func fetchHTML(url, userAgent string) (string, error) {
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("User-Agent", userAgent)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return "", fmt.Errorf("HTTP 요청 실패. 응답 코드: %d", resp.StatusCode)
	}

	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		return "", err
	}

	html, err := doc.Html()
	if err != nil {
		return "", err
	}

	return html, nil
}

func extractLinks(html string, lastChapter int) []string {
	links := []string{}
	for i := 1; i <= lastChapter; i++ {
		selector := fmt.Sprintf("#serial-move > div > ul > li:nth-child(%d) > div.wr-subject > a", i)
		doc, _ := goquery.NewDocumentFromReader(strings.NewReader(html))
		link, _ := doc.Find(selector).Attr("href")
		if link != "" {
			links = append(links, link)
		}
	}
	return links
}

func saveLinksToFile(links []string, filename string) error {
	file, err := os.Create(filename)
	if err != nil {
		return err
	}
	defer file.Close()

	for _, link := range links {
		_, err := file.WriteString(link + "\n")
		if err != nil {
			return err
		}
	}

	return nil
}

