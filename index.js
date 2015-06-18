var Chiasm = require("./src/chiasm");
var layout = require("./src/plugins/layout/layout");
var barChart = require("./src/plugins/barChart/barChart");

module.exports = function (container){
  var chiasm = Chiasm(container);
  chiasm.plugins.layout = layout;
  chiasm.plugins.barChart = barChart;
  return chiasm;
};
