// This script contains setup functionality common to all tests
// relating to RequireJS and sharing module paths between the browser
// and NodeJS.
//
// This module, when required using Node's "require()", returns
// an instance of RequireJS that is configured with module paths
// found in ../requireJSConfig.js, which is also used in the browser.
//
// Created by Curran Kelleher Feb 2015

// Load RequireJS for use in unit tests.
// "var" is omitted intentionally to induce a global variable,
// so the requireJSConfig file can access requirejs in "eval".
// See http://stackoverflow.com/questions/24522719/node-js-global-eval-throwing-referenceerror
requirejs = require("requirejs");

// Configure AMD module paths.
requirejs.config({

  baseUrl: ".",

  // Set up the Chiasm package.
  // https://github.com/curran/chiasm
  packages: [{
    name: "chiasm",
    location: "src/core"
  }],

  // Set up paths for Bower dependencies.
  // Uses github.com/curran/cdn
  paths: {

    // Visualization library.
    // http://d3js.org/
    d3: "bower_components/d3/d3.min",

    // Reactive model library.
    // https://github.com/curran/model
    model: "bower_components/model/dist/model",

    // Functional programming utilities.
    // http://benmccormick.org/2014/11/12/underscore-vs-lodash/
    lodash: "bower_components/lodash/lodash.min",

    // Asynchronous control flow.
    // https://github.com/caolan/async
    async: "bower_components/async/lib/async",

    // Configure paths for plugins loaded at runtime.
    plugins: "src/plugins/"

  }
});

// Export the configured requirejs for use in unit tests.
module.exports = requirejs;
