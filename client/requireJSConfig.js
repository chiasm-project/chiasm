// This is the RequireJS configuration that sets up module paths.
//
// Technology stack based on prototypes found here:
// http://curran.github.io/model-contrib/#/
//
// This file is documented here:
// http://requirejs.org/docs/api.html#config
//
// Created by Curran Kelleher February 2015
requirejs.config({
  baseUrl: "js",
  paths: {

    // Visualization library.
    // http://d3js.org/
    d3: "../bower_components/d3/d3.min",

    // Reactive model library.
    // https://github.com/curran/model
    model: "../bower_components/model/dist/model",

    // Functional programming utilities.
    // http://benmccormick.org/2014/11/12/underscore-vs-lodash/
    lodash: "../bower_components/lodash/lodash.min",

    // Asynchronous control flow.
    // https://github.com/caolan/async
    async: "../bower_components/async/lib/async",

    // Syntax-highlighted text editor for code.
    // http://codemirror.net/
    codemirror: "../bower_components/codemirror",

    // Provides interactive color picker and slider for CodeMirror.
    // https://github.com/enjalot/Inlet.git
    inlet: "../bower_components/Inlet/inlet"
  }
});
