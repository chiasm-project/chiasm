(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Chiasm = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Chiasm = require("./src/chiasm");
var layout = require("./src/plugins/layout/layout");
var barChart = require("./src/plugins/barChart/barChart");
var lineChart = require("./src/plugins/lineChart/lineChart");
var scatterPlot = require("./src/plugins/scatterPlot/scatterPlot");
var links = require("./src/plugins/links/links");

module.exports = function (container){
  var chiasm = Chiasm(container);
  chiasm.plugins.layout = layout;
  chiasm.plugins.barChart = barChart;
  chiasm.plugins.lineChart = lineChart;
  chiasm.plugins.scatterPlot = scatterPlot;
  chiasm.plugins.links = links;

//src/plugins/colorScale.js
//src/plugins/configEditor.js
//src/plugins/crossfilter.js
//src/plugins/csvLoader.js
//src/plugins/dataReduction.js
//src/plugins/dummyVis.js
  return chiasm;
};

},{"./src/chiasm":4,"./src/plugins/barChart/barChart":5,"./src/plugins/layout/layout":7,"./src/plugins/lineChart/lineChart":8,"./src/plugins/links/links":9,"./src/plugins/scatterPlot/scatterPlot":10}],2:[function(require,module,exports){
// ModelJS v0.2.1
//
// https://github.com/curran/model
// 
// Last updated by Curran Kelleher March 2015
//
// Includes contributions from
//
//  * github.com/mathiasrw
//  * github.com/bollwyvl
//  * github.com/adle29
//  * github.com/Hypercubed
//
// The module is defined inside an immediately invoked function
// so it does not pullute the global namespace.
(function(){

  // Returns a debounced version of the given function.
  // See http://underscorejs.org/#debounce
  function debounce(callback){
    var queued = false;
    return function () {
      if(!queued){
        queued = true;
        setTimeout(function () {
          queued = false;
          callback();
        }, 0);
      }
    };
  }

  // Returns true if all elements of the given array are defined, false otherwise.
  function allAreDefined(arr){
    return !arr.some(function (d) {
      return typeof d === 'undefined' || d === null;
    });
  }

  // The constructor function, accepting default values.
  function Model(defaults){

    // Make sure "new" is always used,
    // so we can use "instanceof" to check if something is a Model.
    if (!(this instanceof Model)) {
      return new Model(defaults);
    }

    // `model` is the public API object returned from invoking `new Model()`.
    var model = this,

        // The internal stored values for tracked properties. { property -> value }
        values = {},

        // The callback functions for each tracked property. { property -> [callback] }
        listeners = {},

        // The set of tracked properties. { property -> true }
        trackedProperties = {};

    // The functional reactive "when" operator.
    //
    //  * `properties` An array of property names (can also be a single property string).
    //  * `callback` A callback function that is called:
    //    * with property values as arguments, ordered corresponding to the properties array,
    //    * only if all specified properties have values,
    //    * once for initialization,
    //    * whenever one or more specified properties change,
    //    * on the next tick of the JavaScript event loop after properties change,
    //    * only once as a result of one or more synchronous changes to dependency properties.
    function when(properties, callback, thisArg){
      
      // Make sure the default `this` becomes 
      // the object you called `.on` on.
      thisArg = thisArg || this;

      // Handle either an array or a single string.
      properties = (properties instanceof Array) ? properties : [properties];

      // This function will trigger the callback to be invoked.
      var listener = debounce(function (){
        var args = properties.map(function(property){
          return values[property];
        });
        if(allAreDefined(args)){
          callback.apply(thisArg, args);
        }
      });

      // Trigger the callback once for initialization.
      listener();
      
      // Trigger the callback whenever specified properties change.
      properties.forEach(function(property){
        on(property, listener);
      });

      // Return this function so it can be removed later with `model.cancel(listener)`.
      return listener;
    }

    // Adds a change listener for a given property with Backbone-like behavior.
    // Similar to http://backbonejs.org/#Events-on
    function on(property, callback, thisArg){
      thisArg = thisArg || this;
      getListeners(property).push(callback);
      track(property, thisArg);
    }
    
    // Gets or creates the array of listener functions for a given property.
    function getListeners(property){
      return listeners[property] || (listeners[property] = []);
    }

    // Tracks a property if it is not already tracked.
    function track(property, thisArg){
      if(!(property in trackedProperties)){
        trackedProperties[property] = true;
        values[property] = model[property];
        Object.defineProperty(model, property, {
          get: function () { return values[property]; },
          set: function(newValue) {
            var oldValue = values[property];
            values[property] = newValue;
            getListeners(property).forEach(function(callback){
              callback.call(thisArg, newValue, oldValue);
            });
          }
        });
      }
    }

    // Cancels a listener returned by a call to `model.when(...)`.
    function cancel(listener){
      for(var property in listeners){
        off(property, listener);
      }
    }

    // Removes a change listener added using `on`.
    function off(property, callback){
      listeners[property] = listeners[property].filter(function (listener) {
        return listener !== callback;
      });
    }

    // Sets all of the given values on the model.
    // `newValues` is an object { property -> value }.
    function set(newValues){
      for(var property in newValues){
        model[property] = newValues[property];
      }
    }

    // Transfer defaults passed into the constructor to the model.
    set(defaults);

    // Public API.
    model.when = when;
    model.cancel = cancel;
    model.on = on;
    model.off = off;
    model.set = set;
  }
  
  // Model.None is A representation for an optional Model property that is not specified.
  // Model property values of null or undefined are not propagated through
  // to when() listeners. If you want the when() listener to be invoked, but
  // some of the properties may or may not be defined, you can use Model.None.
  // This way, the when() listener is invoked even when the value is Model.None.
  // This allows the "when" approach to support optional properties.
  //
  // For example usage, see this scatter plot example with optional size and color fields:
  // http://bl.ocks.org/curran/9e04ccfebeb84bcdc76c
  //
  // Inspired by Scala's Option type.
  // See http://alvinalexander.com/scala/using-scala-option-some-none-idiom-function-java-null
  Model.None = "__NONE__";

  // Support AMD (RequireJS), CommonJS (Node), and browser globals.
  // Inspired by https://github.com/umdjs/umd
  if (typeof define === "function" && define.amd) {
    define([], function () { return Model; });
  } else if (typeof exports === "object") {
    module.exports = Model;
  } else {
    this.Model = Model;
  }
})();

},{}],3:[function(require,module,exports){
(function (global){
// This module encapsulates reusable reactive flows
// common to many D3-based visualizations.
//
// Curran Kelleher June 2015
var Model = require("model-js");
var d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null);

// The returned public API object, containing functions that take as input
// a Model.js model, and as a side effect add reactive flows within that model.
var reactivis = {};

// This value is used for optionally defined public properties
var None = Model.None;

// Adds a public property to a model.
// This makes the property configurable via the Chiasm configuration.
function addPublicProperty(model, property, defaultValue){
  if(!model.publicProperties){
    model.publicProperties = [];
  }
  model.publicProperties.push(property);
  model[property] = defaultValue;
}

// Constructs an SVG element as a child of the `container` element.
// Makes the SVG size and location update with respect to the `box` property.
// Also adds a G element as a child of the SVG element, for visualizations.
reactivis.svg = function(model){

  // Create the SVG element from the container DOM element.
  model.when("container", function (container) {

    // Use CSS `position: relative` so that setting properties
    // `left` and `top` will position the SVG relative to the Chiasm container.
    model.svg = d3.select(container).append("svg")
      .style("position", "relative");
  });

  // Adjust the SVG based on the `box` property.
  model.when(["svg", "box"], function (svg, box) {

    // Set the CSS `left` and `top` properties to move the
    // SVG to `(box.x, box.y)` relative to its container.
    svg
      .style("left", box.x + "px")
      .style("top", box.y + "px")
      .attr("width", box.width)
      .attr("height", box.height);

    // Use negative margins to eliminate the SVG space taken up
    // in the layout flow. This is an ugly solution, but the alternatives
    // don't work - setting position:absolute doesn't work when the
    // Chiasm container is statically positioned.
    // http://stackoverflow.com/questions/13722095/how-to-remove-whitespace-that-appears-after-relative-positioning-an-element-with
    svg
      .style("margin-right", "-" + box.width + "px")
      .style("margin-bottom", "-" + box.height + "px");
  });

  // Create the SVG group that will contain the visualization.
  model.when("svg", function (svg) {
    model.g = svg.append("g");
  });
};

// Encapsulates conventional D3 margins.
// See http://bl.ocks.org/mbostock/3019563
reactivis.margin = function(model){

  // Set up the default margin.
  addPublicProperty(model, "margin",{
    "top": 32,
    "right": 2,
    "bottom": 40,
    "left": 47
  });

  // Compute the inner box from the outer box and margin.
  model.when(["box", "margin"], function (box, margin) {
    model.width = box.width - margin.left - margin.right;
    model.height = box.height - margin.top - margin.bottom;
  });

  // Adjust the translation of the group based on the margin.
  model.when(["g", "margin"], function (g, margin) {
    g.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  });

  // TODO change layout such that size is not added as a property.
  addPublicProperty(model, "size", 1);
};

// Adds a text title at the top of the visualization.
reactivis.title = function(model){

  addPublicProperty(model, "title", "");
  addPublicProperty(model, "titleOffset", -0.3);

  // Create the title text element.
  model.when("g", function (g){
    model.titleText = g.append("text").attr("class", "title-text");
  });

  // Center the title text when width changes.
  model.when(["titleText", "width"], function (titleText, width) {
    titleText.attr("x", width / 2);
  });

  // Update the title text based on the public `title` property.
  model.when(["titleText", "title"], function (titleText, title){
    titleText.text(title);
  });

  // Update the title text offset.
  model.titleOffset = 1;
  model.when(["titleText", "titleOffset"], function (titleText, titleOffset){
    titleText.attr("dy", titleOffset + "em");
  });
};

reactivis.color = function(model){

  addPublicProperty(model, "colorColumn", None);
  addPublicProperty(model, "colorDomain", None);
  addPublicProperty(model, "colorRange", None);
  addPublicProperty(model, "colorDefault", "black");

  // Set up the color scale.
  model.when(["colorDefault", "colorDomain", "colorRange"],
      function (colorDefault, colorDomain, colorRange){
    if(colorDomain !== None && colorRange !== None){
      model.colorScale = d3.scale.ordinal()
        .domain(colorDomain)
        .range(colorRange);
    } else {
      model.colorScale = None;
    }
  });

  // Set up the color evaluation function.
  model.when(["colorColumn", "colorScale", "colorDefault"],
      function(colorColumn, colorScale, colorDefault){
    if(colorColumn !== None && colorScale !== None){
      model.color = function(d){ return colorScale(d[colorColumn]); };
    }
    else {
      model.color = colorDefault;
    }
  });
};

// Generates a function for getting the X value.
reactivis.xAccessor = function(model){
  addPublicProperty(model, "xColumn", None);
  model.when(["xColumn"], function (xColumn) {
    if(xColumn !== None){
      model.xAccessor = function (d) { return d[xColumn]; };
    }
  });
};

// Generates a function for getting the Y value.
reactivis.yAccessor = function(model){
  addPublicProperty(model, "yColumn", None);
  model.when(["yColumn"], function (yColumn) {
    if(yColumn !== None){
      model.yAccessor = function (d) { return d[yColumn]; };
    }
  });
};

// A lookup table for scale constructors based on their type.
var scaleConstructors = {
  linear: d3.scale.linear,
  time: d3.time.scale,
  ordinalBands: d3.scale.ordinal
};

// A generalized function for computing the domain of scales, used for both X and Y scales.
function computeDomain(data, scaleType, accessor, domainMin, domainMax) {
  if(scaleType === "linear" || scaleType === "time"){
    if(domainMin === None && domainMax === None){
      return d3.extent(data, accessor);
    } else {
      if(domainMin === None){
        domainMin = d3.min(data, accessor);
      }
      if(domainMax === None){
        domainMax = d3.max(data, accessor);
      }
      return [domainMin, domainMax];
    }
  } else if (scaleType === "ordinalBands"){
    return data.map(accessor);
  }
}

// Sets up the X scale.
reactivis.xScale = function(model, scaleType){

  // Make the scale type a public property so it is configurable at runtime.
  // Example use case: dynamically switching between linear and log scales.
  addPublicProperty(model, "xScaleType", scaleType);

  // Allow the API client to optionally specify fixed min and max values.
  // Relevant only for quantitative scales (linear, time).
  addPublicProperty(model, "xDomainMin", None);
  addPublicProperty(model, "xDomainMax", None);

  // The padding between range bands (e.g. the space between bars in a bar chart).
  // Relevant only for ordinal scales.
  addPublicProperty(model, "xRangePadding", 0.1);

  // Compute the domain of the X column.
  model.when(["data", "xScaleType", "xAccessor", "xDomainMin", "xDomainMax"],
      function (data, xScaleType, xAccessor, xDomainMin, xDomainMax) {
    
    // TODO figure out a way to reduce duplication of property names in this code.
    model.xDomain = computeDomain(data, xScaleType, xAccessor, xDomainMin, xDomainMax);

  });

  // Compute the X scale.
  model.when(["xScaleType", "xDomain", "width", "xRangePadding"],
      function (xScaleType, xDomain, width, xRangePadding) {
    var scale = scaleConstructors[xScaleType]().domain(xDomain);
    if(xScaleType === "ordinalBands"){
      scale.rangeRoundBands([0, width], xRangePadding);
    } else {
      scale.range([0, width]);
    }
    model.xScale = scale;
  });

  // Generate a function for getting the scaled X value.
  model.when(["data", "xScale", "xAccessor"], function (data, xScale, xAccessor) {
    model.x = function (d) { return xScale(xAccessor(d)); };
  });
};

// Sets up the Y scale.
reactivis.yScale = function(model){

  // TODO unify code between X and Y scales.

  // Allow the API client to optionally specify fixed min and max values.
  addPublicProperty(model, "yDomainMin", None);
  addPublicProperty(model, "yDomainMax", None);
  addPublicProperty(model, "yScaleType", "linear");
  model.when(["data", "yScaleType", "yAccessor", "yDomainMin", "yDomainMax"],
      function (data, yScaleType, yAccessor, yDomainMin, yDomainMax) {

    // TODO figure out a way to reduce duplication of property names in this code.
    model.yDomain = computeDomain(data, yScaleType, yAccessor, yDomainMin, yDomainMax);
  });

  // Compute the Y scale.
  model.when(["yDomain", "height"], function (yDomain, height) {
    model.yScale = d3.scale.linear().domain(yDomain).range([height, 0]);
  });

  // Generate a function for getting the scaled Y value.
  model.when(["yScale", "yAccessor"], function (yScale, yAccessor) {
    model.y = function (d) { return yScale(yAccessor(d)); };
  });
};

// Adds the X axis and its label text.
reactivis.xAxis = function(model){

  addPublicProperty(model, "xAxisLabel", "");
  addPublicProperty(model, "xAxisLabelOffset", 1.9);

  // Set up the X axis.
  model.when("g", function (g) {
    model.xAxisG = g.append("g").attr("class", "x axis");
    model.xAxisText = model.xAxisG.append("text").style("text-anchor", "middle");
  });

  // Move the X axis label based on its specified offset.
  model.when(["xAxisText", "xAxisLabelOffset"], function (xAxisText, xAxisLabelOffset){
    xAxisText.attr("dy", xAxisLabelOffset + "em");
  });

  // Update the X axis transform when height changes.
  model.when(["xAxisG", "height"], function (xAxisG, height) {
    xAxisG.attr("transform", "translate(0," + height + ")");
  });

  // Center the X axis label when width changes.
  model.when(["xAxisText", "width"], function (xAxisText, width) {
    xAxisText.attr("x", width / 2);
  });

  // Update the X axis based on the X scale.
  model.when(["xAxisG", "xScale"], function (xAxisG, xScale) {
    xAxisG.call(d3.svg.axis().orient("bottom").scale(xScale));
  });

  // Update X axis label.
  model.when(["xAxisText", "xAxisLabel"], function (xAxisText, xAxisLabel) {
    xAxisText.text(xAxisLabel);
  });
};

// Adds the Y axis and its label text.
reactivis.yAxis = function(model){

  // The text shown as the axis label.
  addPublicProperty(model, "yAxisLabel", "");

  // The left-right offset of the axis label, unit is CSS "em"s.
  addPublicProperty(model, "yAxisLabelOffset", 1.4);

  // Set up the Y axis.
  model.when("g", function (g) {
    model.yAxisG = g.append("g").attr("class", "y axis");
    model.yAxisText = model.yAxisG.append("text")
      .style("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("y", 0);
  });
  
  // Move the Y axis label based on its specified offset.
  model.when(["yAxisText", "yAxisLabelOffset"], function (yAxisText, yAxisLabelOffset){
    yAxisText.attr("dy", "-" + yAxisLabelOffset + "em");
  });

  // Center the Y axis label when height changes.
  model.when(["yAxisText", "height"], function (yAxisText, height) {
    yAxisText.attr("x", -height / 2);
  });

  // Update Y axis label.
  model.when(["yAxisText", "yAxisLabel"], function (yAxisText, yAxisLabel) {
    yAxisText.text(yAxisLabel);
  });

  // Update the Y axis based on the Y scale.
  model.when(["yAxisG", "yScale"], function (yAxisG, yScale) {
    yAxisG.call(d3.svg.axis().orient("left").scale(yScale));
  });
};

// Expose the addPublicProperty function, as it is a useful utility
// function for visualizations that build on top of reactivis.
reactivis.addPublicProperty = addPublicProperty;

module.exports = reactivis;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"model-js":2}],4:[function(require,module,exports){
(function (global){
// This file contains the core implementation of Chiasm, which is a
// runtime environment and plugin architecture for interactive visualizations.
//
// The main purpose of this module is to maintain synchronization between a dynamic
// JSON configuration structure and a set of components instantiated by plugins.
// Dynamic configuration changes (diffs) are detected by Chiasm and executed as
// component lifecycle actions that
//
//  * create components (plugin instances)
//  * set component properties
//  * unset component properties (reset default values when a property is removed from the configuration)
//  * destroy components
//
// Draws from previous work found at
//
//  * https://github.com/curran/model-contrib/blob/gh-pages/modules/overseer.js
//  * https://github.com/curran/overseer/blob/master/src/overseer.js
//
// By Curran Kelleher June 2015
var Model = require("model-js");
var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

// All error message strings are kept track of here.
var ErrorMessages = {

  // This error occurs when a property is set via the configuration
  // or is declared as a public property but does not have a default value.
  // Every property set via the configuration must be declared by
  // the corresponding plugin as a public property, and must have a default value.
  // Without this strict enforcement , the behavior of Chiasm is unstable in the case that
  // a property is set, then the property is later removed from the configuration (unset).
  // The default values tell Chiasm what value to use after a property is unset.
  // Without default values, unsetting a property would have no effect, which would
  // make the state of the components out of sync with the configuration after an unset.
  missingDefault: "Default value for public property '${ property }' " +
                  "not specified for component with alias '${ alias }'.",

  // This error occurs when a component is requested via `chiasm.getComponent()`,
  // but it fails to appear after a timeout elapses (`chiasm.timeout`).
  componentTimeout: "Component with alias '${ alias }' does not exist " +
                    "after timeout of ${ seconds } seconds exceeded."
};

// Creates a new Error object with a message derived from the
// error message template corresponding to the given type.
function createError(type, values){
  return Error(_.template(ErrorMessages[type])(values));
}

// Methods for creating and serializing Action objects.
// These are used to express differences between configurations.
//
// Actions encapsulate all lifecycle events required to create,
// manipulate, and tear down components.
//
// The primary purpose of Action objects is to support editing the
// JSON application configuration at runtime. To avoid reloading the
// entire configuration in response to each change, the difference between
// two subsequent configurations is computed and expressed as an array of
// Action objects, then the Action objects are applied to the runtime environment.
//
// Based on previous work found at:
// https://github.com/curran/overseer/blob/master/src/action.js
//
// This architecture lays the foundation for undo/redo and real-time synchronization.
//
// For synchronization, these Action objects should be directly translatable
// into ShareJS operations for JSON transformation, documented at
// https://github.com/ottypes/json0
var Action = {
  create: function (alias, plugin) {
    return { method: "create", alias: alias, plugin: plugin };
  },
  destroy: function (alias) {
    return { method: "destroy", alias: alias };
  },
  set: function (alias, property, value) {
    return { method: "set", alias: alias, property: property, value: value };
  },
  unset: function (alias, property) {
    return { method: "unset", alias: alias, property: property};
  },
  toString: function (action) {
    return [
      action.method + "(",
      action.alias,
      action.property !== undefined ? ", " + action.property : "",
      action.value !== undefined ? ", " + action.value : "",
      action.plugin !== undefined ? ", " + action.plugin : "",
      ")"
    ].join("");
  }
};

// This function computes the difference ("diff") between two configurations.
// The diff is returned as an array of Action objects.
//
// Based on pervious work found at
// https://github.com/curran/overseer/blob/master/src/configDiff.js
function configDiff(oldConfig, newConfig){
  var actions = [],
      newAliases = _.keys(newConfig),
      oldAliases = _.keys(oldConfig);

  // Handle removed aliases.
  _.difference(oldAliases, newAliases).forEach(function (alias) {
    actions.push(Action.destroy(alias));
  });

  // Handle updated aliases.
  newAliases.forEach(function (alias) {
    var oldModel = alias in oldConfig ? oldConfig[alias].state || {} : null,
        newModel = newConfig[alias].state || {},
        oldProperties = oldModel ? _.keys(oldModel) : [],
        newProperties = _.keys(newModel),
        oldPlugin = alias in oldConfig ? oldConfig[alias].plugin : null,
        newPlugin = newConfig[alias].plugin;

    // Handle changed plugin.
    if(oldModel && (oldPlugin !== newPlugin)){

      // Destroy the old component that used the old plugin.
      actions.push(Action.destroy(alias));

      // Create a new component that uses the new plugin.
      oldModel = null;

      // Set all properties on the newly created component.
      oldProperties = [];
    }

    // Handle added aliases.
    if(!oldModel){
      actions.push(Action.create(alias, newConfig[alias].plugin));
    }

    // Handle added properties.
    _.difference(newProperties, oldProperties).forEach(function (property) {
      actions.push(Action.set(alias, property, newModel[property]));
    });

    // Handle removed properties.
    _.difference(oldProperties, newProperties).forEach(function (property) {
      actions.push(Action.unset(alias, property));
    });

    // Handle updated properties.
    _.intersection(newProperties, oldProperties).forEach(function (property) {
      if(!_.isEqual(oldModel[property], newModel[property])){
        actions.push(Action.set(alias, property, newModel[property]));
      }
    });
  });
  return actions;
}

// An asynchronous batch queue for processing Actions using Promises.
// Draws from https://www.promisejs.org/patterns/#all
// The argument `process` is a function that takes as input
// an item to process, and returns a promise.
function Queue(process){

  // This promise is replaced as each item is processed.
  var ready = Promise.resolve(null);

  // This function queues a batch of items and returns a promise for that batch.
  return function(items){
    return new Promise(function(resolve, reject){
      items.forEach(function(item){
        ready = ready.then(function() {
          return process(item);
        });
      });
      ready = ready.then(resolve, reject);
    });
  };
}

// The Chiasm constructor function exposed by this AMD module.
//
// Accepts a single argument `container`, a DOM element, typically a div.
// Components created by plugins will append their own DOM elements to this container,
// and will remove them when they are destroyed.
function Chiasm(container){

  // This is the public API object returned by the constructor.
  var chiasm = Model({

    // `plugins` is An object for setting up plugins before loading a configuration.
    // Chiasm first looks here for plugins, then if a plugin is not found here
    // it is dynamically loaded at runtime using RequireJS where the plugin name
    // corresponds to an AMD module name or arbitrary URL.
    //
    // * Keys are plugin names.
    // * Values are plugin implementations, which are constructor functions for
    //   runtime components. A plugin constructor function takes as input a reference
    //   to the chiasm instance, and yields as output a ModelJS model with the following properties:
    //   * `publicProperties` An array of property names. This is the list of properties that
    //     are configurable via the JSON configuration structure. Each property listed here
    //     must have a default value present on the freshly constructed component.
    //   * `destroy` (optional) A function that frees all resources allocated by the component,
    //     e.g. removing any DOM elements added to the Chiasm container, and removing event listeners.
    //
    // See additional plugin documentation at https://github.com/curran/chiasm/wiki
    plugins: {},

    // The JSON configuration object encapsulating application state.
    //
    //   * Keys are component aliases.
    //   * Values are objects with the following properties:
    //     * `plugin` - The name of the plugin.
    //     * `state` - An object representing the state of a component, where
    //       * Keys are component property names
    //       * Values are component property values
    config: {},

    // The timeout (in milliseconds) used for plugin loading and getComponent().
    // The default timeout is 10 seconds.
    timeout: 10000,

    // Expose the container DOM element to plugins so they can
    // append their own DOM elements to it.
    container: container
  });

  // The runtime components created by plugins.
  //
  // * Keys are component aliases.
  // * Values are components constructed by plugins, which are ModelJS models.
  var components = {};

  // This object stores default values for public properties.
  // These are the values present when the component is constructed.
  // The default values are used when processing "unset" actions, which restore
  // default values to components when properties are removed from the configuration.
  //
  // * Keys are component aliases.
  // * Values are objects where
  //   * Keys are component property names from `component.publicProperties`
  //   * Values are default component property values
  var defaults = {};

  // These methods unpack Action objects and invoke corresponding
  // functions that execute them. Each method returns a promise.
  var methods = {
    create: function (action) {
      return create(action.alias, action.plugin);
    },
    destroy: function (action) {
      return destroy(action.alias);
    },
    set: function (action) {
      return set(action.alias, action.property, action.value);
    },
    unset: function (action) {
      return unset(action.alias, action.property);
    }
  };

  // An asynchronous FIFO queue for processing actions.
  // This is used as essentially a synchronization lock, so multiple synchronous calls
  // to setConfig() do not cause conflicting overlapping asynchronous action sequences.
  var queue = Queue(function (action){
    return methods[action.method](action);
  });

  // This object contains the callbacks that respond to changes in
  // public properties of components. These are stored so they
  // can be removed from components when the they are destroyed.
  var callbacks = {};

  // This flag is set to true when "set" actions are being processed,
  // so Chiasm can distinguish between changes originating from setConfig()
  // and changes originating from components, possibly via user interactions.
  var settingProperty = false;

  // This flag is set to true inside setConfig() while `chiasm.config` is being set.
  // This is so changes do not get counted twice when invoking setConfig(),
  // and it also works if API clients set `chiasm.config = ...`.
  var settingConfig = false;

  // Gets a component by alias, returns a promise.
  // This is asynchronous because the component may not be instantiated
  // when this is called, but may be in the process of loading. In this case the
  // function polls for existence of the component until the timeout has elapsed.
  function getComponent(alias){
    var startTime = Date.now();
    return new Promise(function(resolve, reject){
      (function poll(){
        if(alias in components){
          resolve(components[alias]);
        } else if ((Date.now() - startTime) < chiasm.timeout){
          setTimeout(poll, 1);
        } else {
          reject(createError("componentTimeout", {
            alias: alias,
            seconds: chiasm.timeout / 1000
          }));
        }
      }());
    });
  }

  // Loads a plugin by name, returns a promise.
  function loadPlugin(plugin){
    return new Promise(function(resolve, reject){

      // If the plugin has been set up in `chiasm.plugins`, use it.
      if(plugin in chiasm.plugins){
        resolve(chiasm.plugins[plugin]);
      }
      
      // TODO think about how to support dynamic fetching of plugins,
      // and also how to support loading ES6 modules via SystemJS
      //else if (typeof System !== 'undefined' && typeof System.amdRequire !== 'undefined') {
      //  System.amdRequire([plugin], resolve, reject);
      //}
    });
  }

  // Applies a "create" action.
  function create(alias, plugin){
    return new Promise(function(resolve, reject){
      loadPlugin(plugin).then(function (constructor) {

        try {

          // Construct the component using the plugin, passing the chiasm instance.
          var component = new constructor(chiasm);

          // Store a reference to the component.
          components[alias] = component;

          // Create a defaults object for population with values for each public property.
          defaults[alias] = {};

          // Handle public properties.
          if("publicProperties" in component){

            // Validate that all public properties have default values and store them.
            component.publicProperties.forEach(function(property){

              // Require that all declared public properties have a default value.
              if(component[property] === undefined){

                // Throw an exception in order to break out of the current control flow.
                throw createError("missingDefault", {
                  property: property,
                  alias: alias
                });
              }

              // Store default values for public properties.
              defaults[alias][property] = component[property];
            });

            // Propagate changes originating from components into the configuration.
            callbacks[alias] = component.publicProperties.map(function(property){

              var callback = function(newValue){

                // If this change did not originate from setConfig(),
                // but rather originated from the component, possibly via user interaction,
                // then propagate it into the configuration.
                if(!settingProperty){

                  // If no state is tracked, create the state object.
                  if(!("state" in chiasm.config[alias])){
                    chiasm.config[alias].state = {};
                  }

                  // Surgically change `chiasm.config` so that the diff computation will yield
                  // no actions. Without this step, the update would propagate from the
                  // component to the config and then back again unnecessarily.
                  chiasm.config[alias].state[property] = newValue;

                  // This assignment will notify any callbacks that the config has changed,
                  // (e.g. the config editor), but the config diff will yield no actions to execute.
                  chiasm.config = chiasm.config;
                }
              };

              // Listen for property changes on the component model.
              component.on(property, callback);

              // Store the callbacks for each property so they can be removed later,
              // when the component is destroyed.
              return {
                property: property,
                callback: callback
              };
            });
          }
          resolve();
        } catch (err) {

          // Catch the error for missing default values and
          // pass it to the Promise reject function.
          reject(err);
        }
      }, reject);
    });
  }

  // Applies a "destroy" action.
  function destroy(alias){
    return new Promise(function(resolve, reject){
      getComponent(alias).then(function(component){

        // Remove public property callbacks.
        if(alias in callbacks){
          callbacks[alias].forEach(function(cb){
            component.off(cb.property, cb.callback);
          });
          delete callbacks[alias];
        }

        // Invoke component.destroy(), which is part of the plugin API.
        if("destroy" in component){
          component.destroy();
        }

        // Remove the internal reference to the component.
        delete components[alias];

        // Remove stored default values that were stored.
        delete defaults[alias];

        resolve();
      }, reject);
    });
  }

  // Applies a "set" action.
  function set(alias, property, value) {
    return new Promise(function(resolve, reject){
      getComponent(alias).then(function(component){

        // Make sure that every property configured through "set" actions
        // is a public property and has a default value. Without this strict enforcement,
        // the behavior of Chiasm with "unset" actions is unstable.
        if( defaults[alias] && defaults[alias][property] !== undefined ){

          // Set this flag so Chiasm knows the change originated from setConfig().
          settingProperty = true;

          // Set the property on the component. Since the component is a ModelJS model,
          // simply setting the value like this will propagate the change through the
          // reactive data dependency graph of the component
          component[property] = value;

          settingProperty = false;
          resolve();
        } else {
          reject(createError("missingDefault", {
            property: property,
            alias: alias
          }));
        }
      }, reject);
    });
  }

  // Applies an "unset" action.
  function unset(alias, property, callback) {
    return new Promise(function(resolve, reject){
      getComponent(alias).then(function(component){

        // Set this flag so Chiasm knows the change originated from setConfig().
        settingProperty = true;

        component[property] = defaults[alias][property];

        settingProperty = false;
        resolve();
      }, reject);
    });
  }

  // Handle setting configuration via `chiasm.config = ...`.
  // This will work, but any errors that occur will be thrown as exceptions.
  chiasm.on("config", function(newConfig, oldConfig){
    if(!settingConfig){
      setConfig(newConfig, oldConfig);
    }
  });

  // Sets the Chiasm configuration, returns a promise.
  function setConfig(newConfig, oldConfig){

    // The second argument, oldConfig, is optional, and
    // defaults to the current value of `chiasm.config`.
    oldConfig = oldConfig || chiasm.config;

    // Compute the difference between the old and new configurations.
    var actions = configDiff(oldConfig, newConfig);

    // If there are any changes, execute them.
    if(actions.length > 0){

      // Store the new config.
      settingConfig = true;
      chiasm.config = _.cloneDeep(newConfig);
      settingConfig = false;

      // Queue the actions from the diff to be executed in sequence,
      // and return the promise for this batch of actions.
      return queue(actions);

    } else {

      // If there are no actions to execute, return a resolved promise.
      return Promise.resolve(null);
    }
  }

  // Expose public methods.
  chiasm.getComponent = getComponent;
  chiasm.setConfig = setConfig;

  // This function checks if a component exists.
  // Necessary for code coverage in unit tests.
  chiasm.componentExists = function(alias){
    return alias in components;
  };

  return chiasm;
}

// Expose configDiff and Action for unit tests.
Chiasm.configDiff = configDiff;
Chiasm.Action = Action;

// Return the Chiasm constructor function as this AMD module.
module.exports = Chiasm;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"model-js":2}],5:[function(require,module,exports){
(function (global){
// A reusable bar chart module.
// Draws from D3 bar chart example http://bl.ocks.org/mbostock/3885304
// Curran Kelleher June 2015
var reactivis = require("reactivis");
var d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null);
var Model = require("model-js");
var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

var None = Model.None;

// The constructor function, accepting default values.
function BarChart(chiasm) {

  // Create a Model instance for the bar chart.
  // This will serve as the public API for the visualization.
  var model = Model();

  model.container = chiasm.container;

  reactivis.svg(model);
  reactivis.title(model);
  reactivis.margin(model);

  reactivis.xAccessor(model);
  reactivis.xScale(model, "ordinalBands");
  reactivis.xAxis(model);

  reactivis.yAccessor(model);
  reactivis.yScale(model);
  reactivis.yAxis(model);

  reactivis.color(model);

  // Add an SVG group to contain the line.
  model.when("g", function (g) {
    model.barsG = g.append("g");
  });

  // Draw the bars.
  model.when(["barsG", "data", "x", "y", "xScale", "height", "color", "xAccessor"],
      function (barsG, data, x, y, xScale, height, color, xAccessor){
    var bars = barsG.selectAll("rect").data(data, xAccessor);
    bars.enter().append("rect");
    bars
      .attr("x", x)
      .attr("y", y)
      .attr("width", xScale.rangeBand())
      .attr("height", function(d) { return height - y(d); })
      .attr("fill", color);
    bars.exit().remove();
  });

  model.destroy = function(){
    if(model.container && model.svg){
      model.svg.node().innerHTML = "";
      model.container.removeChild(model.svg.node());
    }
  };

  return model;
}

module.exports = BarChart;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"model-js":2,"reactivis":3}],6:[function(require,module,exports){
(function (global){
// This module provides a function that computes a nested box layout.
//
// Created by Curran Kelleher June 2015
var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

// Takes as input the following arguments:
//
// * `layout` A tree data structure defining nested boxes. The root
//   of the tree may be either a leaf node or an internal node.
//   * Leaf nodes are component alias strings.
//   * Internal nodes are objects with the following properties:
//     * `orientation` A string, either
//       * "horizontal", meaning this node is subdivided horizontally
//         with children placed from left to right, or
//       * "vertical", meaning this node is subdivided vertically
//         with children placed from top to bottom.
//     * `children` An array of child node objects, each of which may be 
//       either a leaf node or internal node.
//     * `size` The size of the internal node, with the same specifications
//       as values within `sizes` (see next bullet point).
// * `sizes` An object that specifies component size options, where
//   * Keys are component alias strings.
//   * Values are objects with the following properties:
//     * `size` the width (if the containing box is horizontal)
//       or height (if the containing box is vertical) of the component.
//       May be either:
//       * a number (like "1.5" or "1", expressed as a number or a string) that 
//       determines size relative to siblings within the containing box, or
//       * a count of pixels (like "50px" or "200px" expressed as a string 
//         with "px" suffix) that determines an absolute fixed size.
//         This is useful in cases where components have fixed-size UI widgets 
//         rather than flexibly resizable visualizations.
//       * If `size` is not specified, it is assigned a default value of 1.
//     * `hidden` A boolean for hiding components. If true, the component
//       is excluded from the layout, if false the component is included.
// * `box` An object describing the outermost box of the layout,
//   with the following properties:
//   * `width` The width of the box in pixels.
//   * `height` The height of the box in pixels.
//   * `x` The X offset of the box in pixels.
//     If not specified, this defaults to zero.
//   * `y` The Y offset of the box in pixels.
//     If not specified, this defaults to zero.
//
// Returns an object where
//
//  * Keys are component aliases.
//  * Values are objects representing the computed box for the component,
//    having the following integer properties:
//   * `x` The X offset of the box in pixels.
//   * `y` The Y offset of the box in pixels.
//   * `width` The width of the box in pixels.
//   * `height` The height of the box in pixels.
//   * These box dimensions are quantized from floats to ints such that there are no gaps.
function computeLayout(layout, sizes, box){
  var result = {},
      isHorizontal,
      wiggleRoom,
      sizeSum = 0,
      x,
      y,
      visibleChildren;

  box.x = box.x || 0;
  box.y = box.y || 0;
  sizes = sizes || {};

  function size(layout){
    var result, alias;
    if(isLeafNode(layout)){
      alias = layout;
      if((alias in sizes) && ("size" in sizes[alias])){
        result = sizes[alias].size;
      } else {
        result = 1;
      }
    } else {
      result = layout.size || 1;
    }
    if(typeof result === "string" && ! isPixelCount(result)){
      result = parseFloat(result);
    }
    return result;
  }

  function isVisible(layout) {
    if(isLeafNode(layout) && (layout in sizes)){
      return !sizes[layout].hidden;
    } else {
      return true;
    }
  }

  if(isLeafNode(layout)){
    result[layout] = _.clone(box);
  } else {
    isHorizontal = layout.orientation === "horizontal";
    wiggleRoom = isHorizontal ? box.width : box.height;
    visibleChildren = layout.children.filter(isVisible);
    visibleChildren.forEach(function (child) {
      if(isPixelCount(size(child))){
        wiggleRoom -= pixelCount(size(child));
      } else {
        sizeSum += size(child);
      }
    });
    x = box.x;
    y = box.y;
    visibleChildren.forEach(function (child) {
      var childBox = { x: x, y: y},
          childSize = size(child),
          sizeInPixels;

      if(isPixelCount(childSize)){
        sizeInPixels = pixelCount(childSize);
      } else {
        sizeInPixels = (childSize / sizeSum) * wiggleRoom;
      }

      if(isHorizontal){
        childBox.width = sizeInPixels;
        childBox.height = box.height;
        x += childBox.width;
      } else {
        childBox.width = box.width;
        childBox.height = sizeInPixels;
        y += childBox.height;
      }

      quantize(childBox);

      if(isLeafNode(child)){
        result[child] = childBox;
      } else {
        _.extend(result, computeLayout(child, sizes, childBox));
      }
    });
  }
  return result;
};

function isLeafNode(layout){
  return typeof layout === "string";
}

function isPixelCount(size){
  return (typeof size === "string") && endsWith(size, "px");
}

// http://stackoverflow.com/questions/280634/endswith-in-javascript
function endsWith(str, suffix){
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function pixelCount(size){
  return parseInt(size.substr(0, size.length - 2));
}

function quantize(box){
  var x = Math.round(box.x),
      y = Math.round(box.y);
  box.width = Math.round(box.width + box.x - x);
  box.height = Math.round(box.height + box.y - y);
  box.x = x;
  box.y = y;
}

module.exports = computeLayout;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],7:[function(require,module,exports){
(function (global){
// This plugin uses the computeLayout module
// to assign sizes to visible components.
//
// Draws from previous work found at
// https://github.com/curran/model-contrib/blob/gh-pages/modules/boxes.js
//
// By Curran Kelleher June 2015
var computeLayout = require("./computeLayout");
var Model = require("model-js");
var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

// The layout Chiasm plugin constructor function.
function Layout(chiasm){

  // The public API object returned by the constructor function.
  var model = Model({
    publicProperties: ["layout"],
    layout: {}
  });

  // Sets the `box` model property based on actual container size .
  function setBox(){
    model.box = {
      x: 0,
      y: 0,
      width: chiasm.container.clientWidth,
      height: chiasm.container.clientHeight
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
      chiasm.getComponent(alias).then(function(component){
        component.box = boxes[alias];
      });
    });
  });

  // Compute `sizes` from chiasm components.
  model.when(["layout"], function(layout){

    // Extract the list of aliases referenced in the layout.
    var aliases = aliasesInLayout(layout);

    // Set sizes once initially.
    extractSizes(aliases);

    // Set sizes when the "size" property changes on any component.
    aliases.forEach(function(alias){
      chiasm.getComponent(alias).then(function(component){
        // TODO clean up listeners, test for leaks.
        // TODO bubble errors to UI
        component.when("size", function(size){
          extractSizes(aliases);
        });
      });
    });
  });

  // Sets `model.sizes` by extracting the "size" and "hidden"
  // properties component corresponding to each alias in `aliases`.
  function extractSizes(aliases){

    // Compute which component aliases are referenced.
    var sizes = {};
    

    // For each alias referenced in the layout,
    Promise.all(aliases.map(function(alias){
      return new Promise(function(resolve, reject){
        chiasm.getComponent(alias).then(function(component){

          // store its "size" and "hidden" properties.
          if(component.size || component.hidden){
            sizes[alias] = {};
            if(component.size){
              sizes[alias].size = component.size;
            }
            if(component.hidden){
              // TODO test this line
              sizes[alias].hidden = component.hidden;
            }
          }
          resolve();
        }, reject);
      });
    })).then(function(){
      // Set the stored "size" and "hidden" properties
      // on the model to trigger the layout computation.
      if(!_.isEqual(model.sizes, sizes)){
        model.sizes = sizes;
      }
    }, function(err){
      // Throw the error so it can be seen in a Node environment.
      throw err;
    });

  }

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

  // Determines whether the given node in the layout tree
  // is a leaf node or a non-leaf node.
  function isLeafNode(layout){

    // If it is a leaf node, then it is a string
    // that is interpreted as a component alias.
    return typeof layout === "string";
  }

  // Return the public API.
  return model;
}

module.exports = Layout;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./computeLayout":6,"model-js":2}],8:[function(require,module,exports){
(function (global){
// A reusable line chart module.
// Draws from D3 line chart example http://bl.ocks.org/mbostock/3883245
// Curran Kelleher June 2015
var reactivis = require("reactivis");
var d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null);
var Model = require("model-js");
var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

var None = Model.None;

// The constructor function, accepting default values.
return function LineChart(chiasm) {

  // Create a Model instance for the line chart.
  // This will serve as the line chart's public API.
  var model = Model();

  // TODO move this logic into Chiasm,
  // TODO add to plugin docs.
  model.container = chiasm.container;

  reactivis.svg(model);
  reactivis.title(model);
  reactivis.margin(model);
  reactivis.color(model);

  reactivis.xAccessor(model);
  reactivis.xScale(model, "time");
  reactivis.xAxis(model);

  reactivis.yAccessor(model);
  reactivis.yScale(model);
  reactivis.yAxis(model);

  // Add an SVG group to contain the lines.
  model.when("g", function (g) {
    model.lineG = g.append("g");
  });

  // Draw the lines.
  model.lineColumn = None;
  model.when(["lineG", "data", "lineColumn", "x", "y", "color"],
      function (lineG, data, lineColumn, x, y, color){
    var linesData = d3.nest()
          .key(function(d){ 
            if(lineColumn !== None){
              return d[lineColumn]; // Have multiple lines.
            } else {
              return "X";// have only a single line.
            }
          })
          .entries(data),
        line = d3.svg.line().x(x).y(y),
        lines = lineG.selectAll(".line").data(linesData);

    lines.enter().append("path").attr("class", "line");
    lines
      .attr("d", function(d){ return line(d.values); })
      .style("stroke", color);
    lines.exit().remove();
  });

  model.destroy = function(){
    if(model.container && model.svg){
      model.svg.node().innerHTML = "";
      model.container.removeChild(model.svg.node());
    }
  };

  return model;
}
module.exports = LineChart;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"model-js":2,"reactivis":3}],9:[function(require,module,exports){
(function (global){
// This module implements data binding between components.
// by Curran Kelleher June 2015
var d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null);
var Model = require("model-js");

function Links(chiasm) {

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
}
module.exports = Links;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"model-js":2}],10:[function(require,module,exports){
(function (global){
// A reusable scatter plot module.

// Curran Kelleher June 2015
var reactivis = require("reactivis");
var d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null);
var Model = require("model-js");

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
  reactivis.yScale(model, "linear");
  reactivis.yAxis(model);

  reactivis.color(model);

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
}
module.exports = ScatterPlot;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"model-js":2,"reactivis":3}]},{},[1])(1)
});
