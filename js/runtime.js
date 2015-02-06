// The runtime engine for interactive visualizations.
//
// Draws from previous work found at
//
//  * https://github.com/curran/model-contrib/blob/gh-pages/modules/overseer.js
//  * https://github.com/curran/overseer/blob/master/src/overseer.js
//
// Created by Curran Kelleher Feb 2015
define(["model", "configDiff", "async", "lodash"], function (Model, configDiff, async, _) {

  // This module provides a runtime constructor function that returns a `runtime`
  // object with the following properties:
  return function Runtime(div){
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
      config: {},

      // * `div` The DOM container passed into the runtime constructor.
      //   Visible plugins should append their own DOM elements to this container
      //   (and remove them when destroyed).
      div: div

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
        // TODO test
        unset(action.alias, action.property, callback);
      }
    };

    // An asynchronous FIFO queue for applying actions to the runtime.
    var actionQueue = async.queue(function(action, callback){
      methods[action.method](action, callback);
    }, 1);

    // Gets a component by alias, passes it to the callback.
    // If the component exists, the callback is called immediately.
    // If the component does not exist, this function waits until the
    // component is created (by polling), then the callback is called.
    function getComponent (alias, callback) {
      async.until(
        function(){ return alias in components; },
        function(cb){ setTimeout(cb, 0); },
        function(){ callback(components[alias]); }
      );
    }

    // Loads a plugin by name. 
    // First tries to find plugin in runtime.plugins,
    // then uses RequireJS to load the plugin as an AMD module.
    function loadPlugin(plugin, callback){
      if(plugin in runtime.plugins){
        callback(runtime.plugins[plugin]);
      } else {
        /* TODO test this path */
        require([plugin], callback);
      }
    }

    // Applies a "create" action to the runtime.
    function create(alias, plugin, callback){
      loadPlugin(plugin, function (constructor) {
        var component = constructor(runtime);
        components[alias] = component;
        
        // Propagate changes from components to configuration.
        if("publicProperties" in component){
          component.publicProperties.forEach(function(property){

            /* TODO clean up these listeners on destroy, test for memory leak. */

            component.when(property, function(value){

              // Ignore changes that originated from the config.
              // Use oldConfig rather than runtime.config to handle the case that
              // runtime.config has been changed and its listener has not yet run.
              if(oldConfig[alias].state[property] !== value){

                // Apply the change from the component to a copy of the config.
                var newConfig = _.cloneDeep(oldConfig);
                newConfig[alias].state[property] = value;

                // Surgically change oldConfig so that the diff computation will yield
                // no actions. Without this line, the update would propagate from the 
                // component to the config and then back again unnecessarily.
                oldConfig[alias].state[property] = value;

                // This assignment will notify any listeners that the config has changed.
                runtime.config = newConfig;
              }

            });
          });
        }

        callback();
      });
    }

    // Applies a "destroy" action to the runtime.
    function destroy(alias, callback){
      getComponent(alias, function(component){
        if("destroy" in component){
          component.destroy();
        }
        delete components[alias];
        callback();
      });
    }
    
    // Applies a "set" action to the runtime.
    function set(alias, property, value, callback) {
      getComponent(alias, function(component){
        component[property] = value;
        callback();
      });
    }

    // Respond to changes in configuration.
    runtime.when("config", function(newConfig){
      var actions = configDiff(oldConfig, newConfig);
      actions.forEach(actionQueue.push);
      oldConfig = newConfig;
    });

    // Expose getComponent as a public method.
    runtime.getComponent = getComponent;

    // This function checks if a component exists.
    // Necessary for complete code coverage in unit tests.
    runtime.componentExists = function(alias){
      return alias in components;
    };

    return runtime;
  };
});
