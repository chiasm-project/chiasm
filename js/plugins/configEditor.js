// A JSON configuration editor plugin.
//
// Created by Curran Kelleher Feb 2015
define(["d3", "model", "codemirror"], function (d3, Model, CodeMirror) {

  return function ConfigEditor(runtime) {

    var model = Model({
    
      // The `hidden` boolean property triggers the layout
      // to recalculate to show and hide the editor.
      //publicProperties: [ "hidden" ]
    });

    // Append a div to contain the editor to the runtime div.
    // Use CSS `position: absolute;` so setting `left` and `top` CSS
    // properties later will position the SVG relative to containing div.
    var div = d3.select(runtime.div)
      .append("div")
      .style("position", "absolute");

    var editor = CodeMirror(div.node());

    // When the size of the visualization is set
    // by the runtime layout engine,
    model.when("box", function (box) {

      // Set the CSS `left` and `top` properties to move the
      // SVG to `(box.x, box.y)` relative to its paren div.
      div
        .style("left", box.x + "px")
        .style("top", box.y + "px");

      div
        .style("width", box.width + "px")
        .style("height", box.height + "px");

      div.select(".CodeMirror")
        .style("height", box.height + "px");
    });

    var configListener = runtime.when("config", function(config){
      editor.setValue(JSON.stringify(config, null, 2));
    });

    // Clean up the DOM elements when the component is destroyed.
    model.destroy = function(){
      runtime.div.removeChild(textarea.node());
    };

    return model;
  };
});
