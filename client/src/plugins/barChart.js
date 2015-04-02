// A reusable bar chart module.
// Draws from D3 bar chart example http://bl.ocks.org/mbostock/3885304
// Curran Kelleher March 2015
define(["reactivis", "d3", "model", "lodash"], function (reactivis, d3, Model, _) {

  var None = Model.None;

  // The constructor function, accepting default values.
  return function BarChart(runtime) {

    // Create a Model instance for the bar chart.
    // This will serve as the public API for the visualization.
    var model = Model({
      publicProperties: [
        "xColumn",
        "yColumn",
        "xAxisLabel",
        "yAxisLabel",
        "xAxisLabelOffset",
        "yAxisLabelOffset"
      ],
      container: runtime.div
    });

    reactivis.svg(model);
    reactivis.title(model);
    reactivis.margin(model);
    reactivis.color(model);

    // Generate a function for getting the X value.
    model.when(["data", "xColumn"], function (data, xColumn) {
      model.getX = function (d) { return d[xColumn]; };
    });

    // Handle sorting.
    model.when(["sortColumn", "sortOrder", "data"], function (sortColumn, sortOrder, data){
      var sortedData = _.sortBy(data, sortColumn);
      if(sortOrder === "descending"){
        sortedData.reverse();
      }
      model.sortedData = sortedData;
    });

    // Compute the domain of the X attribute.
    model.when(["sortedData", "getX"], function (sortedData, getX) {
      model.xDomain = sortedData.map(getX);
    });

    // Compute the X scale.
    model.barPadding = 0.1;
    model.when(["xDomain", "width", "barPadding"], function (xDomain, width, padding) {
      model.xScale = d3.scale.ordinal().domain(xDomain).rangeRoundBands([0, width], padding);
    });

    // Generate a function for getting the scaled X value.
    model.when(["data", "xScale", "getX"], function (data, xScale, getX) {
      model.getXScaled = function (d) { return xScale(getX(d)); };
    });

    // Set up the X axis.
    model.when("g", function (g) {
      model.xAxisG = g.append("g").attr("class", "x axis");
      model.xAxisText = model.xAxisG.append("text").style("text-anchor", "middle");
    });

    // Move the X axis label based on its specified offset.
    model.xAxisLabelOffset = 1.9;
    model.when(["xAxisText", "xAxisLabelOffset"], function (xAxisText, xAxisLabelOffset){
      xAxisText.attr("dy", xAxisLabelOffset + "em");
    });

    // Update the X axis transform when height changes.
    model.when(["xAxisG", "height"], function (xAxisG, height) {
      xAxisG.attr("transform", "translate(0," + height + ")");
    });

    // Center the X axis label when width changes.
    model.when(["xAxisText", "width"], function (xAxisText, width) {
      xAxisText.attr("x", width / 2);
    });

    // Update the X axis based on the X scale.
    model.when(["xAxisG", "xScale"], function (xAxisG, xScale) {
      xAxisG.call(d3.svg.axis().orient("bottom").scale(xScale));
    });

    // Update X axis label.
    model.when(["xAxisText", "xAxisLabel"], function (xAxisText, xAxisLabel) {
      xAxisText.text(xAxisLabel);
    });

    // Generate a function for getting the Y value.
    model.when(["data", "yColumn"], function (data, yColumn) {
      model.getY = function (d) { return d[yColumn]; };
    });

    // Allow the API client to optionally specify fixed min and max values.
    model.publicProperties.push("yDomainMin");
    model.publicProperties.push("yDomainMax");
    model.yDomainMin = None;
    model.yDomainMax = None;

    // Compute the domain of the Y attribute.
    model.when(["data", "getY", "yDomainMin", "yDomainMax"],
        function (data, getY, yDomainMin, yDomainMax) {
      model.yDomain = [
        yDomainMin === None ? d3.min(data, getY): yDomainMin,
        yDomainMax === None ? d3.max(data, getY): yDomainMax
      ];
    });

    // Compute the Y scale.
    model.when(["data", "yDomain", "height"], function (data, yDomain, height) {
      model.yScale = d3.scale.linear().domain(yDomain).range([height, 0]);
    });

    // Generate a function for getting the scaled Y value.
    model.when(["data", "yScale", "getY"], function (data, yScale, getY) {
      model.getYScaled = function (d) { return yScale(getY(d)); };
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

    // For a bar chart, use the X column for color.
    model.when(["xColumn", "colorScale"], function(xColumn, colorScale){
      model.getColorScaled = function(d){ return colorScale(d[xColumn]); };
    });

    // Draw the bars.
    model.when(["barsG", "sortedData", "getXScaled", "getYScaled", "xScale", "height", "getColorScaled", "getX"],
        function (barsG, sortedData, getXScaled, getYScaled, xScale, height, getColorScaled, getX){
      var bars = barsG.selectAll("rect").data(sortedData, getX);
      bars.enter().append("rect");
      bars
        // TODO generalize transitions
        .transition().ease("linear").duration(200)
        .attr("x", getXScaled)
        .attr("y", getYScaled)
        .attr("width", xScale.rangeBand())
        .attr("height", function(d) { return height - getYScaled(d); })
        .attr("fill", getColorScaled);
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
