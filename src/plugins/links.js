// This module implements data binding between components.
// Created by Curran Kelleher Mar 2015
define(["d3", "model"], function (d3, Model) {

  return function Links(runtime) {

    var model = Model({
      publicProperties: [ "bindings" ]
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
        runtime.getComponent(sourceAlias, function(err, sourceComponent){
          // TODO propagate errors to UI

          runtime.getComponent(targetAlias, function(err, targetComponent){
            // TODO propagate errors to UI
            // TODO keep track of listeners and remove old ones when bindings change.

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
