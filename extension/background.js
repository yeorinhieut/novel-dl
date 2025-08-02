// background.js – Novel DL orchestrator (MV3 service_worker)

const NOVEL_PAGE_RULE = "https://booktoki";
const LIST_SELECTORS = [
  ".item-subject",
  "#serial-move ul li .wr-subject a",
  "a.list-subject",
  "a[href*='/novel/'][class*='subject']"
];
const CONTENT_SELECTORS = {
  title: ".toon-title",
  content: "#novel_content",
};

let currentTask = null; // {total, completed, status, tabId}

// Keep track of captcha resolver
let captchaResolver=null;

chrome.action.onClicked.addListener((tab)=>{
  console.log('[Novel-DL] icon clicked, tab',tab.id);
  function trySend(retries){
    safeSend(tab.id, {action:"openConfig", tabId:tab.id}, ()=>{
      if(chrome.runtime.lastError && retries>0){
        // content script not ready yet, retry after delay
        setTimeout(()=>trySend(retries-1),300);
      }
    });
  }
  trySend(5);
});

function safeSend(tabId,msg,cb){
  chrome.tabs.sendMessage(tabId,msg,cb||(()=>{}));
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "startCrawl") {
    // unused now
  } else if (msg.action === "configReady") {
    console.log('[Novel-DL] configReady received', msg.config);
    startCrawl(msg.config);
    sendResponse({ ok: true });
  } else if (msg.action === "resumeCaptcha") {
        if(captchaResolver){
            console.log("[Novel-DL] Captcha resolved, resuming...");
            captchaResolver();
            captchaResolver = null;
        }
    }
});

async function startCrawl(cfg) {
  const { pages, startEp, endEp, delay, currentUrl, tabId } = cfg;
  // Step 1: collect links
  const baseUrl = (currentUrl || "").split("?")[0];
  const allEpisodeLinks = [];

  for (let p = 1; p <= pages; p++) {
    const url = `${baseUrl}?spage=${p}`;
    const links = await collectLinksFromPage(url);
    allEpisodeLinks.push(...links);
    await sleep(300);
  }

  const total = allEpisodeLinks.length;
  const s = Math.max(1, startEp);
  const e = Math.min(endEp, total);
  const slice = allEpisodeLinks.slice(total - e, total - s + 1).reverse();

  if (slice.length === 0) {
    currentTask = { status: "error", message: "회차 링크를 찾지 못했습니다." };
    chrome.tabs.sendMessage(tabId, { action: "taskUpdate", task: currentTask });
    return;
  }

  currentTask = { total: slice.length, completed: 0, status: "running", tabId };
  chrome.tabs.sendMessage(tabId, { action: "taskUpdate", task: currentTask });

  const results = [];
  for (let idx = 0; idx < slice.length; idx++) {
    const link = slice[idx];
    if (!link.startsWith(NOVEL_PAGE_RULE)) continue;
    const data = await extractEpisode(link, delay, tabId);
    if (data) results.push(data);

    currentTask.completed = results.length;
    chrome.tabs.sendMessage(tabId, { action: "taskUpdate", task: currentTask });
    console.log('[Novel-DL] progress', currentTask.completed,'/',currentTask.total);
  }

  // Step 4: merge & download as single .txt
  const merged = results
    .map((r) => `${r.title}\n\n${r.content}`)
    .join("\n\n");
  safeSend(tabId,{action:"downloadFile",filename:`${sanitize(documentTitle(results))}(${s}~${e}).txt`,text:merged});
  console.log('[Novel-DL] crawl done, send downloadFile msg');

  currentTask.status = "done";
  chrome.tabs.sendMessage(tabId, { action: "taskUpdate", task: currentTask });
}

async function collectLinksFromPage(url) {
  console.log('[Novel-DL] open list tab', url);
  const tabId = await createTab(url);
  await waitForComplete(tabId);
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: (sels) => {
      for (const s of sels) {
        const nodes = Array.from(document.querySelectorAll(s));
        if (nodes.length) return nodes.map((a) => a.getAttribute("href"));
      }
      return [];
    },
    args: [LIST_SELECTORS],
  });
  chrome.tabs.remove(tabId);
  return result || [];
}

async function extractEpisode(url, delay, tabId) {
  console.log('[Novel-DL] open episode', url);
  const tempTabId = await createTab(url);
  await waitForComplete(tempTabId);

  // scroll bottom
  await chrome.scripting.executeScript({
    target: { tabId: tempTabId },
    func: () => { window.scrollTo(0, document.body.scrollHeight); },
  });
  await sleep(800);

  let result = await chrome.scripting.executeScript({
    target: { tabId: tempTabId },
    func: (selMap) => {
      const titleEl = document.querySelector(selMap.title);
      const contentEl = document.querySelector(selMap.content);
      if (!contentEl) return null; // captcha indicator
      const title = titleEl ? (titleEl.getAttribute("title") || titleEl.textContent.trim()) : "Untitled";
      const content = contentEl ? contentEl.innerText || contentEl.textContent : "";
      return { title, content };
    },
    args: [CONTENT_SELECTORS],
  }).then(r => r[0].result);

  // Handle captcha
  if (!result || !result.content) {
    console.warn("[Novel-DL] Captcha or empty content detected at", url);
    await chrome.tabs.update(tempTabId, { active: true });
    safeSend(tabId, {action:"taskUpdate", task:{status:"captcha", url}});

    await new Promise(resolve => {
      captchaResolver = resolve;
    });

    // Retry after captcha solved
    result = await chrome.scripting.executeScript({
      target: { tabId: tempTabId },
      func: (selMap) => {
        const titleEl = document.querySelector(selMap.title);
        const contentEl = document.querySelector(selMap.content);
        if (!contentEl) return null;
        const title = titleEl ? (titleEl.getAttribute("title") || titleEl.textContent.trim()) : "Untitled";
        const content = contentEl ? contentEl.innerText || contentEl.textContent : "";
        return { title, content };
      },
      args: [CONTENT_SELECTORS],
    }).then(r => r[0].result);

    if(!result || !result.content){
      console.error("[Novel-DL] Failed to extract content after captcha, skipping.");
      chrome.tabs.remove(tempTabId);
      return null;
    }
  }

  await sleep(delay);
  chrome.tabs.remove(tempTabId);
  return result;
}

function createTab(url) {
  return new Promise((res) => {
    chrome.tabs.create({ url, active: false }, (tab) => res(tab.id));
  });
}

function waitForComplete(tabId) {
  return new Promise((resolve) => {
    chrome.tabs.get(tabId, (tab) => {
      if (!chrome.runtime.lastError && tab && tab.status === "complete") {
        return resolve();
      }
      const listener = (updatedId, info) => {
        if (updatedId === tabId && info.status === "complete") {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      };
      chrome.tabs.onUpdated.addListener(listener);
    });
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function sanitize(name) {
  return name.replace(/[\\/:*?"<>|]/g, "_");
}

function documentTitle(results) {
  return results.length ? sanitize(results[0].title.split(" ")[0]) : "novel";
}

// no longer used in service worker 