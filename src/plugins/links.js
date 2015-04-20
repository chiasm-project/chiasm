// This module implements data binding between components.
// by Curran Kelleher April 2015
define(["d3", "model"], function (d3, Model) {

  return function Links(chiasm) {

    var model = Model({
      publicProperties: [ "bindings" ],
      bindings: []
    });

    model.when("bindings", function (bindings){
      bindings.forEach(function(bindingExpr){

        // Parse the binding expression of the form
        // "sourceAlias.sourceProperty -> targetAlias.targetProperty"
        var parts = bindingExpr.split("->").map(function(str){ return str.trim(); }),
            source = parts[0].split("."),
            sourceAlias = source[0],
            sourceProperty = source[1],
            target = parts[1].split("."),
            targetAlias = target[0],
            targetProperty = target[1];

        // Retreive the source and target components.
        chiasm.getComponent(sourceAlias).then(function(sourceComponent){
          // TODO propagate errors to UI

          chiasm.getComponent(targetAlias).then(function(targetComponent){
            // TODO propagate errors to UI
            // TODO keep track of listeners and remove old ones when bindings change.
            // TODO add a test for this


            // Add a reactive function that binds the source to the target.
            sourceComponent.when(sourceProperty, function(value){
              targetComponent[targetProperty] = value;
            });
          });
        });
      });
    });

    return model;
  };
});
