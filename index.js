var Chiasm = require("./src/chiasm");
var layout = require("./src/plugins/layout/layout");
var barChart = require("./src/plugins/barChart/barChart");
var lineChart = require("./src/plugins/lineChart/lineChart");
var scatterPlot = require("./src/plugins/scatterPlot/scatterPlot");
var links = require("./src/plugins/links/links");

module.exports = function (container){
  var chiasm = Chiasm(container);
  chiasm.plugins.layout = layout;
  chiasm.plugins.barChart = barChart;
  chiasm.plugins.lineChart = lineChart;
  chiasm.plugins.scatterPlot = scatterPlot;
  chiasm.plugins.links = links;

//src/plugins/colorScale.js
//src/plugins/configEditor.js
//src/plugins/crossfilter.js
//src/plugins/csvLoader.js
//src/plugins/dataReduction.js
//src/plugins/dummyVis.js
  return chiasm;
};
