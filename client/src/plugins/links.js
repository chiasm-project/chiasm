// This module implements data binding between components.
// Created by Curran Kelleher Mar 2015
define(["d3", "model"], function (d3, Model) {

  return function CsvLoader(runtime) {

    var model = Model({
      publicProperties: [ "bindings" ],
      numericColumns: []
    });

    model.when("bindings", function (bindings){
      bindings.forEach(function(bindingExpr){
        var parts = bindingExpr.split("->").map(function(str){ return str.trim(); }),
            source = parts[0].split("."),
            sourceAlias = source[0],
            sourceProperty = source[1],
            target = parts[1].split("."),
            targetAlias = target[0],
            targetProperty = target[1];
        runtime.getComponent(sourceAlias, function(sourceComponent){
          runtime.getComponent(targetAlias, function(targetComponent){

            // TODO keep track of listeners and remove old ones when bindings change.
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
