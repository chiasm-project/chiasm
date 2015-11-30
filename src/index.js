// chiasm.js
// github.com/chiasm-project/chiasm
//
// This file contains the core implementation of Chiasm, a runtime environment
// and plugin architecture for interactive data visualizations in the browser.
//
// The main purpose of this module is to maintain synchronization between a
// dynamic JSON configuration structure and a set of components instantiated by
// plugins.  Dynamic configuration changes (diffs) are detected by Chiasm and
// executed as component lifecycle actions that
//
//  * create components (plugin instances)
//  * set component properties
//  * unset component properties (reset default values when a property is removed from the configuration)
//  * destroy components
//
// Draws from previous work found at
//
//  * https://github.com/curran/model-contrib/blob/gh-pages/modules/overseer.js
//
//  * https://github.com/curran/overseer/blob/master/src/overseer.js
//
//  * https://github.com/curran/dashboardScaffold
var Model = require("model-js");
var _ = require("lodash");

// Use this ES6 Promise polyfill for browser compatibility.
var Promise = require("es6-promise").Promise;

// Load core Chiasm modules.
var configDiff    = require("./config-diff");
var Action        = require("./action");
var Queue         = require("./queue");
var ErrorMessages = require("./error-messages");

// Creates a new Error object with a message derived from the
// error message template corresponding to the given type.
function createError(type, values){
  return Error(_.template(ErrorMessages[type])(values));
}

// Constructs a Chiasm instance.
// Accepts a single argument, a selector for a DOM element that
// component DOM elements will be injected into.
function Chiasm(){

  // This is the public API object returned by the constructor.
  // TODO reconsider if it is a good idea to have Chiasm be a model-js Model.
  var chiasm = Model();

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
  chiasm.plugins = {};

  // The JSON configuration object encapsulating application state.
  //
  //   * Keys are component aliases.
  //   * Values are objects with the following properties:
  //     * `plugin` - The name of the plugin.
  //     * `state` - An object representing the state of a component, where
  //       * Keys are component property names
  //       * Values are component property values
  chiasm.config = {};

  // The timeout (in milliseconds) used for plugin loading and getComponent().
  // The default timeout is 10 seconds.
  chiasm.timeout = 10000;

  // The runtime components created by plugins.
  //
  // * Keys are component aliases.
  // * Values are components constructed by plugins, which are model-js Models.
  var components = {};

  // TODO move this logic into ChiasmComponent
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

    // TODO use queue for getting components to avoid race conditions.
    var startTime = Date.now();
    return new Promise(function(resolve, reject){
      (function poll(){
        if(alias === "self") {
          resolve(chiasm);
        } else if(alias in components){
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
      } else {
        reject(new Error("Plugin '" + plugin + "' has not defined in chiasm.plugins."));
        // TODO think about adding a hook for dynamic plugin loading
      }
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

  // TODO get rid of this confusing dual API business for setting the config.

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
      chiasm.config = newConfig;
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
