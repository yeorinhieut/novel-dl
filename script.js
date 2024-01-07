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

function cleanText(text) {
    text = text.replace(/<div>/g, '');
    text = text.replace(/<\/div>/g, '');
    text = text.replace(/<p>/g, '\n');
    text = text.replace(/<\/p>/g, '\n');
    text = text.replace(/<br\s*[/]?>/g, '\n');
    text = text.replace(/<[^>]*>/g, '');

    return text;
}

async function downloadNovel(title, episodeLinks) {
    let novelText = '';
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

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

        await delay(1000);
    }

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

    const episodeLinks = extractEpisodeLinks();

    if (episodeLinks.length === 0) {
        console.log('No episode links found.');
        return;
    }

    console.log(`Task Appended: Preparing to download ${title}`);

    downloadNovel(title, episodeLinks);
}

runCrawler();
