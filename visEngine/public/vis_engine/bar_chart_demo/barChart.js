// A reusable bar chart module.
//
//  * Draws from the [D3 bar chart example](http://bl.ocks.org/mbostock/3885304).
//  * Development steps shown in this [Model.js YouTube Video](http://youtu.be/TpZqVAtQs94?t=12m27s)
//  * See also the [Example sequence](http://curran.github.io/screencasts/reactiveDataVis/examples/viewer/index.html#/1) from the video
//  * Also demonstrated in the [model-contrib barChart example](../#/barChart)
//
// By Curran Kelleher August 2014
define(["d3", "lodash", "model", "reactivis"], function (d3, _, Model, Reactivis) {

  // The module constructor accepts a `container` argument,
  // which is an empty DOM element such as a div.
  return function BarChart (container) {

    var defaults = {

          // TODO move these into defaults set by Reactivis
          yAxisNumTicks: 10,
          yAxisTickFormat: "",

          container: container
        },
        model = Model(),

        // TODO move this into reactivis defaults (default should be 0)
        transitionDuration = 100;

    // Set defaults on the model.
    model.set(defaults);

    // build up the visualization dom from the container.
    Reactivis.svg(model);

    // Use conventional margins.
    Reactivis.margin(model);

    // Use an ordinal X axis for defining bars.
    Reactivis.xOrdinalScale(model);
    Reactivis.xAxis(model);

    // Use a Y linear axis with zero as the minimum for bar height.
    Reactivis.yLinearScale(model);
    Reactivis.yDomain(model, { zeroMin: true });
    Reactivis.yAxis(model);

    // Draw the bars.
    model.when(["g", "data", "xAttribute", "yAttribute", "xScale", "yScale", "height"],
        _.throttle(function (g, data, xAttribute, yAttribute, xScale, yScale, height) {

      var bars = g.selectAll(".bar").data(data);

      bars.enter().append("rect").attr("class", "bar");

      bars
        .transition().duration(transitionDuration)
        .attr("x", function(d) { return xScale(d[xAttribute]); })
        .attr("width", xScale.rangeBand())
        .attr("y", function(d) { return yScale(d[yAttribute]); })
        .attr("height", function(d) { return height - yScale(d[yAttribute]); });

      bars.exit().remove();
    }), transitionDuration);

    return model;
  };
});
