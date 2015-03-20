// A simple plugin that exposes a model for use in defining
// a color scale shared across many visualizations.
define(["model"], function(Model){
  return function(){
    return Model({
      publicProperties: ["colorDomain", "colorRange"]
    });
  };
});
