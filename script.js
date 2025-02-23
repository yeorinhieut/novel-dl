async function fetchNovelContent(url) {
    const response = await fetch(url);

    if (!response.ok) {
        console.error(`Failed to fetch content from ${url}. Status: ${response.status}`);
        return null;
    }

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Extract episode title
    const titleElement = doc.querySelector('.toon-title');
    let episodeTitle = 'Untitled Episode';
    if (titleElement) {
        episodeTitle = titleElement.getAttribute('title') || 
                      titleElement.textContent.split('<br>')[0].trim() || 
                      'Untitled Episode';
    }

    const content = doc.querySelector('#novel_content');
    if (!content) {
        console.error(`Failed to find '#novel_content' on the page: ${url}`);
        return null;
    }

    let cleanedContent = cleanText(content.innerHTML);
    if (cleanedContent.startsWith(episodeTitle)) {
        cleanedContent = cleanedContent.slice(episodeTitle.length).trim();
    }

    return {
        episodeTitle: episodeTitle,
        content: cleanedContent
    };
}

function unescapeHTML(text) {
    const entities = {
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

    Object.entries(entities).forEach(([entity, replacement]) => {
        const regex = new RegExp(entity, 'g');
        text = text.replace(regex, replacement);
    });

    return text;
}

function cleanText(text) {
    text = text.replace(/<div>/g, '');
    text = text.replace(/<\/div>/g, '');
    text = text.replace(/<p>/g, '\n');
    text = text.replace(/<\/p>/g, '\n');
    text = text.replace(/<br\s*[/]?>/g, '\n');
    text = text.replace(/<img[^>]*>/gi, '[skipped image]');
    text = text.replace(/<[^>]*>/g, '');
    text = text.replace(/ {2,}/g, ' ');
    text = unescapeHTML(text);

    text = text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n\n')
        .replace(/\n{3,}/g, '\n\n');

    return text;
}

function createModal() {
    const modal = document.createElement('div');
    modal.id = 'downloadProgressModal';
    Object.assign(modal.style, {
        display: 'block',
        position: 'fixed',
        zIndex: '1',
        left: '0',
        top: '0',
        width: '100%',
        height: '100%',
        overflow: 'auto',
        backgroundColor: 'rgba(0,0,0,0.4)'
    });

    const modalContent = document.createElement('div');
    Object.assign(modalContent.style, {
        backgroundColor: '#fefefe',
        position: 'relative',
        margin: '15% auto 0',
        padding: '20px',
        border: '1px solid #888',
        width: '50%',
        textAlign: 'center'
    });

    modal.appendChild(modalContent);
    return {modal, modalContent};
}

async function loadScript(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

function sanitizeFilename(name) {
    return name.replace(/[/\\?%*:|"<>]/g, '_');
}

async function downloadNovel(title, episodeLinks, startEpisode) {
    const saveOption = prompt('저장 방식을 선택하세요:\n1 - 한 파일로 병합\n2 - 각 회차별 저장 (ZIP)', '1');
    if (!saveOption) return;
    
    const saveAsZip = saveOption === '2';
    let zip;
    
    if (saveAsZip) {
        try {
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
            zip = new JSZip();
        } catch (e) {
            alert('ZIP 라이브러리 로드 실패!');
            return;
        }
    }

    const {modal, modalContent} = createModal();
    document.body.appendChild(modal);

    const progressBar = document.createElement('div');
    Object.assign(progressBar.style, {
        width: '0%',
        height: '10px',
        backgroundColor: '#008CBA',
        marginTop: '10px',
        borderRadius: '3px'
    });
    modalContent.appendChild(progressBar);

    const progressLabel = document.createElement('div');
    progressLabel.style.marginTop = '5px';
    modalContent.appendChild(progressLabel);

    const startTime = Date.now();
    const startingIndex = episodeLinks.length - startEpisode;
    let novelText = `${title}\n\nDownloaded with novel-dl,\nhttps://github.com/yeorinhieut/novel-dl\n\n`;

    for (let i = startingIndex; i >= 0; i--) {
        const episodeUrl = episodeLinks[i];
        if (!episodeUrl.startsWith('https://booktoki')) continue;

        let result = await fetchNovelContent(episodeUrl);
        if (!result) {
            const userConfirmed = confirm(`CAPTCHA가 발견되었습니다!\n${episodeUrl}\n캡챠 해결 후 확인을 눌러주세요.`);
            if (!userConfirmed) continue;
            result = await fetchNovelContent(episodeUrl);
            if (!result) continue;
        }

        const {episodeTitle, content} = result;
        
        if (saveAsZip) {
            zip.file(`${sanitizeFilename(episodeTitle)}.txt`, content);
        } else {
            novelText += `${episodeTitle}\n\n${content}\n\n`;
        }

        const progress = ((startingIndex - i + 1) / (startingIndex + 1)) * 100;
        progressBar.style.width = `${progress}%`;

        const elapsed = Date.now() - startTime;
        const remaining = (elapsed / progress * (100 - progress)) || 0;
        progressLabel.textContent = `진행률: ${progress.toFixed(1)}% (남은 시간: ${Math.floor(remaining/60000)}분 ${Math.floor((remaining%60000)/1000)}초)`;

        await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));
    }

    document.body.removeChild(modal);

    if (saveAsZip) {
        const zipBlob = await zip.generateAsync({type: 'blob'});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(zipBlob);
        a.download = `${sanitizeFilename(title)}.zip`;
        a.click();
    } else {
        const blob = new Blob([novelText], {type: 'text/plain'});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${sanitizeFilename(title)}(${startEpisode}~${episodeLinks.length}).txt`;
        a.click();
    }
}

function extractTitle() {
    const titleElement = document.evaluate('//*[@id="content_wrapper"]/div[1]/span', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    return titleElement ? titleElement.textContent.trim() : null;
}

function extractEpisodeLinks() {
    const episodeLinks = [];
    const links = document.querySelectorAll('.item-subject');

    links.forEach(link => {
        const episodeLink = link.getAttribute('href');
        episodeLinks.push(episodeLink);
    });

    return episodeLinks;
}

async function fetchPage(url) {
    const response = await fetch(url);
    if (!response.ok) {
        console.error(`Failed to fetch page: ${url}. Status: ${response.status}`);
        return null;
    }
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return doc;
}

async function runCrawler() {
    const novelPageRule = 'https://booktoki';
    let currentUrl = window.location.href;

    // Clean URL
    const urlParts = currentUrl.split('?')[0];
    currentUrl = urlParts;

    if (!currentUrl.startsWith(novelPageRule)) {
        console.log('This script should be run on the novel episode list page.');
        return;
    }

    const title = extractTitle();

    if (!title) {
        console.log('Failed to extract the novel title.');
        return;
    }

    const totalPages = prompt(`소설 목록의 페이지 수를 입력하세요.
(1000화가 넘지 않는 경우 1, 1000화 이상부터 2~)`, '1');

    if (!totalPages || isNaN(totalPages)) {
        console.log('Invalid page number or user canceled the input.');
        return;
    }

    const totalPagesNumber = parseInt(totalPages, 10);
    const allEpisodeLinks = [];

    for (let page = 1; page <= totalPagesNumber; page++) {
        const nextPageUrl = `${currentUrl}?spage=${page}`;
        const nextPageDoc = await fetchPage(nextPageUrl);
        if (nextPageDoc) {
            const nextPageLinks = Array.from(nextPageDoc.querySelectorAll('.item-subject')).map(link => link.getAttribute('href'));
            allEpisodeLinks.push(...nextPageLinks);
        }
    }

    const startEpisode = prompt(`다운로드를 시작할 회차 번호를 입력하세요 (1 부터 ${allEpisodeLinks.length}):`, '1');

    if (!startEpisode || isNaN(startEpisode)) {
        console.log('Invalid episode number or user canceled the input.');
        return;
    }

    const startEpisodeNumber = parseInt(startEpisode, 10);

    if (startEpisodeNumber < 1 || startEpisodeNumber > allEpisodeLinks.length) {
        console.log('Invalid episode number. Please enter a number between 1 and the total number of episodes.');
        return;
    }

    console.log(`Task Appended: Preparing to download ${title} starting from episode ${startEpisodeNumber}`);

    downloadNovel(title, allEpisodeLinks, startEpisodeNumber);
}

runCrawler();
