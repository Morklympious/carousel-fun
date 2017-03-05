/**
 * This is the serve file. It uses Browser-sync to watch over files and refresh on change.
 * It borrows its building functionality from the one-off build-default file, and reuses
 * that logic every time it detects a change.
 *
 * I'm using Node's file system to do file writing and a shell.js utility to help with
 * directory creation!
 */

/**
 * This file (somewhat) emulates the serve:dist gulp task.
 *
 * */

var sync   = require("browser-sync").create(),
    build  = require("./build-base"),
    run    = require("./build-default"),

    // Including debounce so we don't refresh 15000 times whenever the
    // dist directory changes
    debounce = require("lodash.debounce");

/**
 * Watchify is actually necessary for Modular CSS to run,
 * since it listens for an event ("update") that Watchify fires
 */
build.builder.plugin("watchify");
build.builder.on("update", Function.prototype); // Noop.

/**
 * Run the build and bundle functions at least once so our watchers
 * can refresh the browser.
 */
run();

/**
 * Initializing over the dist directory, with a delay that will allow for rapid
 * src directory file changes in case some smoking gun can't keep their fingers
 * off of the ctrl+s combo
 *
 * ... I'm talking of course, about myself.
 */

sync.init({
  server      : "./dist",
  reloadDelay : 1500
});

/**
 * Let's go ahead and just watch the entirety of the source directory
 * (Thanks for standalone file watching, browser-sync!)
 *
 * If there are any changes on our non-entry.js files, we'll hot reload.
 * Browserify will handle entry.js and tell Browser-sync to reload whenever
 * Browserify bundles.
 */
sync.watch("./src/**/*.*").on("change", run);

/**
 * In the event that anything in dist changes (by some third party build magic)
 * then we'll just refresh the whole shebang.
 */
sync.watch("./dist/**/*.*").on("change", debounce(sync.reload.bind(null, "./dist/index.html"), 1500));

