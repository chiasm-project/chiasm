// This module implements a dummy visualization
// for testing the visualization dashboard framework.
//
// Draws from previous work found at
// https://github.com/curran/phd/blob/gh-pages/prototype/src/dummyVis.js
// https://github.com/curran/model-contrib/blob/gh-pages/modules/dummyVis.js
//
// Created by Curran Kelleher Feb 2015

// This module implements a dummy visualization
// demonstrating the API structure for authoring visualizations
// that work with the `overseer` framework and nested box layout.
//
// Curran Kelleher September 2014
define(["d3", "model", "lodash"], function (d3, Model, _) {

  return function DummyVis(runtime) {

    var model = Model({
      publicProperties: [

        // The background color, a CSS color string.
        "color",

        // The string that gets displayed in the center of the box.
        "text",

        // The width in pixels of lines for the X.
        "lineWidth"
      ],

      color: "white",
      text: "",
      lineWidth: 8
    });

    // Append an SVG to the runtime div.
    var svg = d3.select(runtime.div).append("svg");

    // Add a background rectangle to the SVG.
    var rect = svg.append("rect")

      // The location of the rect will be fixed at (0, 0)
      // with respect to the containing SVG.
      .attr("x", 0)
      .attr("y", 0);

    // Add a text element to the SVG,
    // which will render the `text` model property.
    var text = svg.append("text")
      .attr("font-size", "7em")
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle");

    // Make the X lines draggable. This shows how to add
    // interaction to visualization modules.
    var lineDrag = (function () {
      var x1, x2;
      return d3.behavior.drag()
        .on("dragstart", function (d) {
          x1 = d3.event.sourceEvent.pageX;
        })
        .on("drag", function (d) {
          var x2 = d3.event.sourceEvent.pageX,
              newLineWidth = model.lineWidth + x2 - x1;
          newLineWidth = newLineWidth < 1 ? 1 : newLineWidth;

          // dragging updates the `lineWidth` model property,
          // which is visible to other visualizations in the runtime.
          model.lineWidth = newLineWidth;
          x1 = x2;
        });
    }());

    // Update the color and text based on the model.
    model.when("color", _.partial(rect.attr, "fill"), rect);

    // Update the text based on the model.
    model.when("text", text.text, text);

    // When the size of the visualization is set
    // by the runtime layout engine,
    model.when("box", function (box) {

      // set the size of the SVG and background rect.
      svg
        .attr("width", box.width)
        .attr("height", box.height);
      rect
        .attr("width", box.width)
        .attr("height", box.height);

      // Update the text label to be centered.
      text
        .attr("x", box.width / 2)
        .attr("y", box.height / 2);
    });

    // Update the X lines whenever either
    // the `box` or `lineWidth` model properties change.
    model.when(["box", "lineWidth"], function (box, lineWidth) {
      var w = box.width,
          h = box.height,
          lines = svg.selectAll("line").data([
            {x1: 0, y1: 0, x2: w, y2: h},
            {x1: 0, y1: h, x2: w, y2: 0}
          ]);
      lines.enter().append("line");
      lines
        .attr("x1", function (d) { return d.x1; })
        .attr("y1", function (d) { return d.y1; })
        .attr("x2", function (d) { return d.x2; })
        .attr("y2", function (d) { return d.y2; })
        .style("stroke-width", lineWidth)
        .style("stroke-opacity", 0.2)
        .style("stroke", "black")
        .call(lineDrag);
    });

    // Clean up the DOM elements when the component is destroyed.
    model.destroy = function(){
      // TODO test this.
      runtime.div.removeChild(svg.node());
    };

    return model;
  };
});
