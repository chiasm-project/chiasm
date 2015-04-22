// This is a dropdown menu module.
define(["model"], function (Model){
  return function Dropdown(containerNode){

    var container = d3.select(containerNode),
        menu = container.append("select"),
        model = Model();

    model.when("data", function (data){
      var options = menu.selectAll("option").data(data);
      options.enter().append("option");
      options
        .attr("value", function(d){ return d.name; })
        .text(function(d){ return d.label; });
      options.exit().remove();
    });
    
    menu.on("change", function(d){
      model.selectedValue = this.value;
    });

    model.when("selectedValue", function (selectedValue){
      menu.node().value = selectedValue;
    });

    return model;
  };
});
