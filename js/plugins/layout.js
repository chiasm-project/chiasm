// This plugin uses the computeLayout module
// to assign sizes to visible components.
//
// Draws from previous work found at
// https://github.com/curran/model-contrib/blob/gh-pages/modules/boxes.js
//
// Created by Curran Kelleher Feb 2015
define(["computeLayout", "model", "async", "lodash"], function (computeLayout, Model, async, _){
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

    // Respond to changes is box and layout.
    model.when(["layout", "sizes", "box"], function(layout, sizes, box){

      // Compute the layout.
      var boxes = computeLayout(layout, sizes, box);

      // Apply the layout via the `box` property of components.
      Object.keys(boxes).forEach(function(alias){
        runtime.getComponent(alias, function(component){
          component.box = boxes[alias];
        });
      });
    });

    // Compute `sizes` from runtime components.
    model.when(["layout"], function(layout, box){
      var aliases = aliasesInLayout(layout),
          sizes = {};
      async.each(
        aliases,
        function(alias, callback){
          runtime.getComponent(alias, function(component){
            sizes[alias] = _.pick(component, "size", "hidden");
            callback();
          });
        },function(){
          model.sizes = sizes;
        }
      );
    });

    // Computes which aliases are referenced in the given layout.
    function aliasesInLayout(layout){
      var aliases = [];
      if(isLeafNode(layout)){
        aliases.push(layout);
      } else {
        layout.children.forEach(function(child){
          aliases.push.apply(aliases, aliasesInLayout(child));
        });
      }
      return aliases;
    }

    function isLeafNode(layout){
      return typeof layout === "string";
    }

    return model;
  };
});
