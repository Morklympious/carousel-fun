var fs         = require('fs'),
    shell      = require('shelljs'),
    browserify = require('browserify'),

    debounce    = require("lodash.debounce");

var builder = browserify("./src/entry.js", {
  debug: true
});

/**
 * Plugins for browserify!
 */
builder.plugin("modular-css/browserify", {
  // Output CSS file with all of your fancy scoped classes.
  css: "./dist/css/site.css",

  map: true,
  after: [
    require("postcss-import")
  ]
});

/**
 * This is a build function that just uses shell.js to run a bunch of
 * file manipulation code. 
 * 
 * I understand this could be done natively with the fs module, but 
 * shell commands are usually easier for developers to grok. 
 */
function _output() {
  shell.mkdir('-p', 'dist/css');
  shell.cp('-u', 'index.html', 'dist/index.html');
}

/**
 * This is a function that tells browserify to take our entry.js file and
 * process all of its dependencies so it's prepped and ready for the browser
 */
function _bundle() {
  var write = fs.writeFileSync;

  builder.bundle(function(err, output) {
    var now = new Date();
    var t   = (`${now.getHours()  }:${  now.getMinutes()  }:${  now.getSeconds()}`);

    if(err) {
      console.log(err);
      return;
    }

    write("./dist/bundle.js", output);
  });
}

// Run once so we can get the bundle. 
_output();
_bundle(); 

module.exports = {
  output: debounce(_output, 750),
  bundle: debounce(_bundle, 750),
  builder: builder
}

