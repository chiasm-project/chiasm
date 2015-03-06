// Reusable reactive model data flow subgraphs
// for constructing reactive data visualizations.
//
// The following properties are conventions used by
// many reusable data flow subgraphs:
//
//  * `data` an array of data elements. For example, this may be set to the array returned from [D3.csv](https://github.com/mbostock/d3/wiki/CSV)
//  * `box` an object representing the outer box of the visualization, having the following properties:
//    * `width` the width of the outer visualization box in pixels
//    * `height` the height of the outer visualization box in pixels
//  * `margin` the [conventional margin](http://bl.ocks.org/mbostock/3019563) object containing the margin of the visualization, having the properties `top`, `right`, `bottom`, `left`.
//  * `width` and `height`, the dimensions of the inner visualization rectangle, computed from `box` and `margin`.
//  * `xAttribute` the attribute found in data elements that maps to the X axis.
//  * `yAttribute` the attribute found in data elements that maps to the Y axis.
//  * `xDomain` the linear domain of the X scale, an array consisting of two numeric values, the min and max of the X linear scale
//  * `yDomain` the linear domain of the Y scale, an array consisting of two numeric values, the min and may of the Y linear scale
//  * `xScale` the d3 scale for the X axis.
//  * `yScale` the d3 scale for the Y axis.
//  * TODO complete this list
//
// By Curran Kelleher August 2014
define(['d3', 'model'], function(d3, Model){
  var Reactivis = {};

  // Encapsulates [D3 Conventional Margins](http://bl.ocks.org/mbostock/3019563).
  // Computes `width` and `height` from `box` and `margin`.
  Reactivis.margin = function (model) {

    // Set the default margin.
    // Optimized for use with X and Y axes (e.g. scatterPlot).
    model.margin = {
      top: 20,
      right: 20,
      bottom: 50,
      left: 55
    };

    // Compute the inner box from the outer box and margin.
    model.when(["box", "margin"], function (box, margin) {
      model.width = box.width - margin.left - margin.right;
      model.height = box.height - margin.top - margin.bottom;
    });
  };

  // Helper function for xDomain and yDomain
  // Deals with whether the domain should be based
  // on the data minimum (as in a scatter plot),
  // or should start at 0 (as in a bar chart).
  function domain(data, options, get) {
    var zeroMin = options ? options.zeroMin : false;
    return zeroMin ? [ 0, d3.max(data, get) ] : d3.extent(data, get);
  }

  // # Domains and Scales

  // * `xDomain` and `yDomain` computes the scale domain from the data.
  //
  // The optional `options` argument may contain `{ zeroMin: true }`
  // to specify that zero should be the minimum of the scale domain.
  // 
  // With no options specified, the default scale domain is the extent of 
  // the data values corresponding data field.

  Reactivis.xDomain = function (model, options) {
    model.when(["data", "xAttribute"], function (data, xAttribute) {

      // TODO generalize getX
      var getX = function (d) { return d[xAttribute]; };
      model.xDomain = domain(data, options, getX);
    });
  };
  Reactivis.yDomain = function (model, options) {
    model.when(["data", "yAttribute"], function (data, yAttribute) {

      // TODO generalize getY
      var getY = function (d) { return d[yAttribute]; };
      model.yDomain = domain(data, options, getY);
    });
  };
  
  // Creates a Y linear scale.
  // Updates the Y scale based on data, Y attribute and height.
  Reactivis.yLinearScale = function (model, options) {
    var scale = d3.scale.linear();
    model.when(["data", "yDomain", "height"], function (data, yDomain, height) {
      model.yScale = scale.domain(yDomain).range([height, 0]);
    });
  };

  // Creates an X linear scale.
  // Updates the X scale based on data, X attribute and width.
  Reactivis.xLinearScale = function (model) {
    var scale = d3.scale.linear();
    model.when(["data", "xDomain", "width"], function (data, xDomain, width) {
      model.xScale = scale.domain(xDomain).range([0, width]);
    });
  };

  // Creates an X ordinal scale.
  // Updates the X scale based on data, X attribute and width.
  Reactivis.xOrdinalScale = function (model) {
    var scale = d3.scale.ordinal();
    model.when(["data", "xAttribute", "width"], function (data, xAttribute, width) {
      var getX = function (d) { return d[xAttribute]; };
      model.xScale = scale
        // TODO make 0.1 into a model property
        .rangeRoundBands([0, width], 0.1)
        .domain(
          data.map(getX)
        );
    });
  };

  // Creates an X time scale.
  // Updates the X scale based on data, X attribute and width.
  Reactivis.xTimeScale = function (model) {
    var scale = d3.time.scale();
    model.when(["data", "xDomain", "width"], function (data, xDomain, width) {
      model.xScale = scale.domain(xDomain).range([0, width]);
    });
  };

  // # Visualization DOM
  //
  // Reactivis provides reusable DOM related components that
  // store D3 selections of DOM elements on the model.
  
  Reactivis.svg = function (model) {

    // Create `svg` from `container`.
    model.when("container", function (container) {
      model.svg = d3.select(container).append('svg');

        // Use absolute positioning on the SVG element 
        // so that CSS can be used to position the div later
        // according to the model `box.x` and `box.y` properties.
        //.style('position', 'absolute');
    });

    // Update the svg with based on `box`, an object with
    // (x, y, width, height) representing the outer visualization box.
    model.when(["svg", "box"], function (svg, box) {

      // Resize the svg element that contains the visualization.
      svg.attr("width", box.width).attr("height", box.height);

      // Set the CSS `left` and `top` properties
      // to move the SVG element to `(box.x, box.y)`
      // relative to the container to apply the offset.
      //svg
      //  .style('left', box.x + 'px')
      //  .style('top', box.y + 'px');
    });

    // Create `g` from `svg`.
    model.when("svg", function (svg) {
      model.g = svg.append("g");
    });

    // Transform the visualization SVG container `g` based on the margin.
    model.when(["g", "margin"], function (g, margin) {
      g.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    });
  };

  Reactivis.xAxis = function (model) {
    var xAxis = d3.svg.axis().orient("bottom");

    model.when("g", function (g) {
      model.xAxisG = g.append("g").attr("class", "x axis");
    });

    model.when("xAxisG", function (xAxisG) {
      model.xAxisText = xAxisG.append("text")
        // This controls how far the axis text is away from the Y axis.
        // TODO make this a model property
        .attr("dy", "2.0em")
        .style("text-anchor", "middle");
    });

    // Update the X axis label position when width changes.
    model.when(["xAxisText", "width"], function (xAxisText, width) {
      xAxisText.attr("x", width / 2);
    });

    // Update the X axis transform when height changes.
    model.when(["xAxisG", "height"], function (xAxisG, height) {
      xAxisG.attr("transform", "translate(0," + height + ")");
    });

    // Update the X axis based on the X scale.
    model.when(["xAxisG", "xScale"], function (xAxisG, xScale) {
      xAxis.scale(xScale);
      xAxisG.call(xAxis);
    });

    // Update X axis label.
    model.when(["xAxisText", "xAxisLabel"], function (xAxisText, xAxisLabel) {
      xAxisText.text(xAxisLabel);
    });
  };

  Reactivis.yAxis = function (model) {
    var yAxis = d3.svg.axis().orient("left");

    model.when("g", function (g) {
      model.yAxisG = g.append("g").attr("class", "y axis");
    });

    model.when(["yAxisG"], function (yAxisG) {
      model.yAxisText = yAxisG.append("text")
        // This controls how far the axis text is away from the Y axis.
        // TODO make this a model property
        .attr("dy", "-2.8em")
        .style("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("y", 0);
    });

    model.when(["yAxisText", "height"], function (yAxisText, height) {
      yAxisText.attr("x", -height / 2);
    });

    // Update Y axis label.
    model.when(["yAxisText", "yAxisLabel"], function (yAxisText, yAxisLabel) {
      yAxisText.text(yAxisLabel);
    });

    // Adjust Y axis tick mark parameters.
    // See https://github.com/mbostock/d3/wiki/Quantitative-Scales#linear_tickFormat
    model.when(['yAxisNumTicks', 'yAxisTickFormat'], function (count, format) {
      yAxis.ticks(count, format);
    });


    // Update the Y axis based on the Y scale.
    model.when(["yAxisG", "yScale"], function (yAxisG, yScale) {

      // TODO move transitionDuration into the model.
      var transitionDuration = 100;
      yAxis.scale(yScale);
      yAxisG
        .transition().duration(transitionDuration)
        .call(yAxis);
    });
  };

  return Reactivis;
});
