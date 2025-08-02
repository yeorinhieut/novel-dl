// == Novel DL (Embedded) ==
// Booktoki episode downloader – Chrome-extension bundle
// This file is injected by content.js and provides the full crawler logic.

'use strict';

// ───────────────────────────────────────────────────────────────────────────────
// Constants
// ───────────────────────────────────────────────────────────────────────────────
const NOVEL_CONTENT_SELECTOR = '#novel_content';
const EPISODE_TITLE_SELECTOR  = '.toon-title';
const EPISODE_LINK_SELECTOR   = '.item-subject';
const NOVEL_PAGE_RULE         = 'https://booktoki';
const DOWNLOAD_DELAY_MS       = 5000;

// HTML entity map for unescapeHTML()
const HTML_ENTITIES = {
  '&lt;': '<',
  '&gt;': '>',
  '&amp;': '&',
  '&quot;': '"',
  '&apos;': "'",
  '&nbsp;': ' ',
  '&ndash;': '–',
  '&mdash;': '—',
  '&lsquo;': '‘',
  '&rsquo;': '’',
  '&ldquo;': '“',
  '&rdquo;': '”'
};

// ───────────────────────────────────────────────────────────────────────────────
// Utility helpers
// ───────────────────────────────────────────────────────────────────────────────
function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

function unescapeHTML(text) {
  for (const entity in HTML_ENTITIES) {
    const regex = new RegExp(entity, 'g');
    text = text.replace(regex, HTML_ENTITIES[entity]);
  }
  return text;
}

function cleanText(text) {
  text = text.replace(/(<div>|<\/div>)/g, '')
             .replace(/<p>|<\/p>/g, '\n')
             .replace(/<br\s*\/?>/g, '\n')
             .replace(/<img[^>]*>/gi, '[skipped image]')
             .replace(/<[^>]*>/g, '')
             .replace(/ {2,}/g, ' ');
  text = unescapeHTML(text);

  return text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .join('\n\n')
    .replace(/\n{3,}/g, '\n\n');
}

function createModal() {
  const modal = document.createElement('div');
  modal.id = 'downloadProgressModal';
  Object.assign(modal.style, {
    display: 'block',
    position: 'fixed',
    zIndex: '9999',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.4)',
    overflow: 'auto'
  });

  const modalContent = document.createElement('div');
  Object.assign(modalContent.style, {
    backgroundColor: '#fff',
    position: 'relative',
    margin: '12% auto 0',
    padding: '20px',
    border: '1px solid #888',
    width: '380px',
    maxWidth: '90%',
    textAlign: 'center',
    color: '#000'
  });

  modal.appendChild(modalContent);
  return { modal, modalContent };
}

