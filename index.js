var Chiasm = require("./src/chiasm");
var layout = require("./src/plugins/layout/layout");
var barChart = require("./src/plugins/barChart/barChart");
var lineChart = require("./src/plugins/lineChart/lineChart");

module.exports = function (container){
  var chiasm = Chiasm(container);
  chiasm.plugins.layout = layout;
  chiasm.plugins.barChart = barChart;
  chiasm.plugins.lineChart = lineChart;
  return chiasm;
};
