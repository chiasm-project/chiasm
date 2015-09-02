// A reusable line chart module.
// Draws from D3 line chart example http://bl.ocks.org/mbostock/3883245
// Curran Kelleher June 2015
var reactivis = require("../../reactivis");
var d3 = require("d3");
var Model = require("model-js");
var _ = require("lodash");

var None = Model.None;

// The constructor function, accepting default values.
function LineChart(chiasm) {

  // Create a Model instance for the line chart.
  // This will serve as the line chart's public API.
  var model = Model();

  // TODO move this logic into Chiasm,
  // TODO add to plugin docs.
  model.container = chiasm.container;

  reactivis.svg(model);
  reactivis.title(model);
  reactivis.margin(model);
  reactivis.color(model);

  reactivis.xAccessor(model);
  reactivis.xScale(model, "time");
  reactivis.xAxis(model);

  reactivis.yAccessor(model);
  reactivis.yScale(model);
  reactivis.yAxis(model);

  // Add an SVG group to contain the lines.
  model.when("g", function (g) {
    model.lineG = g.append("g");
  });

  // Draw the lines.
  model.lineColumn = None;
  model.when(["lineG", "data", "lineColumn", "x", "y", "color"],
      function (lineG, data, lineColumn, x, y, color){
    var linesData = d3.nest()
          .key(function(d){ 
            if(lineColumn !== None){
              return d[lineColumn]; // Have multiple lines.
            } else {
              return "X";// have only a single line.
            }
          })
          .entries(data),
        line = d3.svg.line().x(x).y(y),
        lines = lineG.selectAll(".line").data(linesData);

    lines.enter().append("path").attr("class", "line");
    lines
      .attr("d", function(d){ return line(d.values); })
      .style("stroke", color);
    lines.exit().remove();
  });

  model.destroy = function(){
    if(model.container && model.svg){
      model.svg.node().innerHTML = "";
      model.container.removeChild(model.svg.node());
    }
  };

  return model;
}
module.exports = LineChart;
