// This plugin uses the computeLayout module
// to assign sizes to visible components.
//
// Draws from previous work found at
// https://github.com/curran/model-contrib/blob/gh-pages/modules/boxes.js
//
// Created by Curran Kelleher Feb 2015
define(["computeLayout", "model"], function (computeLayout, Model){
  return function Layout(runtime){

    var model = Model({
      publicProperties: ["layout"]
    });

    // Sets the `box` model property based on actual div size .
    function setBox(){
      model.box = {
        x: 0,
        y: 0,
        width: runtime.div.clientWidth,
        height: runtime.div.clientHeight
      };
    }

    // Initialize `model.box`.
    setBox();

    // Update `model.box` on resize
    window.addEventListener("resize", setBox);

    console.log("here");

    // Respond to changes is box and layout.
    model.when(["layout", "box"], function(layout, box){

      // Compute the layout.
      var boxes = computeLayout(layout, runtime.config, box);

      // Apply the layout via the `box` property of components.
      Object.keys(boxes).forEach(function(alias){
        runtime.getComponent(alias, function(component){
          component.box = boxes[alias];
        });
      });
    });

    return model;
  };
});
