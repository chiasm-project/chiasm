// This module encapsulates reusable reactive flows
// common to many D3-based visualizations.
//
// Curran Kelleher April 2015
define(["model","d3"], function (Model,d3){

  // The returned public API object, containing functions that take as input
  // a Model.js model, and as a side effect add reactive flows within that model.
  var reactivis = {};

  // This value is used for optionally defined public properties
  var None = Model.None;

  // Adds a public property to a model.
  // This makes the property configurable via the Chiasm configuration.
  function addPublicProperty(model, property, defaultValue){
    if(!model.publicProperties){
      model.publicProperties = [];
    }
    model.publicProperties.push(property);
    model[property] = defaultValue;
  }
  
  // Constructs an SVG element as a child of the `container` element.
  // Makes the SVG size and location update with respect to the `box` property.
  // Also adds a G element as a child of the SVG element, for visualizations.
  reactivis.svg = function(model){

    // Create the SVG element from the container DOM element.
    model.when("container", function (container) {

      // Use CSS `position: relative` so that setting properties
      // `left` and `top` will position the SVG relative to the Chiasm container.
      model.svg = d3.select(container).append("svg")
        .style("position", "relative");
    });

    // Adjust the SVG based on the `box` property.
    model.when(["svg", "box"], function (svg, box) {

      // Set the CSS `left` and `top` properties to move the
      // SVG to `(box.x, box.y)` relative to its container.
      svg
        .style("left", box.x + "px")
        .style("top", box.y + "px")
        .attr("width", box.width)
        .attr("height", box.height);

      // Use negative margins to eliminate the SVG space taken up
      // in the layout flow. This is an ugly solution, but the alternatives
      // don't work - setting position:absolute doesn't work when the
      // Chiasm container is statically positioned.
      // http://stackoverflow.com/questions/13722095/how-to-remove-whitespace-that-appears-after-relative-positioning-an-element-with
      svg
        .style("margin-right", "-" + box.width + "px")
        .style("margin-bottom", "-" + box.height + "px");
    });

    // Create the SVG group that will contain the visualization.
    model.when("svg", function (svg) {
      model.g = svg.append("g");
    });
  };

  // Encapsulates conventional D3 margins.
  // See http://bl.ocks.org/mbostock/3019563
  reactivis.margin = function(model){

    // Set up the default margin.
    addPublicProperty(model, "margin",{
      "top": 32,
      "right": 2,
      "bottom": 40,
      "left": 47
    });

    // Compute the inner box from the outer box and margin.
    model.when(["box", "margin"], function (box, margin) {
      model.width = box.width - margin.left - margin.right;
      model.height = box.height - margin.top - margin.bottom;
    });

    // Adjust the translation of the group based on the margin.
    model.when(["g", "margin"], function (g, margin) {
      g.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    });

    // TODO change layout such that size is not added as a property.
    addPublicProperty(model, "size", 1);
  };

  // Adds a text title at the top of the visualization.
  reactivis.title = function(model){

    addPublicProperty(model, "title", "");
    addPublicProperty(model, "titleOffset", -0.3);

    // Create the title text element.
    model.when("g", function (g){
      model.titleText = g.append("text").attr("class", "title-text");
    });

    // Center the title text when width changes.
    model.when(["titleText", "width"], function (titleText, width) {
      titleText.attr("x", width / 2);
    });

    // Update the title text based on the public `title` property.
    model.when(["titleText", "title"], function (titleText, title){
      titleText.text(title);
    });

    // Update the title text offset.
    model.titleOffset = 1;
    model.when(["titleText", "titleOffset"], function (titleText, titleOffset){
      titleText.attr("dy", titleOffset + "em");
    });
  };

  reactivis.color = function(model){

    addPublicProperty(model, "colorColumn", None);
    addPublicProperty(model, "colorDomain", None);
    addPublicProperty(model, "colorRange", None);
    addPublicProperty(model, "colorDefault", "black");

    // Set up the color scale.
    model.when(["colorDefault", "colorDomain", "colorRange"],
        function (colorDefault, colorDomain, colorRange){
      if(colorDomain !== None && colorRange !== None){
        model.colorScale = d3.scale.ordinal()
          .domain(colorDomain)
          .range(colorRange);
      } else {
        model.colorScale = None;
      }
    });

    // Set up the color evaluation function.
    model.when(["colorColumn", "colorScale", "colorDefault"],
        function(colorColumn, colorScale, colorDefault){
      if(colorColumn !== None && colorScale !== None){
        model.color = function(d){ return colorScale(d[colorColumn]); };
      }
      else {
        model.color = colorDefault;
      }
    });
  };

  // Generates a function for getting the X value.
  reactivis.xAccessor = function(model){
    addPublicProperty(model, "xColumn", None);
    model.when(["xColumn"], function (xColumn) {
      if(xColumn !== None){
        model.xAccessor = function (d) { return d[xColumn]; };
      }
    });
  };

  // Generates a function for getting the Y value.
  reactivis.yAccessor = function(model){
    addPublicProperty(model, "yColumn", None);
    model.when(["yColumn"], function (yColumn) {
      if(yColumn !== None){
        model.yAccessor = function (d) { return d[yColumn]; };
      }
    });
  };

  // A lookup table for scale constructors based on their type.
  var scaleConstructors = {
    linear: d3.scale.linear,
    time: d3.time.scale,
    ordinalBands: d3.scale.ordinal
  };

  // Sets up the X scale.
  // The argument "xScaleType" should be a string,
  // one of "linear", "time", or "ordinalBands".
  reactivis.xScale = function(model, scaleType){

    // Make the scale type a public property so it is configurable at runtime.
    // Example use case: dynamically switching between linear and log scales.
    addPublicProperty(model, "xScaleType", scaleType);

    // Allow the API client to optionally specify fixed min and max values.
    // Relevant only for quantitative scales (linear, time).
    addPublicProperty(model, "xDomainMin", None);
    addPublicProperty(model, "xDomainMax", None);

    // The padding between range bands (e.g. the space between bars in a bar chart).
    // Relevant only for ordinal scales.
    addPublicProperty(model, "xRangePadding", 0.1);

    // Compute the domain of the X column.
    model.when(["data", "xScaleType", "xAccessor", "xDomainMin", "xDomainMax"],
        function (data, xScaleType, xAccessor, xDomainMin, xDomainMax) {

      // Compute the scale domain.
      if(xScaleType === "linear" || xScaleType === "time"){
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
      } else if (xScaleType === "ordinalBands"){
        model.xDomain = data.map(xAccessor);
      }
    });

    // Compute the X scale.
    model.when(["xScaleType", "xDomain", "width", "xRangePadding"],
        function (xScaleType, xDomain, width, xRangePadding) {
      var scale = scaleConstructors[xScaleType]().domain(xDomain);
      if(xScaleType === "ordinalBands"){
        scale.rangeRoundBands([0, width], xRangePadding);
      } else {
        scale.range([0, width]);
      }
      model.xScale = scale;
    });

    // Generate a function for getting the scaled X value.
    model.when(["data", "xScale", "xAccessor"], function (data, xScale, xAccessor) {
      model.x = function (d) { return xScale(xAccessor(d)); };
    });
  };

  // Adds the X axis and its label text.
  reactivis.xAxis = function(model){

    addPublicProperty(model, "xAxisLabel", "");
    addPublicProperty(model, "xAxisLabelOffset", 1.9);

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
  };

  // Adds the Y axis and its label text.
  reactivis.yAxis = function(model){

    // The text shown as the axis label.
    addPublicProperty(model, "yAxisLabel", "");

    // The left-right offset of the axis label, unit is CSS "em"s.
    addPublicProperty(model, "yAxisLabelOffset", 1.4);

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
  };

  // Expose the addPublicProperty function, as it is a useful utility
  // function for visualizations that build on top of reactivis.
  reactivis.addPublicProperty = addPublicProperty;

  return reactivis;
});
