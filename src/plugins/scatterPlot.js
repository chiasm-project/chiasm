// A reusable scatter plot module.
// Curran Kelleher March 2015
define(["d3", "model", "reactivis"], function (d3, Model, reactivis) {

  var None = Model.None;

  // The constructor function, accepting default values.
  return function ScatterPlot(chiasm) {

    // Create a Model instance for the visualization.
    // This will serve as its public API.
    var model = Model({
      container: chiasm.div,

      // TODO refactor this, define public properties
      // close to reactive functions that use them.
      publicProperties: [
        "xAxisLabel",
        "yAxisLabel",
        "xAxisLabelOffset",
        "yAxisLabelOffset",
        "sizeDefault",
        "colorDefault"
      ],

      title:"",
      titleOffset: 0,

      // TODO push axis labels down into Reactivis
      xAxisLabel: "",
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
    reactivis.yAccessor(model);
    reactivis.color(model);

    // Compute the domain of the X attribute.

    // Allow the API client to optionally specify fixed min and max values.
    model.xDomainMin = None;
    model.xDomainMax = None;
    model.when(["data", "xAccessor", "xDomainMin", "xDomainMax"],
        function (data, xAccessor, xDomainMin, xDomainMax) {

      if(xDomainMin === None && xDomainMax === None){
        model.xDomain = d3.extent(data, xAccessor);
      } else {
        if(xDomainMin === None){
          xDomainMin = d3.min(data, xAccessor);
        }
        if(xDomainMax === None){
          xDomainMax = d3.max(data, xAccessor);
        }
        model.xDomain = [xDomainMin, xDomainMax];
      }
    });

    // Compute the X scale.
    model.when(["xDomain", "width"], function (xDomain, width) {
      model.xScale = d3.scale.linear().domain(xDomain).range([0, width]);
    });

    // Generate a function for getting the scaled X value.
    model.when(["data", "xScale", "xAccessor"], function (data, xScale, xAccessor) {
      model.x = function (d) { return xScale(xAccessor(d)); };
    });

    // Set up the X axis.
    model.when("g", function (g) {
      model.xAxisG = g.append("g").attr("class", "x axis");
      model.xAxisText = model.xAxisG.append("text").style("text-anchor", "middle");
    });

    // Move the X axis label based on its specified offset.
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

    // Compute the domain of the Y attribute.

    // Allow the API client to optionally specify fixed min and max values.
    model.yDomainMin = None;
    model.yDomainMax = None;
    model.when(["data", "yAccessor", "yDomainMin", "yDomainMax"],
        function (data, yAccessor, yDomainMin, yDomainMax) {

      if(yDomainMin === None && yDomainMax === None){
        model.yDomain = d3.extent(data, yAccessor);
      } else {
        if(yDomainMin === None){
          yDomainMin = d3.min(data, yAccessor);
        }
        if(yDomainMax === None){
          yDomainMax = d3.max(data, yAccessor);
        }
        model.yDomain = [yDomainMin, yDomainMax];
      }
    });

    // Compute the Y scale.
    model.when(["data", "yDomain", "height"], function (data, yDomain, height) {
      model.yScale = d3.scale.linear().domain(yDomain).range([height, 0]);
    });

    // Generate a function for getting the scaled Y value.
    model.when(["data", "yScale", "yAccessor"], function (data, yScale, yAccessor) {
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

    // Allow the API client to optionally specify a size column.
    model.publicProperties.push("sizeColumn");
    model.sizeColumn = None;
    
    // The default radius of circles in pixels.
    model.publicProperties.push("sizeDefault");
    model.sizeDefault = 2;

    // The min and max circle radius in pixels.
    model.publicProperties.push("sizeMin");
    model.publicProperties.push("sizeMax");
    model.sizeMin = 0.5;
    model.sizeMax = 6;

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
  };
});
