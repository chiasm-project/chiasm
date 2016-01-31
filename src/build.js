// This script builds the distribution bundle using Rollup and Babel.
//
// by Curran K. Jan 2016

var rollup = require("rollup");
var babel = require("rollup-plugin-babel");
var npm = require("rollup-plugin-npm");
var commonjs = require("rollup-plugin-commonjs");

rollup.rollup({
  entry: "src/index.js",
  plugins: [
  
    // The Babel plugin compiles the JSX code.
    // This is specified in the file .babelrc
    babel(),
    
    // This plugin allows Rollup to resolve and bundle
    // the D3 ES6 modules.
    npm({
      jsnext: true,
    })

  ]
}).then(function (bundle) {
  bundle.write({
    dest: "dist/chiasm.js",
    moduleName: "Chiasm",
    format: "umd"
  });
}).catch(function (err){
  console.log(err);
});
