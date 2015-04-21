// This module encapsulates reusable reactive flows
// common to many D3-based visualizations.
//
// Curran Kelleher April 2015
define(["model"], function (Model){

  // The returned public API object, containing functions that take as input
  // a Model.js model, and as a side effect add reactive flows within that model.
  var reactivis = {};

  // This value is used for optionally defined public properties
  var None = Model.None;

  // Adds a public property to a model.
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
        .style("top", box.y + "px")
        .attr("width", box.width)
        .attr("height", box.height);
    });

    // Create the SVG group that will contain the visualization.
    model.when("svg", function (svg) {
      model.g = svg.append("g");
    });
  };

  // Encapsulates conventional D3 margins.
  // See http://bl.ocks.org/mbostock/3019563
  reactivis.margin = function(model){

    // Compute the inner box from the outer box and margin.
    model.when(["box", "margin"], function (box, margin) {
      model.width = box.width - margin.left - margin.right;
      model.height = box.height - margin.top - margin.bottom;
    });

    // Adjust the translation of the group based on the margin.
    model.when(["g", "margin"], function (g, margin) {
      g.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    });
  };

  // Adds a text title at the top of the visualization.
  reactivis.title = function(model){

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

    // Allow the API client to optionally specify a color column.
    model.colorColumn = None;
    model.colorDomain = None;
    model.colorRange = None;
    
    // The default color of circles (CSS color string).
    model.colorDefault = "black";

    // Set up the color scale.
    model.when(["colorDefault", "colorDomain", "colorRange"],
        function (colorDefault, colorDomain, colorRange){
      if(colorDomain !== None && colorRange !== None){
        model.colorScale = d3.scale.ordinal().domain(colorDomain).range(colorRange);
      } else {
        model.colorScale = function (d){ return colorDefault; };
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
    model.yColumn = None;
    model.when(["yColumn"], function (yColumn) {
      if(yColumn !== None){
        model.yAccessor = function (d) { return d[yColumn]; };
      }
    });
  };

  return reactivis;
});
