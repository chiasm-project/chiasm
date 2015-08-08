// A reusable scatter plot module.

// Curran Kelleher June 2015
var reactivis = require("../../reactivis");
var d3 = require("d3");
var Model = require("model-js");

var None = Model.None;

var addPublicProperty = reactivis.addPublicProperty;

// The constructor function, accepting default values.
return function ScatterPlot(chiasm) {

  // Create a Model instance for the visualization.
  // This will serve as its public API.
  var model = Model();

  // TODO move this logic into Chiasm,
  // TODO add to plugin docs.
  model.container = chiasm.container;

  reactivis.svg(model);
  reactivis.title(model);
  reactivis.margin(model);

  reactivis.xAccessor(model);
  reactivis.xScale(model, "linear");
  reactivis.xAxis(model);

  reactivis.yAccessor(model);
  reactivis.yScale(model, "linear");
  reactivis.yAxis(model);

  reactivis.color(model);

  // Allow the API client to optionally specify a size column.
  addPublicProperty(model, "sizeColumn", None);
  
  // The default radius of circles in pixels.
  addPublicProperty(model, "sizeDefault", 3);

  // The min and max circle radius in pixels.
  addPublicProperty(model, "sizeMin", 0.5);
  addPublicProperty(model, "sizeMax", 6);

  // Set up the size scale.
  model.when(["sizeColumn", "data", "sizeDefault", "sizeMin", "sizeMax"],
      function (sizeColumn, data, sizeDefault, sizeMin, sizeMax){
    if(sizeColumn !== None){
      var getSize = function (d){ return d[sizeColumn]; },
          sizeScale = d3.scale.linear()
            .domain(d3.extent(data, getSize))
            .range([sizeMin, sizeMax]);
      model.getSizeScaled = function (d){ return sizeScale(getSize(d)); };
    } else {
      model.getSizeScaled = function (d){ return sizeDefault; };
    }
  });

  // Add an SVG group to contain the marks.
  model.when("g", function (g) {
    model.circlesG = g.append("g");
  });

  // Draw the circles of the scatter plot.
  model.when(["data", "circlesG", "x", "y", "getSizeScaled", "color"],
      function (data, circlesG, x, y, getSizeScaled, color){

    var circles = circlesG.selectAll("circle").data(data);
    circles.enter().append("circle");
    circles
      .transition().duration(500) // TODO make this a model property
      .attr("cx", x)
      .attr("cy", y)
      .attr("r", getSizeScaled)
      .attr("fill", color);
    circles.exit().remove();

  });

  model.destroy = function(){
    if(model.container && model.svg){
      model.svg.node().innerHTML = "";
      model.container.removeChild(model.svg.node());
    }
  };

  return model;
}
module.exports = ScatterPlot;
