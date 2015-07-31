// This plugin exposes in-memory filtering and aggregation data transformations.

// Use the data reduction algorithms via the NPM package found at
// https://github.com/curran/data-reduction
var dataReduction = require("data-reduction");

var Model = require("model-js");

function DataReduction() {

  var model = Model({
    publicProperties: [ "filter", "aggregate" ],
    filter: Model.None,
    aggregate: Model.None
  });

  model.when(["filter", "aggregate", "dataIn"], function (filter, aggregate, dataIn) {
    var options = {};

    if(filter !== Model.None){
      options.filter = filter;
    }
    if(aggregate !== Model.None){
      options.aggregate = aggregate;
    }
    model.dataOut = dataReduction(dataIn, options).data;
  });

  return model;
}
module.exports = DataReduction;
