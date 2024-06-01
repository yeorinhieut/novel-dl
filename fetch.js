(function() {
    fetch('https://raw.githubusercontent.com/yeorinhieut/novel-dl/main/script.js')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch script: ${response.statusText}`);
            }
            return response.text();
        })
        .then(scriptContent => {
            const script = document.createElement('script');
            script.textContent = scriptContent;
            document.head.appendChild(script);
            console.log('Script loaded and executed.');
        })
        .catch(error => {
            console.error(error);
        });
})();
