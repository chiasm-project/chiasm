// A reusable line chart module.
// Draws from D3 line chart example http://bl.ocks.org/mbostock/3883245
// Curran Kelleher March 2015
define(["./reactivis", "d3", "model"], function (reactivis, d3, Model) {

  var None = Model.None;

  // The constructor function, accepting default values.
  return function LineChart(chiasm) {

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
    reactivis.yAxis(model);

    // Compute the domain of the Y attribute.
    model.when(["data", "yAccessor"], function (data, yAccessor) {
      model.yDomain = d3.extent(data, yAccessor);
    });

    // Compute the Y scale.
    model.when(["data", "yDomain", "height"], function (data, yDomain, height) {
      model.yScale = d3.scale.linear().domain(yDomain).range([height, 0]);
    });

    // Generate a function for getting the scaled Y value.
    model.when(["data", "yScale", "yAccessor"], function (data, yScale, yAccessor) {
      model.y = function (d) { return yScale(yAccessor(d)); };
    });

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
  };
});
