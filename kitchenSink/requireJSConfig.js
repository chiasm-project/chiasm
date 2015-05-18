// This is the RequireJS configuration that sets up module paths.
//
// This file is documented here:
// http://requirejs.org/docs/api.html#config
//
// Curran Kelleher March 2015
(function(){

  // Use a fixed version of Chiasm, which provides the visualization runtime.
  //var chiasmPath = "//curran.github.io/cdn/chiasm-v0.1.6/src/";

  // Here's how to can use a local development version
  // if this Gist is cloned into a sibling directory to the chiasm repo.
  var chiasmPath = "../src/";

  requirejs.config({

    // Set up paths for Bower dependencies.
    // Uses github.com/curran/cdn
    paths: {

      // Set up the Chiasm path.
      // https://github.com/curran/chiasm
      chiasm: chiasmPath + "chiasm",
      "chiasm/plugins": chiasmPath + "plugins",

      // Visualization library.
      // http://d3js.org/
      d3: "//cdnjs.cloudflare.com/ajax/libs/d3/3.5.5/d3.min",

      // Reactive model library.
      // https://github.com/curran/model
      model: "//curran.github.io/cdn/model-v0.2.1/dist/model",

      // Functional programming utilities.
      // http://benmccormick.org/2014/11/12/underscore-vs-lodash/
      lodash: "//cdnjs.cloudflare.com/ajax/libs/lodash.js/3.5.0/lodash.min",

      // Asynchronous control flow.
      // https://github.com/caolan/async
      async: "//cdnjs.cloudflare.com/ajax/libs/async/0.9.0/async",

      // Syntax-highlighted text editor for code.
      // http://codemirror.net/
      codemirror: "//curran.github.io/cdn/codemirror-v5.0.0",

      // Provides interactive color picker and slider for CodeMirror.
      // https://github.com/enjalot/Inlet.git
      inlet: "//curran.github.io/cdn/inlet/inlet",
    }
  });
})();
