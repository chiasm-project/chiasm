// A plugin that supports linked views via crossfilter.
define(["model", "crossfilter"], function(Model /* crossfilter is proded as a global */){
  return function(){
    var model = Model({
      publicProperties: ["dimensions"],
      dimensions: []
    });

    var listeners = [];

    model.when(["data", "dimensions"], function (data, dimensionProperties){
      var observation = crossfilter(data),
          dimensions = {};

      listeners.forEach(model.cancel);
      listeners = [];
      dimensionProperties.forEach(function(property){
        var dimension = observation.dimension(function(d){ return d[property]; });
        dimensions[property] = dimension;
        listeners.push(model.when(property + "Filter", function(filter){
          dimension.filter(filter);
          updateAll();
        }));
      });
      function updateAll(){
        dimensionProperties.forEach(function(property){
          model[property + "Top"] = dimensions[property].top(Infinity);
        });
      }

      // Call once to initialize.
      updateAll();
    });

    return model;
  };
});
