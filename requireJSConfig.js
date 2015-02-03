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

    // http://d3js.org/
    d3: "../bower_components/d3/d3.min",

    // https://github.com/curran/model
    model: "../bower_components/model/dist/model",

    // http://benmccormick.org/2014/11/12/underscore-vs-lodash/
    lodash: "../bower_components/lodash/lodash.min",

    // for future use
    // http://square.github.io/crossfilter/
    // crossfilter: "../../bower_components/crossfilter/crossfilter"
  }
});
