async function fetchNovelContent(url) {
    const response = await fetch(url);

    if (!response.ok) {
        console.error(`Failed to fetch content from ${url}. Status: ${response.status}`);
        return null;
    }

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const content = doc.querySelector('#novel_content');

    if (!content) {
        console.error(`Failed to find '#novel_content' on the page: ${url}`);
        return null;
    }

    return cleanText(content.innerHTML);
}

function unescapeHTML(text) {
    const entities = {
        '&lt;': '<', '&gt;': '>', '&amp;': '&',
        '&quot;': '"', '&apos;': "'", '&#039;': "'",
        '&nbsp;': ' ', '&ndash;': '–', '&mdash;': '—',
        '&lsquo;': '‘', '&rsquo;': '’', '&ldquo;': '“', '&rdquo;': '”'
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
    text = text.replace(/<[^>]*>/g, '');
    text = unescapeHTML(text);

    return text;
}


async function downloadNovel(title, episodeLinks) {

    let novelText = `${title}\nDownloaded with novel-dl,\nhttps://github.com/yeorinhieut/novel-dl\n\n`;

    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    const targetElement = document.querySelector('#at-main > div.view-wrap > section > article > div.view-title > div > div > div.col-sm-8 > div:nth-child(3)');

    if (!targetElement) {
        console.error('Failed to find the target element for the progress bar.');
        return;
    }

    const progressContainer = document.createElement('div');
    progressContainer.style.textAlign = 'center';
    targetElement.appendChild(progressContainer);

    const progressBar = document.createElement('div');
    progressBar.style.width = '0%';
    progressBar.style.height = '15px';
    progressBar.style.backgroundColor = '#4CAF50';
    progressBar.style.marginTop = '10px';
    progressBar.style.borderRadius = '3px';
    progressContainer.appendChild(progressBar);

    const progressLabel = document.createElement('div');
    progressLabel.style.marginTop = '5px';
    progressContainer.appendChild(progressLabel);

    for (let i = episodeLinks.length - 1; i >= 0; i--) {
        const episodeUrl = episodeLinks[i];

        if (!episodeUrl.startsWith('https://booktoki')) {
            console.log(`Skipping invalid episode link: ${episodeUrl}`);
            continue;
        }

        console.log(`Downloading: ${title} - Episode ${episodeLinks.length - i}/${episodeLinks.length}`);

        const episodeContent = await fetchNovelContent(episodeUrl);

        if (!episodeContent) {
            console.error(`Failed to fetch content for episode: ${episodeUrl}`);
            continue;
        }

        novelText += episodeContent;

        const progress = ((episodeLinks.length - i) / episodeLinks.length) * 100;
        progressBar.style.width = `${progress}%`;
        progressLabel.textContent = `Downloading... ${progress.toFixed(2)}% - Episode ${episodeLinks.length - i}/${episodeLinks.length}`;

        await delay(1000);
    }

    progressContainer.parentNode.removeChild(progressContainer);

    const blob = new Blob([novelText], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${title}.txt`;
    a.click();
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

function runCrawler() {
    const novelPageRule = 'https://booktoki';
    const currentUrl = window.location.href;

    if (!currentUrl.startsWith(novelPageRule)) {
        console.log('This script should be run on the novel episode list page.');
        return;
    }
    const title = extractTitle();

    if (!title) {
        console.log('Failed to extract the novel title.');
        return;
    }

    console.log(`Task Appended: Preparing to download ${title}`);

    const episodeLinks = extractEpisodeLinks();

    if (episodeLinks.length === 0) {
        console.log('No episode links found.');
        return;
    }

    downloadNovel(title, episodeLinks);
}

runCrawler();
