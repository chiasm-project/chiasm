// A reusable bar chart module.
// Draws from D3 bar chart example http://bl.ocks.org/mbostock/3885304
// Curran Kelleher April 2015
define(["reactivis", "d3", "model", "lodash"], function (reactivis, d3, Model, _) {

  var None = Model.None;

  // The constructor function, accepting default values.
  return function BarChart(chiasm) {

    // Create a Model instance for the bar chart.
    // This will serve as the public API for the visualization.
    var model = Model({
      publicProperties: [
        "yAxisLabel",
        "xAxisLabelOffset",
        "yAxisLabelOffset"
      ],

      // TODO push axis labels down into Reactivis
      yAxisLabel: "",
      xAxisLabelOffset: 0,
      yAxisLabelOffset: 0

    });

    // TODO move this logic into Chiasm,
    // TODO add to plugin docs.
    model.container = chiasm.container;

    reactivis.svg(model);
    reactivis.title(model);
    reactivis.margin(model);
    reactivis.xAccessor(model);
    reactivis.xAxis(model);
    reactivis.yAccessor(model);
    reactivis.color(model);

    // Compute the ordinal domain of the X attribute.
    model.when(["data", "xAccessor"], function (data, xAccessor) {
      model.xDomain = data.map(xAccessor);
    });

    // Compute the X scale.
    model.barPadding = 0.1;
    model.when(["xDomain", "width", "barPadding"], function (xDomain, width, padding) {
      model.xScale = d3.scale.ordinal().domain(xDomain).rangeRoundBands([0, width], padding);
    });

    // Generate a function for getting the scaled X value.
    model.when(["xScale", "xAccessor"], function (xScale, xAccessor) {
      model.x = function (d) { return xScale(xAccessor(d)); };
    });

    // Allow the API client to optionally specify fixed min and max values.
    model.publicProperties.push("yDomainMin");
    model.publicProperties.push("yDomainMax");
    model.yDomainMin = None;
    model.yDomainMax = None;

    // Compute the domain of the Y attribute.
    model.when(["data", "yAccessor", "yDomainMin", "yDomainMax"],
        function (data, yAccessor, yDomainMin, yDomainMax) {
      model.yDomain = [
        yDomainMin === None ? d3.min(data, yAccessor): yDomainMin,
        yDomainMax === None ? d3.max(data, yAccessor): yDomainMax
      ];
    });

    // Compute the Y scale.
    model.when(["data", "yDomain", "height"], function (data, yDomain, height) {
      model.yScale = d3.scale.linear().domain(yDomain).range([height, 0]);
    });

    // Generate a function for getting the scaled Y value.
    model.when(["yScale", "yAccessor"], function (yScale, yAccessor) {
      model.y = function (d) { return yScale(yAccessor(d)); };
    });

    // Set up the Y axis.
    model.when("g", function (g) {
      model.yAxisG = g.append("g").attr("class", "y axis");
      model.yAxisText = model.yAxisG.append("text")
        .style("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("y", 0);
    });
    
    // Move the Y axis label based on its specified offset.
    model.yAxisLabelOffset = 1.4; // Unit is CSS "em"s
    model.when(["yAxisText", "yAxisLabelOffset"], function (yAxisText, yAxisLabelOffset){
      yAxisText.attr("dy", "-" + yAxisLabelOffset + "em");
    });

    // Center the Y axis label when height changes.
    model.when(["yAxisText", "height"], function (yAxisText, height) {
      yAxisText.attr("x", -height / 2);
    });

    // Update Y axis label.
    model.when(["yAxisText", "yAxisLabel"], function (yAxisText, yAxisLabel) {
      yAxisText.text(yAxisLabel);
    });

    // Update the Y axis based on the Y scale.
    model.when(["yAxisG", "yScale"], function (yAxisG, yScale) {
      yAxisG.call(d3.svg.axis().orient("left").scale(yScale));
    });

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
        // TODO generalize transitions
        .transition().ease("linear").duration(200)
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
  };
});
