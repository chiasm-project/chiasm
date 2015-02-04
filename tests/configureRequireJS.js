// This script contains setup functionality common to all tests
// relating to RequireJS and sharing module paths between the browser
// and NodeJS.
//
// Created by Curran Kelleher Feb 2015

// Load RequireJS for use in unit tests.
// "var" is omitted intentionally to induce a global variable,
// so the requireJSConfig file can run properly in "eval".
// See http://stackoverflow.com/questions/24522719/node-js-global-eval-throwing-referenceerror
requirejs = require("requirejs");

// Configure AMD module paths.
// Using eval like this seems to be the simplest way to 
// share module paths between the browser and unit tests.
eval(require("../requireJSConfig.js"));

// Export the configured requirejs for use in unit tests.
module.exports = requirejs;
