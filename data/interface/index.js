var config  = {
  "container": {},
  "window": {
    "normal": chrome && chrome.storage && chrome.storage.local ? true : false
  },
  "codemirror": {
    "editor": {
      "input": null,
      "output": null,
    },
    "options": {
      "indentUnit": 2,
      "dragDrop": true,
      "tabMode": "indent",
      "lineNumbers": true,
      "lineWrapping": true,
      "matchBrackets": true,
      "mode": "text/javascript"
    }
  },
  "render": function (e) {
    if (e.data.from === "app") {
      if (e.data.name === "context") {
        config.storage.load(config.app.start);
      }
      /*  */
      if (e.data.name === "result") {
        config.codemirror.editor.input.setValue(e.data.value);
        window.setTimeout(function () {minifybutton.click()}, 300);
      }
      /*  */
      if (e.data.name === "storage") {
        if (e.data.action === "load") {
          config.storage.local = e.data.storage;
          config.storage.callback();
        }
      }
      /*  */
      if (e.data.name === "theme") {
        if (e.data.action === "toggle") {
          document.documentElement.setAttribute("theme", e.data.theme);
          config.codemirror.editor.input.setOption("theme", e.data.theme === "dark" ? "material-darker" : "default");
          config.codemirror.editor.output.setOption("theme", e.data.theme === "dark" ? "material-darker" : "default");
        }
      }
    }
  },
  "minifier": {
    "language": '',
    "options": {
      'a': {
        "ecma": 5,
        "ie8": false,
        "mangle": true,
        "module": false,
        "compress": true,
        "keep_fnames": false,
        "keep_classnames": false,
      },
      'b': {
        "minifyCSS": true,
        "removeComments": true,
        "useShortDoctype": false,
        "collapseWhitespace": true,
        "removeOptionalTags": false,
        "removeEmptyElements": false,
        "minifyJS": {"mangle": true},
        "removeAttributeQuotes": false,
        "removeEmptyAttributes": false,
        "removeCommentsFromCDATA": true,
        "removeRedundantAttributes": true,
        "collapseBooleanAttributes": true,
        "processConditionalComments": true,
        "removeScriptTypeAttributes": true,
        "collapseInlineTagWhitespace": false,
        "removeStyleLinkTypeAttributes": true
      }
    }
  },
  "storage": {
    "local": {},
    "callback": null,
    "read": function (id) {return config.storage.local[id]},
    "load": function (callback) {
      if (config.window.normal) {
        chrome.storage.local.get(null, function (e) {
          config.storage.local = e;
          callback();
        });
      } else {
        window.top.postMessage({"name": "storage", "from": "sandbox", "action": "load"}, '*');
        config.storage.callback = callback;
      }
    },
    "write": function (id, data) {
      if (id) {
        if (data !== '' && data !== null && data !== undefined) {
          let tmp = {};
          tmp[id] = data;
          config.storage.local[id] = data;
          if (config.window.normal) {
            chrome.storage.local.set(tmp, function () {});
          } else {
            window.top.postMessage({"name": "storage", "from": "sandbox", "action": "set", "storage": tmp}, '*');
          }
        } else {
          delete config.storage.local[id];
          if (config.window.normal) {
            chrome.storage.local.remove(id, function () {});
          } else {
            window.top.postMessage({"name": "storage", "from": "sandbox", "action": "remove", "id": id}, '*');
          }
        }
      }
    }
  },
  "load": function () {
    const clear = document.getElementById("clear");
    const select = document.getElementById("select");
    const fileio = document.getElementById("fileio");
    const language = document.getElementById("language");
    const download = document.getElementById("download");
    const clipboard = document.getElementById("clipboard");
    const file = document.querySelector("input[type='file']");
    const minifybutton = document.getElementById("minifybutton");
    /*  */
    fileio.addEventListener("click", function () {file.click()}, false);
    download.addEventListener("click", config.app.download.result, false);
    /*  */
    clear.addEventListener("click", function () {
      config.storage.write("reset", false);
      config.codemirror.editor.input.setValue('');
      config.codemirror.editor.output.setValue('');
    }, false);
    /*  */
    select.addEventListener("click", function () {
      if (config.codemirror.editor.output) {
        config.codemirror.editor.output.execCommand("selectAll");
      }
    }, false);
    /*  */
    language.addEventListener("change", function (e) {
      config.minifier.language = e.target.value;
      config.storage.write("language", config.minifier.language);
      /*  */
      config.app.update.editor();
    }, false);
    /*  */
    clipboard.addEventListener("click", function () {
      if (config.codemirror.editor.output) {
        const textarea = document.createElement("textarea");
        /*  */
        select.click();
        document.body.appendChild(textarea);
        textarea.value = config.codemirror.editor.output.getValue();
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      }
    }, false);
    /*  */
    file.addEventListener("change", function (e) {
      if (e.target) {
        if (e.target.files) {
          if (e.target.files[0]) {
            config.app.file.process(e.target.files[0], function (txt) {
              config.codemirror.editor.input.setValue(txt);
              window.setTimeout(function () {minifybutton.click()}, 300);
            });
          }
        }
      }
    });
    /*  */
    minifybutton.addEventListener("click", async function () {
      const txt = config.codemirror.editor.input.getValue();
      if (txt) {
        try {
          const tmp = config.minifier.language.replace("text/", '');
          /*  */
          if (tmp === "javascript") {
            config.app.engine = Terser.minify;
            const result = await config.app.engine(txt, config.minifier.options.a);
            if (result) {
              if (result.code) {
                config.codemirror.editor.output.setValue(result.code);
              }
            }
          } else {
            config.app.engine = require("html-minifier-terser").minify;
            const result = config.app.engine(txt, config.minifier.options.b);          
            if (result) {
              config.codemirror.editor.output.setValue(result);
            }
          }
        } catch (e) {
          window.alert("An error has occurred! Please change the input language and try again.");
        }
      }
    }, false);
    /*  */
    if (config.window.normal) {
      config.storage.load(config.app.start);
    } else {
      window.top.postMessage({"name": "context", "from": "sandbox"}, '*');
    }
    /*  */
    window.removeEventListener("load", config.load, false);
  },
  "app": {
    "engine": '',
    "show": {
      "error": {
        "message": function (e) {
          const fileio = document.getElementById("fileio");
          const minifybutton = document.getElementById("minifybutton");
          /*  */
          fileio.disabled = false;
          minifybutton.disabled = false;
          minifybutton.value = "Minify";
          /*  */
          config.codemirror.editor.output.setValue(JSON.stringify(e, null, 2));
        }
      }
    },
    "reset": {
      "editor": function () {        
        const reset = config.storage.read("reset") !== undefined ? config.storage.read("reset") : true;
        if (reset) {
          if (config.window.normal) {
            fetch("resources/sample.js").then(function (e) {return e.text()}).then(function (e) {
              if (e) {
                config.codemirror.editor.input.setValue(e);
                window.setTimeout(function () {minifybutton.click()}, 300);
              }
            }).catch(function () {
              config.app.show.error.message("Error: could not find the input file!");
            });
          } else {
            window.top.postMessage({"name": "project", "from": "sandbox", "action": "get"}, '*');
          }
        }
      }
    },
    "download": {
      "result": function () {
        const txt = config.codemirror.editor.output.getValue();
        if (txt) {
          const tmp = config.minifier.language.replace("text/", '');
          const filename = config.app.file.name ? "beautified-" + config.app.file.name : "result." + (tmp === "javascript" ? "js" : tmp);
          /*  */
          if (config.window.normal) {
            const a = document.createElement('a');
            /*  */
            a.style.display = "none";  
            a.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(e.data.txt));
            a.setAttribute("download", e.data.filename);
            document.body.appendChild(a);
            a.click();
            /*  */
            window.setTimeout(function () {a.remove()}, 0);
          } else {
            window.top.postMessage({"name": "download", "from": "sandbox", "filename": filename, "txt": txt}, '*');
          }
        }
      }
    },
    "file": {
      "name": '',
      "process": function (file, callback) {
        if (!file) return;
        /*  */
        const type = file.type; 
        config.app.file.name = file.name;
        const language = document.getElementById("language");
        /*  */
        if (type === "text/css" || type === "text/html" || type === "text/javascript") {
          language.value = type;
          language.dispatchEvent(new Event("change"));
        }
        /*  */
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = function (e) {
          const content = e.target.result;
          if (content) callback(content);
        };
      }
    },
    "update": {
      "style": function () {
        config.container.input = document.querySelector(".input");
        config.container.header = document.querySelector(".header");
        config.container.output = document.querySelector(".output");
        /*  */
        const offset = parseInt(window.getComputedStyle(config.container.header).height);
        config.container.input.style.height = window.innerWidth < 700 ? "calc(50vh - " + (offset / 2 + 15) + "px)" : "calc(100vh - " + (offset + 15) + "px)";
        config.container.output.style.height = window.innerWidth < 700 ? "calc(50vh - " + (offset / 2 + 15) + "px)" : "calc(100vh - " + (offset + 15) + "px)";
      },
      "editor": function () {
        try {
          if (config.minifier.language) {
            config.codemirror.options.mode = config.minifier.language;
            /*  */
            if (config.codemirror.editor.input) {
              config.codemirror.editor.input.setOption("mode", config.codemirror.options.mode);
            }
            /*  */
            if (config.codemirror.editor.output) {
              config.codemirror.editor.output.setOption("mode", config.codemirror.options.mode);
            }
          }
        } catch (e) {
          config.app.show.error.message(e);
        }
      }
    },
    "start": function () {
      const input = document.getElementById("input");
      const output = document.getElementById("output");
      const language = document.getElementById("language");
      const settings = document.querySelector(".settings");
      const minifybutton = document.getElementById("minifybutton");
      const theme = config.storage.read("theme") !== undefined ? config.storage.read("theme") : "light";
      /*  */
      config.container.inputs = [...settings.querySelectorAll("input")];
      document.documentElement.setAttribute("theme", theme !== undefined ? theme : "light");
      config.minifier.language = config.storage.read("language") !== undefined ? config.storage.read("language") : "text/javascript";
      config.minifier.options = config.storage.read("options") !== undefined ? config.storage.read("options") : config.minifier.options;
      /*  */
      language.value = config.minifier.language;
      config.codemirror.options.mode = config.minifier.language;
      config.codemirror.editor.input = CodeMirror.fromTextArea(input, config.codemirror.options);
      config.codemirror.editor.output = CodeMirror.fromTextArea(output, config.codemirror.options);
      config.codemirror.editor.input.setOption("theme", theme === "dark" ? "material-darker" : "default");
      config.codemirror.editor.output.setOption("theme", theme === "dark" ? "material-darker" : "default");
      /*  */
      config.container.inputs.map(function (input) {
        if (input.id in config.minifier.options.a) {
          if (config.minifier.options.a[input.id] !== undefined) {
            const type = input.getAttribute("type");
            if (type !== "object") {
              input[type === "checkbox" ? "checked" : "value"] = config.minifier.options.a[input.id];
            }
          }
        }
        /*  */
        if (input.id in config.minifier.options.b) {
          if (config.minifier.options.b[input.id] !== undefined) {
            const type = input.getAttribute("type");
            if (type !== "object") {
              input[type === "checkbox" ? "checked" : "value"] = config.minifier.options.b[input.id];
            }
          }
        }
        /*  */
        input.addEventListener("change", function (e) {
          const tmp = {};
          const type = {};
          const object = {};
          /*  */
          object.a = config.minifier.options.a[e.target.id] !== undefined;
          if (object.a) {
            tmp.a = config.minifier.options.a;
            type.a = e.target.getAttribute("type");
            tmp.a[e.target.id] = e.target[type.a === "checkbox" ? "checked" : "value"];
            config.minifier.options.a = tmp.a;
          }
          /*  */
          object.b = config.minifier.options.b[e.target.id] !== undefined;
          if (object.b) {
            tmp.b = config.minifier.options.b;
            type.b = e.target.getAttribute("type");
            tmp.b[e.target.id] = e.target[type.b === "checkbox" ? "checked" : "value"];
            config.minifier.options.b = tmp.b;
          }
          /*  */          
          config.storage.write("options", config.minifier.options);
          minifybutton.click();
        }, false);
      });
      /*  */      
      if (config.minifier.language === "text/javascript") {
        config.app.reset.editor();
      }
      /*  */
      config.app.update.style();
      config.app.update.editor();
    }
  }
};

window.addEventListener("load", config.load, false);
window.addEventListener("message", config.render, false);
