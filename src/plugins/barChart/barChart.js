// A reusable bar chart module.
// Draws from D3 bar chart example http://bl.ocks.org/mbostock/3885304
// Curran Kelleher June 2015
var reactivis = require("reactivis");
var d3 = require("d3");
var Model = require("model-js");
var _ = require("lodash");

var None = Model.None;

// The constructor function, accepting default values.
function BarChart(chiasm) {

  // Create a Model instance for the bar chart.
  // This will serve as the public API for the visualization.
  var model = Model();

  model.container = chiasm.container;

  reactivis.svg(model);
  reactivis.title(model);
  reactivis.margin(model);

  reactivis.xAccessor(model);
  reactivis.xScale(model, "ordinalBands");
  reactivis.xAxis(model);

  reactivis.yAccessor(model);
  reactivis.yScale(model);
  reactivis.yAxis(model);

  reactivis.color(model);

  // Add an SVG group to contain the line.
  model.when("g", function (g) {
    model.barsG = g.append("g");
  });

  // Draw the bars.
  model.when(["barsG", "data", "x", "y", "xScale", "height", "color", "xAccessor"],
      function (barsG, data, x, y, xScale, height, color, xAccessor){
    var bars = barsG.selectAll("rect").data(data, xAccessor);
    bars.enter().append("rect");
    bars
      .attr("x", x)
      .attr("y", y)
      .attr("width", xScale.rangeBand())
      .attr("height", function(d) { return height - y(d); })
      .attr("fill", color);
    bars.exit().remove();
  });

  model.destroy = function(){
    if(model.container && model.svg){
      model.svg.node().innerHTML = "";
      model.container.removeChild(model.svg.node());
    }
  };

  return model;
}

module.exports = BarChart;
