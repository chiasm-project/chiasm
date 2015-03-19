// A reusable line chart module.
// Draws from D3 line chart example http://bl.ocks.org/mbostock/3883245
// Curran Kelleher March 2015
define(["./reactivis", "d3", "model"], function (reactivis, d3, Model) {

  // A representation for an optional Model property that is not specified.
  // This allows the "when" approach to support optional properties.
  // Inspired by Scala"s Option type.
  // See http://alvinalexander.com/scala/using-scala-option-some-none-idiom-function-java-null
  var None = reactivis.None;

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

    reactivis.svg(model);
    reactivis.title(model);
    reactivis.margin(model);
    reactivis.color(model);

    // Append a mouse target for intercepting mouse hover events.
    model.enableHoverLine = false;
    model.when(["enableHoverLine", "g"], function(enableHoverLine, g){
      if(enableHoverLine){
        model.mouseTarget = g.append("rect")
          .attr("x", 0)
          .attr("y", 0)
          .style("fill", "none")
          .style("pointer-events", "all");
  
        model.selectedXLine = g.append("line")
          .attr("class", "hover-line")
      }
    });

    model.when(["mouseTarget", "xScale"], function(mouseTarget, xScale){
      mouseTarget.on("mousemove", function () {
        var mouseX = d3.mouse(mouseTarget.node())[0];
        model.selectedX = xScale.invert(mouseX);
      });
    });

    model.when(["selectedX", "selectedXLine", "xScale", "height"],
        function (selectedX, selectedXLine, xScale, height) {
      var xPixel = xScale(selectedX);
      selectedXLine
        .attr("x1", xPixel)
        .attr("x2", xPixel)
        .attr("y1", 0)
        .attr("y2", height);
    });

    model.when(["mouseTarget", "width"], function (mouseTarget, width) {
      mouseTarget.attr("width", width);
    });

    model.when(["mouseTarget", "height"], function (mouseTarget, height) {
      mouseTarget.attr("height", height);
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
      model.lineG = g.append("g");
    });


    // Draw the lines.
    model.lineColumn = None;
    model.when(["lineG", "data", "lineColumn", "getXScaled", "getYScaled", "colorScale"],
        function (lineG, data, lineColumn, getXScaled, getYScaled, colorScale){
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
        .style("stroke", function(d){ return colorScale(d.key); });
      lines.exit().remove();
    });

    return model;
  };
});
