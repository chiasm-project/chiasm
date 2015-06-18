var Chiasm = require("./src/chiasm");
var layout = require("./src/plugins/layout/layout");

module.exports = function (container){
  var chiasm = Chiasm(container);
  chiasm.plugins.layout = layout;
  return chiasm;
};
