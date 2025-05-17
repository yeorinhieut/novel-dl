(() => {
	fetch("https://cdn.jsdelivr.net/gh/yeorinhieut/novel-dl/script.min.js")
		.then((response) => {
			if (!response.ok) {
				throw new Error(`Failed to fetch script: ${response.statusText}`);
			}
			return response.text();
		})
		.then((scriptContent) => {
			const script = document.createElement("script");
			script.textContent = scriptContent;
			document.head.appendChild(script);
			console.log("Script loaded and executed.");
		})
		.catch((error) => {
			console.error(error);
		});
})();
