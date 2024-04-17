var config = {
  "iframe": {
    "window": document.querySelector("iframe").contentWindow
  },
  "addon": {
    "homepage": function () {
      return chrome.runtime.getManifest().homepage_url;
    }
  },
  "resize": {
    "timeout": null,
    "method": function () {
      if (config.port.name === "win") {
        if (config.resize.timeout) window.clearTimeout(config.resize.timeout);
        config.resize.timeout = window.setTimeout(async function () {
          const current = await chrome.windows.getCurrent();
          /*  */
          config.storage.write("interface.size", {
            "top": current.top,
            "left": current.left,
            "width": current.width,
            "height": current.height
          });
        }, 1000);
      }
    }
  },
  "port": {
    "name": '',
    "connect": function () {
      config.port.name = "webapp";
      const context = document.documentElement.getAttribute("context");
      /*  */
      if (chrome.runtime) {
        if (chrome.runtime.connect) {
          if (context !== config.port.name) {
            if (document.location.search === "?tab") config.port.name = "tab";
            if (document.location.search === "?win") config.port.name = "win";
            /*  */
            chrome.runtime.connect({
              "name": config.port.name
            });
          }
        }
      }
      /*  */
      document.documentElement.setAttribute("context", config.port.name);
    }
  },
  "storage": {
    "local": {},
    "read": function (id) {
      return config.storage.local[id];
    },
    "load": function (callback) {
      chrome.storage.local.get(null, function (e) {
        config.storage.local = e;
        callback();
      });
    },
    "write": function (id, data) {
      if (id) {
        if (data !== '' && data !== null && data !== undefined) {
          let tmp = {};
          tmp[id] = data;
          config.storage.local[id] = data;
          chrome.storage.local.set(tmp, function () {});
        } else {
          delete config.storage.local[id];
          chrome.storage.local.remove(id, function () {});
        }
      }
    }
  },
  "load": function () {
    const reload = document.getElementById("reload");
    const support = document.getElementById("support");
    const donation = document.getElementById("donation");
    /*  */
    reload.addEventListener("click", function () {
      document.location.reload();
    });
    /*  */
    support.addEventListener("click", function (e) {
      if (window === window.top) {
        const url = config.addon.homepage();
        chrome.tabs.create({"url": url, "active": true});
      }
    }, false);
    /*  */
    donation.addEventListener("click", function (e) {
      if (window === window.top) {
        const url = config.addon.homepage() + "?reason=support";
        chrome.tabs.create({"url": url, "active": true});
      }
    }, false);
    /*  */
    window.removeEventListener("load", config.load, false);
  },
  "render": function (e) {  
    if (e.data.from === "sandbox") {
      if (e.data.name === "context") {
        config.iframe.window.postMessage({"name": "context", "from": "app", "value": true}, '*');
      }
      /*  */
      if (e.data.name === "project") {
        fetch("../interface/resources/sample.js").then(function (e) {return e.text()}).then(function (e) {
          if (e) {
            config.iframe.window.postMessage({"name": "result", "from": "app", "value": e}, '*');
          }
        }).catch(function () {});
      }
      /*  */
      if (e.data.name === "download") {   
        const a = document.createElement('a');
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
            config.iframe.window.postMessage({"name": "storage", "from": "app", "action": "load", "storage": storage}, '*');
          });
        }
      }
    }
  }
};

config.port.connect();

window.addEventListener("load", config.load, false);
window.addEventListener("message", config.render, false);
window.addEventListener("resize", config.resize.method, false);
