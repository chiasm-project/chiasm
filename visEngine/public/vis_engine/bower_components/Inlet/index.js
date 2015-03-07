var globals = ["document", "window", "Inlet"],
    globalValues = {};

globals.forEach(function(g) {
  if (g in global) globalValues[g] = global[g];
});

require("./globals");
require("./inlet.js");
module.exports = Inlet;

globals.forEach(function(g) {
  if (g in globalValues) global[g] = globalValues[g];
  else delete global[g];
});
