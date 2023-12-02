javascript:(function() {
  var htmlContent = document.documentElement.outerHTML;
  var blob = new Blob([htmlContent], { type: 'text/html' });
  var a = document.createElement('a');
  a.href = window.URL.createObjectURL(blob);
  a.download = 'page.html';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
})();
