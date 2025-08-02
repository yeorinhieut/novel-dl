// Inject the main Novel-DL logic into page context
(function () {
  const inject = () => {
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("novel-dl.js");
    script.type = "text/javascript";
    script.onload = () => script.remove();
    (document.head || document.documentElement).appendChild(script);
  };

  // Ensure we only inject once per page
  if (!window.__NOVEL_DL_INJECTED__) {
    window.__NOVEL_DL_INJECTED__ = true;
    inject();
  }

  // Listen for popup messages and background task updates
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if(request.action==="openConfig"){openConfigModal(request.tabId);return;}
    if (request.action === "runCrawler") {
      if (typeof window.runCrawler === "function") {
        window.runCrawler();
        sendResponse({ ok: true });
      } else {
        console.warn("[Novel DL] runCrawler() not found on page yet.");
        sendResponse({ ok: false });
      }
    }
    if (request.action === "taskUpdate") {
      updateModal(request.task);
    }
    if(request.action==="downloadFile"){
      const blob=new Blob([request.text],{type:"text/plain"});
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");
      a.href=url;
      a.download=request.filename||"novel.txt";
      a.style.display="none";
      document.body.appendChild(a);
      a.click();
      setTimeout(()=>{URL.revokeObjectURL(url);a.remove();},1000);
      updateModal({status:"done"});
    }
    return true; // keep the messaging channel open for async sendResponse
  });

  // simple modal implementation
  // ------------------------ CONFIG INPUT MODAL ---------------------------
  function openConfigModal(tabId) {
    if (document.getElementById("nd-config-modal")) return;
    const overlay=document.createElement("div");
    overlay.id="nd-config-modal";
    Object.assign(overlay.style,{position:"fixed",left:0,top:0,width:"100%",height:"100%",background:"rgba(0,0,0,0.4)",zIndex:9999,display:"flex",justifyContent:"center",alignItems:"center",fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI',sans-serif"});
    const box=document.createElement("div");
    Object.assign(box.style,{background:"#fff",color:"#000",padding:"24px 28px",borderRadius:"8px",width:"320px"});
    box.innerHTML=`<h3 style="margin-top:0;margin-bottom:16px;font-size:18px">Novel DL 설정</h3>
    <label>시작 회차<br/><input id="nd-start" type="number" value="1" min="1" style="width:100%;margin-bottom:8px"/></label>
    <label>종료 회차<br/><input id="nd-end" type="number" value="1" min="1" style="width:100%;margin-bottom:8px"/></label>
    <label>딜레이(ms)<br/><input id="nd-delay" type="number" value="5000" min="500" style="width:100%;margin-bottom:16px"/></label>
    <button id="nd-start-btn" style="width:100%;padding:8px 0">시작</button>`;
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    // Auto-detect total pages
    let lastPage = 1;
    const pageLinks = document.querySelectorAll(".pagination li a[href*='spage=']");
    if (pageLinks.length > 0) {
        const pageNumbers = Array.from(pageLinks)
            .map(a => new URLSearchParams(new URL(a.href).search).get('spage'))
            .map(Number)
            .filter(n => !isNaN(n));
        if (pageNumbers.length > 0) {
            lastPage = Math.max(...pageNumbers);
        }
    }
    console.log("[Novel-DL] Auto-detected pages:", lastPage);

    box.querySelector("#nd-start-btn").addEventListener("click",async ()=>{
      const cfg={
        pages:lastPage,
        startEp:parseInt(box.querySelector("#nd-start").value,10)||1,
        endEp:parseInt(box.querySelector("#nd-end").value,10)||1,
        delay:parseInt(box.querySelector("#nd-delay").value,10)||5000,
        currentUrl:window.location.href.split('?')[0],
        tabId:tabId
      };
      console.log("[Novel-DL] Config submitted (to background)", cfg);
      chrome.runtime.sendMessage({action:"configReady",config:cfg});
      document.body.removeChild(overlay);
      ensureModal();
      barEl._label.textContent = "대기 중...";
    });
  }

  // simple modal implementation
  let modalEl = null;
  let barEl = null;
  function ensureModal() {
    if (modalEl) return;
    modalEl = document.createElement("div");
    Object.assign(modalEl.style, {
      position: "fixed",
      left: 0,
      top: 0,
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0,0,0,0.4)",
      zIndex: 10000,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      color: "#fff",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    });
    const inner = document.createElement("div");
    Object.assign(inner.style, {
      background: "#ffffff",
      color: "#333333",
      padding: "24px 32px",
      borderRadius: "10px",
      width: "300px",
      boxShadow:"0 8px 30px rgba(0,0,0,0.15)",
      textAlign: "center",
      border: "1px solid #e9e9e9"
    });
    const title = document.createElement("h3");
    title.textContent = "Novel DL";
    Object.assign(title.style, { margin: "0 0 16px", fontSize: "16px", fontWeight:"600", color: "#111" });
    inner.appendChild(title);
    barEl = document.createElement("div");
    Object.assign(barEl.style, {
      width: "100%",
      height: "8px",
      background: "#f0f0f0",
      borderRadius: "8px",
      overflow: "hidden",
    });
    const barInner = document.createElement("div");
    barInner.style.height = "100%";
    barInner.style.width = "0%";
    barInner.style.background = "linear-gradient(90deg, #4e8cff, #2e6cdf)";
    barInner.style.transition = "width 0.2s ease-out";
    barEl.appendChild(barInner);
    barEl._inner = barInner;
    inner.appendChild(barEl);
    const lbl = document.createElement("div");
    lbl.style.marginTop = "10px";
    lbl.style.fontSize = "13px";
    lbl.style.color = "#555";
    inner.appendChild(lbl);
    barEl._label = lbl;
    // close button (hidden until done)
    const closeBtn=document.createElement("button");
    closeBtn.textContent="닫기";
    Object.assign(closeBtn.style,{display:"none",marginTop:"20px",padding:"8px 24px",border:"1px solid #ddd",background:"#f5f5f5",color:"#555",borderRadius:"6px",cursor:"pointer", fontWeight: "500"});
    closeBtn.onmouseover = ()=>closeBtn.style.background="#eee";
    closeBtn.onmouseout = ()=>closeBtn.style.background="#f5f5f5";
    closeBtn.onclick=()=>{modalEl.remove();modalEl=null;};
    inner.appendChild(closeBtn);
    barEl._close=closeBtn;

    // Captcha resume button
    const resumeBtn=document.createElement("button");
    resumeBtn.textContent="재개";
    Object.assign(resumeBtn.style,{display:"none",marginTop:"12px",padding:"8px 24px",border:"none",background:"#ffc107",color:"#212529",borderRadius:"6px",cursor:"pointer",fontWeight:"bold"});
    resumeBtn.onclick = () => {
        chrome.runtime.sendMessage({action:"resumeCaptcha"});
        resumeBtn.style.display="none";
        barEl._label.textContent = "재시도 중...";
    };
    inner.appendChild(resumeBtn);
    barEl._resume=resumeBtn;

    modalEl.appendChild(inner);
    document.body.appendChild(modalEl);
  }

  function updateModal(task) {
    if (!task) return;
    ensureModal();

    if (task.status === "captcha") {
        barEl._label.innerHTML = `캡챠가 감지되었습니다.<br/>새로 열린 탭에서 해결 후 아래 버튼을 누르세요.<br/><small>${task.url}</small>`;
        barEl._resume.style.display = 'inline-block';
        return;
    }
    if (task.status === "error") {
      barEl._inner.style.width = "0%";
      barEl._inner.style.background = "#e74c3c";
      barEl._label.textContent = task.message || "오류 발생";
      return;
    }
    if (task.status === "done") {
      barEl._label.textContent="완료";
      barEl._close.style.display="inline-block";
      return;
    }
    const pct = ((task.completed / task.total) * 100).toFixed(1);
    barEl._inner.style.width = pct + "%";
    barEl._label.textContent = `${task.completed}/${task.total} (${pct}%)`;
  }

  // (이전 in-page 크롤러 제거 ‑ background 탭 방식으로 이동)
})(); 