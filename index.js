// This is the top-level Chiasm bundle module that includes visualization plugins,
// and exposes a Chiasm constructor that makes the plugins available statically.
// Work-in-progress regarding how to bundle.
// Considering switching to ES6 and Rollup in future iterations,
// and possibly JSPM/SystemJS for dynamic loading.

// Curran Kelleher 6/29/15
var Chiasm = require("./src/chiasm");
var layout = require("./src/plugins/layout/layout");
var barChart = require("./src/plugins/barChart/barChart");
var lineChart = require("./src/plugins/lineChart/lineChart");
var scatterPlot = require("./src/plugins/scatterPlot/scatterPlot");
var links = require("./src/plugins/links/links");
var dummyVis = require("./src/plugins/dummyVis/dummyVis");
var csvLoader = require("./src/plugins/csvLoader/csvLoader");
var dataReduction = require("./src/plugins/dataReduction/dataReduction");

module.exports = function (container){
  var chiasm = Chiasm(container);
  chiasm.plugins.layout = layout;
  chiasm.plugins.barChart = barChart;
  chiasm.plugins.lineChart = lineChart;
  chiasm.plugins.scatterPlot = scatterPlot;
  chiasm.plugins.links = links;
  chiasm.plugins.dummyVis = dummyVis;
  chiasm.plugins.csvLoader = csvLoader;
  chiasm.plugins.dataReduction = dataReduction;

//src/plugins/colorScale.js
//src/plugins/configEditor.js
//src/plugins/crossfilter.js
  return chiasm;
};
