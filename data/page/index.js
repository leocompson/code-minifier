var iframe = document.querySelector('iframe').contentWindow;

var load = function () {
  var reload = document.getElementById("reload");
  var support = document.getElementById("support");
  var donation = document.getElementById("donation");
  /*  */
  support.addEventListener("click", function (e) {
    if (window === window.top) {
      var url = chrome.runtime.getManifest().homepage_url;
      chrome.tabs.create({"url": url, "active": true});
    }
  }, false);
  /*  */
  donation.addEventListener("click", function (e) {
    if (window === window.top) {
      var url = chrome.runtime.getManifest().homepage_url + "?reason=support";
      chrome.tabs.create({"url": url, "active": true});
    }
  }, false);
  /*  */
  window.removeEventListener("load", load, false);
  reload.addEventListener("click", function () {document.location.reload()});
};

window.addEventListener("message", function (e) {  
  if (e.data.from === "sandbox") {
    if (e.data.name === "context") {
      iframe.postMessage({"name": "context", "from": "app", "value": true}, '*');
    }
    /*  */
    if (e.data.name === "project") {
      fetch("../interface/resources/sample.js").then(function (e) {return e.text()}).then(function (e) {
        if (e) {
          iframe.postMessage({"name": "result", "from": "app", "value": e}, '*');
        }
      }).catch(function () {});
    }
    /*  */
    if (e.data.name === "download") {   
      var a = document.createElement('a');
      /*  */
      a.style.display = "none";  
      a.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(e.data.txt));
      a.setAttribute("download", e.data.filename);
      document.body.appendChild(a);
      a.click();
      /*  */
      window.setTimeout(function () {a.remove()}, 0);
    }
    /*  */
    if (e.data.name === "storage") {
      if (e.data.action === "remove") {
        chrome.storage.local.remove(e.data.id, function () {});
      }
      /*  */
      if (e.data.action === "set") {
        chrome.storage.local.set(e.data.storage, function () {});
      }
      /*  */
      if (e.data.action === "load") {
        chrome.storage.local.get(null, function (storage) {
          iframe.postMessage({"name": "storage", "from": "app", "action": "load", "storage": storage}, '*');
        });
      }
    }
  }
}, false);

document.addEventListener("DOMContentLoaded", function () {
  var toolbar = document.querySelector(".toolbar");
  if (toolbar) toolbar.style.display = window === window.top ? "block" : "none";
});

window.addEventListener("load", load, false);
