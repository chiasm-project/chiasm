// This file contains the core implementation of Chiasm, which is a
// runtime environment and plugin architecture for interactive visualizations.
//
// The main purpose of this module is to maintain synchronization between a dynamic
// JSON configuration structure and a set of components instantiated by plugins.
//
// Draws from previous work found at
//
//  * https://github.com/curran/model-contrib/blob/gh-pages/modules/overseer.js
//  * https://github.com/curran/overseer/blob/master/src/overseer.js
//
// By Curran Kelleher April 2015
define(["model", "lodash"], function (Model, _) {

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
  // This lays the foundation for undo/redo and real-time synchronization.
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

  // An asynchronous batch queue using Promises.
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
  // Accepts a single arcument `container`, a DOM element, typically a div.
  // Components created by plugins will append their own DOM elements to this container element.
  function Chiasm(container){

    // This is the public API object returned by the constructor.
    var chiasm = Model({

      // `plugins` is An object for setting up plugins before loading a configuration.
      // Chiasm first looks here for plugins, then if a plugin is not found here
      // it is dynamically loaded at runtime using RequireJS where the plugin name 
      // corresponds to an AMD module name or artibrary URL.
      // 
      // * Keys are plugin names.
      // * Values are plugin implementations, which are constructor functions for
      //   runtime components. A plugin constructor function takes as input a reference
      //   to the chiasm instance, and yields as output a ModelJS model with the following properties:
      //   * `publicProperties` An array of property names. This is the list of properties that
      //     are configurable via the JSON configuration structure. Each property listed here
      //     must have a default value.
      //   * `destroy` (optional) A function that frees all resources allocated by the component.
      //   * See plugin documentation at https://github.com/curran/chiasm/wiki
      plugins: {},


      // The JSON configuration object encapsulating application state.
      //
      //   * Keys are component aliases.
      //   * Values are objects with the following properties:
      //     * `plugin` - The name of the plugin module that provides a factory
      //       that instantiates the component (and later tears it down).
      //     * `state` - An object containing the serialized state of the public
      //       properties of the component.
      config: {},

      // Use a default max wait time of 10 seconds.
      // This is for timeout of plugin loading and component fetching.
      timeout: 10000
    });

    // The runtime components created by plugins.
    //
    // * Keys are component aliases.
    // * Values are components constructed by plugins.
    var components = {};

    // This object stores default values for public properties.
    //
    // * Keys are component aliases.
    // * Values are { property -> defaultValue } objects.
    var defaults = {};

    // These methods unpack Action objects and invoke the corresponding functions.
    var methods = {
      create: function (action, callback) {
        return create(action.alias, action.plugin, callback);
      },
      destroy: function (action, callback) {
        return destroy(action.alias, callback);
      },
      set: function (action, callback) {
        return set(action.alias, action.property, action.value, callback);
      },
      unset: function (action, callback) {
        return unset(action.alias, action.property, callback);
      }
    };

    // An asynchronous FIFO queue for applying actions.
    // This is used as essentially a synchronization lock, so multiple synchronous calls 
    // to setConfig() do not cause conflicting overlapping asynchronous action sequences.
    var queue = Queue(processAction);

    // This object contains the callbacks that respond to changes in
    // public properties of components. These must be stored here so they
    // can be removed from components when the components are destroyed.
    var callbacks = {};

    // Gets a component by alias, returns a promise.
    // This is asynchronous because the component may not be instantiated
    // when this is called, but is in the process of loading, in which case this
    // function polls for existence of the component until the timeout time has elapsed.
    function getComponent(alias){
            
      // Race polling with a timeout.
      return Promise.race([

        // This promise polls for existence of the component.
        new Promise(function(resolve, reject){
          (function poll(){
            if(alias in components){
              resolve(components[alias]);
            } else {
              setTimeout(poll, 1);
            }
          }());
        }),

        // This promise rejects when timeout has elapsed.
        new Promise(function(resolve, reject){
          setTimeout(function(){
            reject(new Error([
              "Component with alias '", alias,
              "' does not exist after timeout of ",
              (chiasm.timeout / 1000),
              " seconds exceeded."
            ].join("")));
          }, chiasm.timeout);
        })
      ]);
    }

    // Loads a plugin by name, returns a promise. 
    // First tries to find plugin in chiasm.plugins,
    // then uses RequireJS to load the plugin as an AMD module.
    function loadPlugin(plugin){

      // Race plugin loading with a timeout.
      return Promise.race([

        // This promise loads the plugin.
        new Promise(function(resolve, reject){

          // If the plugin has been set up in `chiasm.plugins`, use it.
          if(plugin in chiasm.plugins){
            resolve(chiasm.plugins[plugin]);
          } else {

            // Otherwise, load the plugin dynamically using RequireJS.
            // This uses the configured plugin name as an AMD module name.
            // This means that paths for plugins may be set up via RequireJS configuration.
            // This way of loading plugins also allows arbitrary AMD module URLs to be used.
            // See also http://requirejs.org/docs/api.html#config-paths
            if(!chiasm.disableRequireJS){
              requirejs([plugin], resolve, reject);
            }
          }
        }),

        // This promise rejects when maxWaitTime has elapsed.
        new Promise(function(resolve, reject){
          setTimeout(function(){
            reject(Error([
              "Plugin '", plugin,
              "' failed to load after timeout of ",
              (chiasm.timeout / 1000),
              " seconds exceeded."
            ].join("")));
          }, chiasm.timeout);
        })
      ]);
    }

    // Computes what the current value is for a given property
    // on the component with the given alias.
    function getConfiguredValue(alias, property){
      var options = chiasm.config[alias];
      if("state" in options && property in options.state){
        return options.state[property];
      } else {
        return defaults[property];
      }
    }

    // Applies a "create" action.
    function create(alias, plugin){
      return new Promise(function(resolve, reject){
        loadPlugin(plugin).then(function (constructor) {

          // Construct the component using the plugin, passing the chiasm instance.
          var component = constructor(chiasm);

          // Store a reference to the component.
          components[alias] = component;

          // Store defaults object reference for later use with "unset".
          defaults[alias] = {};

          // Handle public properties.
          if("publicProperties" in component){
          
            // Validate that all public properties have default values and store them.
            component.publicProperties.forEach(function(property){

              // Require that all declared public properties have a default value.
              if(!(property in component)){

                // Throw an exception in order to break out of the current control flow.
                // Because this is in synchronous code within a promise, throwing this error
                // will have the exact same promise-friendly behavior as calling reject(Error(...)).
                throw Error([
                  "Default value for public property '", property,
                  "' not specified for component with alias '", alias, "'."
                ].join(""));
              }

              // Store default values for public properties.
              defaults[property] = component[property];
            });

            // Propagate changes originating from components into the configuration.
            callbacks[alias] = component.publicProperties.map(function(property){

              // Store the "on" callbacks so they can be removed later, when the component is destroyed.
              return component.on(property, function(newValue){

                // Compute the old configured value so it can be compared to the new value.
                var oldValue = getConfiguredValue(alias, property);

                // If the new value is different from the old value,
                // then this change originated from the component not the configuration,
                // so the configuration must be updated.
                if(JSON.stringify(oldValue) !== JSON.stringify(newValue)){

                  // If no state is tracked, create the state object.
                  if(!("state" in config[alias])){
                    config[alias].state = {};
                  }

                  // Surgically change config so that the diff computation will yield
                  // no actions. Without this, the update would propagate from the 
                  // component to the config and then back again unnecessarily.
                  config[alias].state[property] = newValue;

                  // This assignment will notify any callbacks that the config has changed,
                  // (e.g. the config editor), but the config diff will yield no actions to execute.
                  chiasm.config = config;
                }
              });
            });
          }
          resolve();
        }, reject);
      });
    }

    // Applies a "destroy" action.
    function destroy(alias){
      return new Promise(function(resolve, reject){
        getComponent(alias, function(err, component){

          // Remove public property callbacks.
          if(alias in callbacks){
            callbacks[alias].forEach(component.off);
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
          component[property] = value;
          resolve();
        }, reject);
      });
    }
  // TODO uncomment this and fix all resulting errors.
  //          // Strictly enforce that every property set via the configuration
  //          // is a public property that has a default value.
  //          // Without this, the behavior of Chiasm is unstable in the case that
  //          // a property is set, then the property is removed from the configuration (unset).
  //          // The default values tell Chiasm what value to use after a property is unset.
  //          // Without default values, unsetting a property would have no effect, which would
  //          // make the state of the system out of sync the state specified configuration.
  //          if( alias in publicPropertyDefaults && property in publicPropertyDefaults[alias] ){
  //            component[property] = value;
  //            callback();
  //          } else {
  //            callback(new Error([
  //              "Any property set from a Chiasm configuration must be ",
  //              "declared as a public property by the plugin, and must have ",
  //              "a default value provided."
  //            ].join("")));
  //          }

    // Applies an "unset" action.
    function unset(alias, property, callback) {
      return new Promise(function(resolve, reject){
        getComponent(alias).then(function(err, component){
          component[property] = defaults[alias][property];
          resolve();
        }, reject);
      });
    }

    // Handle setting configuration via `chiasm.config = ...`.
    // This will work, but any errors that occur will be thrown as exceptions.
    chiasm.on("config", function(newConfig){
      setConfig(newConfig);
    });

    // Sets the Chiasm configuration, returns a promise.
    function setConfig(newConfig){

      // Compute the difference between the old and new configurations.
      var actions = configDiff(chiasm.config, newConfig);

      if(actions.length > 0){

        // Store the new config.
        chiasm.config = _.cloneDeep(newConfig);

        // Queue the actions from the diff to be executed in sequence,
        // and return the promise for this batch of actions.
        return queue(actions);

      } else {

        // If there are no actions to execute, return a resolved promise.
        return Promise.resolve(null);
      }
    }

    // Processes a single action by executing it,
    // using the appropriate method depending on the action type.
    // Returns a promise.
    function processAction(action){
      return methods[action.method](action);
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
  return Chiasm;
});
