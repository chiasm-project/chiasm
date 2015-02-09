// A JSON configuration editor plugin.
//
// This uses CodeMirror to provide a live editing environment for the runtime configuration.
// This allows users to edit the configuration JSON interactively and see it change while the system is running.
//
// Created by Curran Kelleher Feb 2015
//define(["d3", "model", "codemirror/lib/codemirror", "codemirror/mode/javascript/javascript", "inlet"], function (d3, Model, CodeMirror, Inlet) {
define(["d3", "model", "codemirror/lib/codemirror", "codemirror/mode/javascript/javascript", "inlet"], function (d3, Model, CodeMirror) {

  return function ConfigEditor(runtime) {

    var model = Model({
      // The `hidden` boolean property triggers the layout
      // to recalculate to show and hide the editor.
      // publicProperties: [ "hidden" ]
      size: "400px"
    });

    // Append a div to contain the editor to the runtime div.
    // Use CSS `position: absolute;` so setting `left` and `top` CSS
    // properties later will position the SVG relative to the runtime div.
    var div = d3.select(runtime.div)
      .append("div")
      .style("position", "absolute");

    // Append an instance of CodeMirror to the div.
    var editor = CodeMirror(div.node(), {

      // This ensures that all the text is displayed after resizing.
      // See http://codemirror.net/demo/resize.html
      viewportMargin: Infinity,

      // This makes the editor display syntax-highlighted JSON.
      mode:  "javascript"
    });

    // These flags are used to stop circular updates.
    var ignoreChangeFromCodemirror = false;
    var ignoreChangeFromRuntime = false;

    // Respond to changes in the runtime config.
    runtime.when("config", function(config){
      if(!ignoreChangeFromRuntime){
        ignoreChangeFromCodemirror = true;
        editor.setValue(JSON.stringify(config, null, 2));
        ignoreChangeFromCodemirror = false;
      }
    });

    // Update the runtime config when text is edited.
    editor.on("change", function(){
      if(!ignoreChangeFromCodemirror){
        ignoreChangeFromRuntime = true;
        runtime.config = JSON.parse(editor.getValue());
        setTimeout(function(){
          ignoreChangeFromRuntime = false;
        }, 0);
      }
    });

    // When the size of the visualization is set by the layout plugin,
    model.when("box", function (box) {

      // set the CSS (left, top, width, height) properties to move and
      // position the editor relative to the runtime div.
      div
        .style("left", box.x + "px")
        .style("top", box.y + "px")
        .style("width", box.width + "px")
        .style("height", box.height + "px");

      // Update the height of the CodeMirror editor.
      div.select(".CodeMirror")
        .style("height", box.height + "px");
    });

    // Clean up the DOM elements when the component is destroyed.
    model.destroy = function(){

      // TODO test this
      // TODO remove config listener
      runtime.div.removeChild(textarea.node());
    };

    // Augment the editor using Inlet, which gives
    // the user a color picker for colors and a slider for numbers.
    Inlet(editor);

    return model;
  };
});