function loadScript(url) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = url;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function sanitizeFilename(name) {
  return name.replace(/[\/\\?%*:|"<>]/g, '_');
}

// ───────────────────────────────────────────────────────────────────────────────
// Core network helpers
// ───────────────────────────────────────────────────────────────────────────────
async function fetchNovelContent(url) {
  const response = await fetch(url);
  if (!response.ok) {
    console.error(`[Novel DL] Failed to fetch ${url}: ${response.status}`);
    return null;
  }
  const html = await response.text();
  const doc  = new DOMParser().parseFromString(html, 'text/html');

  // title
  let episodeTitle = 'Untitled Episode';
  const titleEl = doc.querySelector(EPISODE_TITLE_SELECTOR);
  if (titleEl) {
    episodeTitle = titleEl.getAttribute('title') || titleEl.textContent.split('<br>')[0].trim();
  }

  // content
  const contentEl = doc.querySelector(NOVEL_CONTENT_SELECTOR);
  if (!contentEl) {
    console.error(`[Novel DL] Content selector not found in ${url}`);
    return null;
  }
  let cleanedContent = cleanText(contentEl.innerHTML);
  if (cleanedContent.startsWith(episodeTitle)) {
    cleanedContent = cleanedContent.slice(episodeTitle.length).trim();
  }

  return { episodeTitle, content: cleanedContent };
}

function saveAsTextFile(filename, content) {
  const blob = new Blob([content], { type: 'text/plain' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

// ───────────────────────────────────────────────────────────────────────────────
// Download routine
// ───────────────────────────────────────────────────────────────────────────────
async function downloadNovel(title, episodeLinks, startEpisode, endEpisode) {
  const saveOption = prompt('저장 방식을 선택하세요:\n1 - 한 파일로 병합\n2 - 각 회차별 저장 (ZIP)', '1');
  if (!saveOption) return;

  const saveAsZip = saveOption === '2';
  let zip;
  if (saveAsZip) {
    try {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
      zip = new JSZip();
    } catch (err) {
      alert('ZIP 라이브러리 로드 실패!');
      return;
    }
  }

  const { modal, modalContent } = createModal();
  document.body.appendChild(modal);

  const progressBar = document.createElement('div');
  Object.assign(progressBar.style, {
    width: '0%',
    height: '8px',
    backgroundColor: '#000',
    marginTop: '8px'
  });
  modalContent.appendChild(progressBar);

  const progressLabel = document.createElement('div');
  progressLabel.style.marginTop = '6px';
  modalContent.appendChild(progressLabel);

  const startTime     = Date.now();
  const startingIndex = episodeLinks.length - startEpisode;
  const endingIndex   = episodeLinks.length - endEpisode;
  let novelText       = `${title}\n\nDownloaded with novel-dl Chrome ext.\n\n`;

  for (let i = startingIndex; i >= endingIndex; i--) {
    const episodeUrl = episodeLinks[i];
    if (!episodeUrl.startsWith(NOVEL_PAGE_RULE)) continue;

    let result = await fetchNovelContent(episodeUrl);
    if (!result) {
      const cont = confirm(`CAPTCHA가 발견되었습니다!\n${episodeUrl}\n\n해결 후 확인을 눌러주세요.`);
      if (!cont) continue;
      result = await fetchNovelContent(episodeUrl);
      if (!result) continue;
    }

    const { episodeTitle, content } = result;
    if (saveAsZip) {
      zip.file(`${sanitizeFilename(episodeTitle)}.txt`, content);
    } else {
      novelText += `${episodeTitle}\n\n${content}\n\n`;
    }

    const progress = ((startingIndex - i + 1) / (startingIndex - endingIndex + 1)) * 100;
    progressBar.style.width = `${progress}%`;

    const elapsed   = Date.now() - startTime;
    const remaining = (elapsed / progress) * (100 - progress) || 0;
    progressLabel.textContent = `진행률: ${progress.toFixed(1)}% (남은 시간: ${Math.floor(remaining / 60000)}분 ${Math.floor((remaining % 60000) / 1000)}초)`;

    await delay(DOWNLOAD_DELAY_MS);
  }

  document.body.removeChild(modal);

  if (saveAsZip) {
    const blob = await zip.generateAsync({ type: 'blob' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = `${sanitizeFilename(title)}.zip`;
    a.click();
  } else {
    saveAsTextFile(`${sanitizeFilename(title)}(${startEpisode}~${endEpisode}).txt`, novelText);
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Extraction helpers
// ───────────────────────────────────────────────────────────────────────────────
function extractTitle() {
  const titleElement = document.evaluate('//*[@id="content_wrapper"]/div[1]/span', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  return titleElement ? titleElement.textContent.trim() : null;
}

function extractEpisodeLinks() {
  return Array.from(document.querySelectorAll(EPISODE_LINK_SELECTOR)).map((el) => el.getAttribute('href'));
}

async function fetchPage(url) {
  const res = await fetch(url);
  if (!res.ok) return null;
  const html = await res.text();
  return new DOMParser().parseFromString(html, 'text/html');
}

// ───────────────────────────────────────────────────────────────────────────────
// Main entry
// ───────────────────────────────────────────────────────────────────────────────
async function runCrawler() {
  let currentUrl = window.location.href.split('?')[0];
  if (!currentUrl.startsWith(NOVEL_PAGE_RULE)) {
    alert('이 스크립트는 북토기 소설 목록 페이지에서 실행해야 합니다.');
    return;
  }

  const title = extractTitle();
  if (!title) {
    alert('소설 제목을 추출하지 못했습니다.');
    return;
  }

  const totalPages = prompt('소설 목록의 페이지 수를 입력하세요.\n(1000화가 넘지 않는 경우 1, 1000화 이상부터 2~)', '1');
  if (!totalPages || isNaN(totalPages)) return;
  const totalPagesNumber = parseInt(totalPages, 10);

  const allEpisodeLinks = [];
  for (let page = 1; page <= totalPagesNumber; page++) {
    const nextPageUrl = `${currentUrl}?spage=${page}`;
    const doc = await fetchPage(nextPageUrl);
    if (doc) {
      const links = Array.from(doc.querySelectorAll(EPISODE_LINK_SELECTOR)).map((l) => l.getAttribute('href'));
      allEpisodeLinks.push(...links);
    }
    await delay(300);
  }

  const startEpisode = prompt(`다운로드를 시작할 회차 번호를 입력하세요 (1 부터 ${allEpisodeLinks.length}):`, '1');
  const endEpisode   = prompt(`다운로드를 끝낼 회차 번호를 입력하세요 (${startEpisode} 부터 ${allEpisodeLinks.length}):`, allEpisodeLinks.length);
  if (!startEpisode || !endEpisode || isNaN(startEpisode) || isNaN(endEpisode)) return;

  const s = parseInt(startEpisode, 10);
  const e = parseInt(endEpisode, 10);
  if (s < 1 || e < s || e > allEpisodeLinks.length) return;

  downloadNovel(title, allEpisodeLinks, s, e);
}

// expose for content script
window.runCrawler = runCrawler; 