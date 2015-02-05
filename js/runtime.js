// The runtime engine for interactive visualizations.
//
// Draws from previous work found at
//
//  * https://github.com/curran/model-contrib/blob/gh-pages/modules/overseer.js
//  * https://github.com/curran/overseer/blob/master/src/overseer.js
//
// Created by Curran Kelleher Feb 2015
define(["model", "configDiff", "async"], function (Model, configDiff, async) {

  // This module provides a runtime constructor function that returns a `runtime`
  // object with the following properties:
  return function Runtime(){
    var runtime = Model({

      // * `plugins` An object for setting up plugins before loading a configuration.
      //   The runtime first looks here for plugins, then if a plugin is not found here
      //   it is dynamically loaded at runtime using RequireJS where the plugin name 
      //   is used as the AMD module name.
      //   * Keys are plugin names.
      //   * Values are plugin implementations, which are constructor functions for
      //     runtime components. A plugin constructor function takes as input a reference
      //     to the runtime, and yield as output a ModelJS model with the following properties:
      //     * `publicProperties` An array of property names whose updates will be propagated
      //       to the configuration as part of the component's serialized state.
      //     * `destroy` (optional) A function that frees all resources allocated by the component.
      plugins: {},

      // * `config` The configuration object encapsulating application state.
      //   * Keys are component aliases.
      //   * Values are objects with the following properties:
      //     * `plugin` - The name of the plugin module that provides a factory
      //       that instantiates the component (and later tears it down).
      //     * `state` - An object containing the serialized state of the public
      //       properties of the component.
      config: {}

    });

    // This tracks the previous configuration state,
    // necessary for computing configuration differences.
    var oldConfig = {};

    // The runtime components.
    //
    // * Keys are component aliases.
    // * Values are components constructed by plugins.
    var components = {};

    // These methods unpack actions and invoke the corresponding functions.
    var methods = {
      create: function (action, callback) {
        create(action.alias, action.plugin, callback);
      },
      destroy: function (action, callback) {
        destroy(action.alias, callback);
      },
      set: function (action, callback) {
        set(action.alias, action.property, action.value, callback);
      },
      unset: function (action, callback) {
        unset(action.alias, action.property, callback);
      }
    };

    // An asynchronous FIFO queue for applying actions to the runtime.
    var actionQueue = async.queue(function(action, callback){
      methods[action.method](action, callback);
    }, 1);

    // Respond to changes in configuration.
    runtime.when("config", function(newConfig){
      configDiff(oldConfig, newConfig).forEach(actionQueue.push);
      oldConfig = newConfig;
    });

    // Gets a component by alias. May be asynchronous
    // if the component has not yet been constructed.
    function getComponent (alias, callback) {
      var component = components[alias] ? components[alias]: null;

      // If the component is already loaded, call the callback immediately.
      if(component){
        callback(component);
      } else {

        // Otherwise, wait until the component has loaded by polling every 100ms.
        setTimeout(function () {
          runtime.getComponent(alias, callback);
        }, 100);
      }
    }

    function loadPlugin(plugin, callback){
      if(plugin in runtime.plugins){
        callback(runtime.plugins[plugin]);
      } else {
        // TODO test this path
        require([plugin], callback);
      }
    }

    function create(alias, plugin){
      loadPlugin(plugin, function (constructor) {
        components[alias] = constructor(runtime);
      });
    }

    runtime.getComponent = getComponent;

    return runtime;
  };
});
