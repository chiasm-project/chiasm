// A reusable scatter plot module.
// Curran Kelleher March 2015
define(["d3", "model", "reactivis"], function (d3, Model, reactivis) {

  var None = Model.None;

  var addPublicProperty = reactivis.addPublicProperty;

  // The constructor function, accepting default values.
  return function ScatterPlot(chiasm) {

    // Create a Model instance for the visualization.
    // This will serve as its public API.
    var model = Model();

    // TODO move this logic into Chiasm,
    // TODO add to plugin docs.
    model.container = chiasm.container;

    reactivis.svg(model);
    reactivis.title(model);
    reactivis.margin(model);
    reactivis.xAccessor(model);
    reactivis.xScale(model, "linear");
    reactivis.xAxis(model);
    reactivis.yAccessor(model);
    reactivis.yAxis(model);
    reactivis.color(model);

    // Allow the API client to optionally specify fixed min and max values.
    addPublicProperty(model, "yDomainMin", None);
    addPublicProperty(model, "yDomainMax", None);
    model.when(["data", "yAccessor", "yDomainMin", "yDomainMax"],
        function (data, yAccessor, yDomainMin, yDomainMax) {

      // If min and max are not given, use the data extent.
      if(yDomainMin === None && yDomainMax === None){
        model.yDomain = d3.extent(data, yAccessor);
      } else {

        // When only max is specified,
        if(yDomainMin === None){

          // compute min from the data.
          yDomainMin = d3.min(data, yAccessor);
        }

        // When only min is specified,
        if(yDomainMax === None){

          // compute max from the data.
          yDomainMax = d3.max(data, yAccessor);
        }

        model.yDomain = [yDomainMin, yDomainMax];
      }
    });

    // Compute the Y scale.
    model.when(["yDomain", "height"], function (yDomain, height) {
      model.yScale = d3.scale.linear().domain(yDomain).range([height, 0]);
    });

    // Generate a function for getting the scaled Y value.
    model.when(["yScale", "yAccessor"], function (yScale, yAccessor) {
      model.y = function (d) { return yScale(yAccessor(d)); };
    });

    // Allow the API client to optionally specify a size column.
    addPublicProperty(model, "sizeColumn", None);
    
    // The default radius of circles in pixels.
    addPublicProperty(model, "sizeDefault", 3);

    // The min and max circle radius in pixels.
    addPublicProperty(model, "sizeMin", 0.5);
    addPublicProperty(model, "sizeMax", 6);

    // Set up the size scale.
    model.when(["sizeColumn", "data", "sizeDefault", "sizeMin", "sizeMax"],
        function (sizeColumn, data, sizeDefault, sizeMin, sizeMax){
      if(sizeColumn !== None){
        var getSize = function (d){ return d[sizeColumn]; },
            sizeScale = d3.scale.linear()
              .domain(d3.extent(data, getSize))
              .range([sizeMin, sizeMax]);
        model.getSizeScaled = function (d){ return sizeScale(getSize(d)); };
      } else {
        model.getSizeScaled = function (d){ return sizeDefault; };
      }
    });

    // Add an SVG group to contain the marks.
    model.when("g", function (g) {
      model.circlesG = g.append("g");
    });

    // Draw the circles of the scatter plot.
    model.when(["data", "circlesG", "x", "y", "getSizeScaled", "color"],
        function (data, circlesG, x, y, getSizeScaled, color){

      var circles = circlesG.selectAll("circle").data(data);
      circles.enter().append("circle");
      circles
        .transition().duration(500) // TODO make this a model property
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", getSizeScaled)
        .attr("fill", color);
      circles.exit().remove();

    });

    model.destroy = function(){
      if(model.container && model.svg){
        model.svg.node().innerHTML = "";
        model.container.removeChild(model.svg.node());
      }
    };

    return model;
  };
});
