var fs       = require('fs'),
    path     = require('path'),
    shell    = require('shelljs'),
    express  = require('express'),
    ecstatic = require('ecstatic'),
    build    = require('./build-bundle.js'),

    server  = express(); 

/* Create directories for output */
build.output(); // Create output directories. 
build.bundle(); // Bundle entry js file. 

server.use(ecstatic({
  root: './',
  defaultExt: 'html'
}));

server.listen(8080);
console.log('server listening at :8080');
