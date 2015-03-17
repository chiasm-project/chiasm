// A reusable line chart module.
// Draws from D3 line chart example http://bl.ocks.org/mbostock/3883245
// Curran Kelleher March 2015
define(["d3", "model"], function (d3, Model) {

  // A representation for an optional Model property that is not specified.
  // This allows the "when" approach to support optional properties.
  // Inspired by Scala"s Option type.
  // See http://alvinalexander.com/scala/using-scala-option-some-none-idiom-function-java-null
  var None = "__none__";

  // The constructor function, accepting default values.
  return function LineChart(runtime) {

    // Create a Model instance for the line chart.
    // This will serve as the line chart's public API.
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

    // Create the SVG element from the container DOM element.
    model.when("container", function (container) {
      // Use CSS `position: absolute;` so setting `left` and `top` CSS
      // properties later will position the SVG relative to containing div.
      model.svg = d3.select(container).append("svg")
        .style("position", "absolute");
    });

    // Adjust the SVG based on the `box` property.
    model.when(["svg", "box"], function (svg, box) {

      // Set the CSS `left` and `top` properties to move the
      // SVG to `(box.x, box.y)` relative to its container.
      svg
        .style("left", box.x + "px")
        .style("top", box.y + "px");

      svg.attr("width", box.width).attr("height", box.height);
    });

    // Create the SVG group that will contain the visualization.
    model.when("svg", function (svg) {
      model.g = svg.append("g");
    });

    // Adjust the translation of the group based on the margin.
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
    model.when(["data", "xColumn"], function (data, xColumn) {
      model.getX = function (d) { return d[xColumn]; };
    });

    // Compute the domain of the X attribute.
    model.when(["data", "getX"], function (data, getX) {
      model.xDomain = d3.extent(data, getX);
    });

    // Compute the X scale.
    model.when(["data", "xDomain", "width"], function (data, xDomain, width) {
      model.xScale = d3.time.scale().domain(xDomain).range([0, width]);
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
    model.when(["data", "yColumn"], function (data, yColumn) {
      model.getY = function (d) { return d[yColumn]; };
    });

    // Compute the domain of the Y attribute.
    model.when(["data", "getY"], function (data, getY) {
      model.yDomain = d3.extent(data, getY);
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
      yAxisText.attr("dy", "-" + yAxisLabelOffset + "em")
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
      model.lineG = g.append("g");
    });

    // Allow the API client to optionally specify a color column.
    model.colorColumn = None;
    model.colorRange = None;
    
    // The default color of circles (CSS color string).
    model.colorDefault = "black";

    // Set up the color scale.
    model.when(["colorColumn", "data", "colorDefault", "colorRange"],
        function (colorColumn, data, colorDefault, colorRange){
      if(colorColumn !== None && colorRange !== None){
        var getColor = function (d){ return d[colorColumn] },
            colorScale = d3.scale.ordinal()
              .domain(data.map(getColor))
              .range(colorRange);
        model.getColorScaled = function (d){ return colorScale(getColor(d)); };
      } else {
        model.getColorScaled = function (d){ return colorDefault; };
      }
    });

    // Draw the lines.
    model.lineColumn = None;
    model.when(["lineG", "data", "lineColumn", "getXScaled", "getYScaled", "getColorScaled"],
        function (lineG, data, lineColumn, getXScaled, getYScaled, getColorScaled){
      var linesData = d3.nest()
            .key(function(d){ 
              if(lineColumn !== None){
                return d[lineColumn]; // Have multiple lines.
              } else {
                return "X";// have only a single line.
              }
            })
            .entries(data),
          line = d3.svg.line().x(getXScaled).y(getYScaled),
          lines = lineG.selectAll(".line").data(linesData);

      lines.enter().append("path").attr("class", "line");
      lines
        .attr("d", function(d){ return line(d.values); })
        .style("stroke", getColorScaled);
      lines.exit().remove();
    });

    return model;
  };
});
