// This plugin exposes schema-based automatic DSV data set parsing from
// https://github.com/curran/data-reduction
// Curran Kelleher July 2015
var dsvDataset = require("dsv-dataset");

var Model = require("model-js");

function dsvDatasetPlugin() {

  var model = Model({
    publicProperties: [ "metadata" ],
    metadata: Model.None
  });

  model.when(["dsvString", "metadata"], function (dsvString, metadata) {
    if(metadata !== Model.None){
      model.data = dsvDataset.parse({
        dsvString: dsvString,
        metadata: metadata
      }).data;
    }
  });

  return model;
}
module.exports = dsvDatasetPlugin;
