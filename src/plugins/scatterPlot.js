// A reusable scatter plot module.
// Curran Kelleher March 2015
define(["d3", "model"], function (d3, Model) {

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
        "xColumn",
        "yColumn",
        "xAxisLabel",
        "yAxisLabel",
        "xAxisLabelOffset",
        "yAxisLabelOffset",
        "margin",
        "title",
        "titleOffset",
        "sizeDefault",
        "colorDefault"
      ],

      // TODO push these into Reactivis getX, getY
      xColumn: None,
      yColumn: None,

      // TODO push this into reactivis margin
      margin: {
        "top": 32,
        "right": 2,
        "bottom": 40,
        "left": 47
      },

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

    // Create an SVG element from the container DOM element.
    model.when("container", function (container) {
      model.svg = d3.select(container).append("svg")

        // Use CSS `position: absolute;`
        // so setting `left` and `top` later will
        // position the SVG relative to the container div.
        .style("position", "absolute");
    });

    // Adjust the size of the SVG based on the `box` property.
    model.when(["svg", "box"], function (svg, box) {

      // Set the CSS `left` and `top` properties
      // to move the SVG to `(box.x, box.y)`
      // relative to the container div.
      svg
        .style("left", box.x + "px")
        .style("top", box.y + "px")
        .attr("width", box.width)
        .attr("height", box.height);
    });

    // Create an SVG group that will contain the visualization.
    model.when("svg", function (svg) {
      model.g = svg.append("g");
    });

    // Adjust the SVG group translation based on the margin.
    model.when(["g", "margin"], function (g, margin) {
      g.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    });

    // Create the title text element.
    model.when("g", function (g){
      model.titleText = g.append("text").attr("class", "title-text");
    });

    // Center the title text when width changes.
    model.when(["titleText", "width"], function (titleText, width) {
      titleText.attr("x", width / 2);
    });

    // Update the title text based on the `title` property.
    model.when(["titleText", "title"], function (titleText, title){
      titleText.text(title);
    });

    // Update the title text offset.
    model.when(["titleText", "titleOffset"], function (titleText, titleOffset){
      titleText.attr("dy", titleOffset + "em");
    });

    // Compute the inner box from the outer box and margin.
    // See Margin Convention http://bl.ocks.org/mbostock/3019563
    model.when(["box", "margin"], function (box, margin) {
      model.width = box.width - margin.left - margin.right;
      model.height = box.height - margin.top - margin.bottom;
    });

    // Generate a function for getting the X value.
    // TODO push this into reactivis.
    model.when(["data", "xColumn"], function (data, xColumn) {
      if(xColumn !== None){
        model.getX = function (d) { return d[xColumn]; };
      }
    });

    // Compute the domain of the X attribute.

    // Allow the API client to optionally specify fixed min and max values.
    model.xDomainMin = None;
    model.xDomainMax = None;
    model.when(["data", "getX", "xDomainMin", "xDomainMax"],
        function (data, getX, xDomainMin, xDomainMax) {

      if(xDomainMin === None && xDomainMax === None){
        model.xDomain = d3.extent(data, getX);
      } else {
        if(xDomainMin === None){
          xDomainMin = d3.min(data, getX);
        }
        if(xDomainMax === None){
          xDomainMax = d3.max(data, getX);
        }
        model.xDomain = [xDomainMin, xDomainMax];
      }
    });

    // Compute the X scale.
    model.when(["xDomain", "width"], function (xDomain, width) {
      model.xScale = d3.scale.linear().domain(xDomain).range([0, width]);
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
    // TODO push this into reactivis.
    model.when(["data", "yColumn"], function (data, yColumn) {
      if(yColumn !== None){
        model.getY = function (d) { return d[yColumn]; };
      }
    });

    // Compute the domain of the Y attribute.

    // Allow the API client to optionally specify fixed min and max values.
    model.yDomainMin = None;
    model.yDomainMax = None;
    model.when(["data", "getY", "yDomainMin", "yDomainMax"],
        function (data, getY, yDomainMin, yDomainMax) {

      if(yDomainMin === None && yDomainMax === None){
        model.yDomain = d3.extent(data, getY);
      } else {
        if(yDomainMin === None){
          yDomainMin = d3.min(data, getY);
        }
        if(yDomainMax === None){
          yDomainMax = d3.max(data, getY);
        }
        model.yDomain = [yDomainMin, yDomainMax];
      }
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
    model.sizeColumn = None;
    
    // The default radius of circles in pixels.
    model.sizeDefault = 2;

    // The min and max circle radius in pixels.
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

    // Allow the API client to optionally specify a color column.
    model.colorColumn = None;
    model.colorDomain = None;
    model.colorRange = None;
    
    // The default color of circles (CSS color string).
    model.colorDefault = "black";

    // Set up the color scale.
    model.when(["colorColumn", "data", "colorDefault", "colorDomain", "colorRange"],
        function (colorColumn, data, colorDefault, colorDomain, colorRange){
      if(colorColumn !== None && colorDomain !== None && colorRange !== None){
        var getColor = function (d){ return d[colorColumn]; },
            colorScale = d3.scale.ordinal()
              .domain(colorDomain)
              .range(colorRange);
        model.getColorScaled = function (d){ return colorScale(getColor(d)); };
      } else {
        model.getColorScaled = function (d){ return colorDefault; };
      }
    });

    // Add an SVG group to contain the marks.
    model.when("g", function (g) {
      model.circlesG = g.append("g");
    });

    // Draw the circles of the scatter plot.
    model.when(["data", "circlesG", "getXScaled", "getYScaled", "getSizeScaled", "getColorScaled"],
        function (data, circlesG, getXScaled, getYScaled, getSizeScaled, getColorScaled){

      var circles = circlesG.selectAll("circle").data(data);
      circles.enter().append("circle");
      circles
        .transition().duration(500) // TODO make this a model property
        .attr("cx", getXScaled)
        .attr("cy", getYScaled)
        .attr("r", getSizeScaled)
        .attr("fill", getColorScaled);
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
