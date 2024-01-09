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

function createModal() {
    const modal = document.createElement('div');
    modal.id = 'downloadProgressModal';
    modal.style.display = 'block';
    modal.style.position = 'fixed';
    modal.style.zIndex = '1';
    modal.style.left = '0';
    modal.style.top = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.overflow = 'auto';
    modal.style.backgroundColor = 'rgba(0,0,0,0.4)';

    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = '#fefefe';
    modalContent.style.position = 'relative'; // Add position relative for centering
    modalContent.style.margin = '15% auto 0'; // Center vertically and leave space at the top
    modalContent.style.padding = '20px';
    modalContent.style.border = '1px solid #888';
    modalContent.style.width = '50%';
    modalContent.style.textAlign = 'center';

    modal.appendChild(modalContent);

    return { modal, modalContent };
}

async function downloadNovel(title, episodeLinks) {
    let novelText = `${title}\n\nDownloaded with novel-dl,\nhttps://github.com/yeorinhieut/novel-dl\n`;
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    const { modal, modalContent } = createModal();
    document.body.appendChild(modal);

    const progressBar = document.createElement('div');
    progressBar.style.width = '0%';
    progressBar.style.height = '10px';
    progressBar.style.backgroundColor = '#008CBA';
    progressBar.style.marginTop = '10px';
    progressBar.style.borderRadius = '3px';
    modalContent.appendChild(progressBar);

    const progressLabel = document.createElement('div');
    progressLabel.style.marginTop = '5px';
    modalContent.appendChild(progressLabel);

    const startTime = new Date();

    for (let i = episodeLinks.length - 1; i >= 0; i--) {
        const episodeUrl = episodeLinks[i];

        if (!episodeUrl.startsWith('https://booktoki')) {
            console.log(`Skipping invalid episode link: ${episodeUrl}`);
            continue;
        }

        const logText = `Downloading: ${title} - Episode ${episodeLinks.length - i}/${episodeLinks.length}`;
        console.log(logText);

        const episodeContent = await fetchNovelContent(episodeUrl);

        if (!episodeContent) {
            console.error(`Failed to fetch content for episode: ${episodeUrl}`);
            progressBar.style.display = 'none';
            progressLabel.style.display = 'none';
            const errorLabel = document.createElement('div');
            errorLabel.textContent = "An error occurred. Please check the console for details.";
            modalContent.appendChild(errorLabel);
            return;
        }

        novelText += episodeContent;

        const progress = ((episodeLinks.length - i) / episodeLinks.length) * 100;
        progressBar.style.width = `${progress}%`;

        const elapsedTime = new Date() - startTime;
        const remainingTime = (elapsedTime / progress) * (100 - progress);
        const remainingMinutes = Math.floor(remainingTime / (1000 * 60));
        const remainingSeconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

        progressLabel.textContent = `Downloading... ${progress.toFixed(2)}%  -  Remaining Time: ${remainingMinutes}m ${remainingSeconds}s`;

        await delay(1000);
    }

    document.body.removeChild(modal);

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
