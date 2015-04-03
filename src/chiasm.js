
//
// Draws from previous work found at
//
//  * https://github.com/curran/model-contrib/blob/gh-pages/modules/overseer.js
//  * https://github.com/curran/overseer/blob/master/src/overseer.js
//
// Created by Curran Kelleher Feb 2015
define(["model", "async", "lodash"], function (Model, async, _) {

  // Methods for creating and serializing Action objects, which are used to express 
  // differences between configurations.
  //
  // The primary purpose of Action objects is to support editing the
  // JSON application configuration at runtime. To avoid reloading the
  // entire configuration in response to each change, the difference is computed
  // and expressed as an array of Action objects, then the Action objects
  // are applied to the runtime environment.
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

  // Define the Chiasm constructor function exposed by this AMD module.
  function Chiasm(div){
    var chiasm = Model({

      // * `plugins` An object for setting up plugins before loading a configuration.
      //   The chiasm first looks here for plugins, then if a plugin is not found here
      //   it is dynamically loaded at runtime using RequireJS where the plugin name 
      //   corresponds to a configured AMD module, or artibrary URL.
      //   * Keys are plugin names.
      //   * Values are plugin implementations, which are constructor functions for
      //     runtime components. A plugin constructor function takes as input a reference
      //     to the chiasm instance, and yield as output a ModelJS model with the following properties:
      //     * `publicProperties` An array of property names whose updates will be propagated
      //       to the configuration as part of the component's serialized state.
      //     * `destroy` (optional) A function that frees all resources allocated by the component.
      //     * See plugin documentation at https://github.com/curran/chiasm/wiki
      plugins: {},

      // * `config` The configuration object encapsulating application state.
      //   * Keys are component aliases.
      //   * Values are objects with the following properties:
      //     * `plugin` - The name of the plugin module that provides a factory
      //       that instantiates the component (and later tears it down).
      //     * `state` - An object containing the serialized state of the public
      //       properties of the component.
      config: {},

      // * `div` The DOM container passed into the chiasm constructor.
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

    // This object stores original values for public properties.
    //
    // * Keys are component aliases.
    // * Values are { property -> defaultValue } objects.
    var publicPropertyDefaults = {};

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

    // An asynchronous FIFO queue for applying actions.
    // This is used as essentially a synchronization lock, so multiple synchronous calls 
    // to setConfig() do not cause conflicting overlapping asynchronous action sequences.
    var actionQueue = async.queue(function(actionBatch, queueCallback){

      // Each queued task is an async function that executes a batch of actions,
      // so here it is simply invoked, passing the queue callback.
      actionBatch(queueCallback);
    }, 1);

    // This object contains the listeners that respond to changes in
    // public properties of components. These must be stored here so they
    // can be removed from components when the components are destroyed.
    var listeners = {};

    // Gets a component by alias, passes it to the callback(err, component).
    // This is asynchronous because the component may not be instantiated yet,
    // in which case this function polls for existence of the component until
    // maxWaitTime has elapsed.
    function getComponent (alias, callback, maxWaitTime) {
      var startTime = Date.now();

      // Use a default max wait time of 10 seconds.
      maxWaitTime = maxWaitTime || 10000;

      // Poll for the component until max wait time has elapsed.
      async.until(
        function(){ return alias in components; },
        function(cb){
          if( (Date.now() - startTime) > maxWaitTime ){
            cb(new Error("Component with alias '" + alias +
              "' does not exist after timeout of " + 
              (maxWaitTime / 1000) + " seconds exceeded."));
          } else {
            setTimeout(cb, 1);
          }
        },
        function(err){ callback(err, components[alias]); }
      );
    }

    // Loads a plugin by name. 
    // First tries to find plugin in chiasm.plugins,
    // then uses RequireJS to load the plugin as an AMD module.
    function loadPlugin(plugin, callback){

      // If the plugin has been set up in `chiasm.plugins`, use it.
      if(plugin in chiasm.plugins){
        callback(chiasm.plugins[plugin]);
      } else {

        // Otherwise, load the plugin dynamically using RequireJS.
        // This uses the configured plugin name as an AMD module name.
        // This means that paths for plugins must be set up via RequireJS configuration.
        // This way of loading plugins also allows arbitrary AMD module URLs to be used.
        // See also http://requirejs.org/docs/api.html#config-paths
        requirejs([plugin], callback);
      }
    }

    // Applies a "create" action.
    function create(alias, plugin, callback){
      loadPlugin(plugin, function (constructor) {

        // Construct the component using the plugin.
        var component = constructor(chiasm);
        components[alias] = component;

        // Default values for public properties.
        var defaults = {};

        // Store defaults object reference for later use with "unset".
        publicPropertyDefaults[alias] = defaults;

        // Exceptions are used for control flow in the case of an error.
        try {

          // Propagate changes from components to configuration.
          if("publicProperties" in component){
          
            listeners[alias] = [];
            component.publicProperties.forEach(function(property){

              // Require that all declared public properties have a default value.
              if(!(property in component)){

                // Use an exception to break the forEach loop.
                throw new Error("Default value for public property '" +
                  property + "' not specified for component with alias '" + alias + "'.");
              }

              // Store default values for public properties.
              defaults[property] = component[property];

              // Store the listener so it can be removed later,
              // when the component is destroyed.
              listeners[alias].push(component.when(property, function(newValue){

                // Handle the case that the property is changed after the component has
                // been removed from the configuration but before the component's
                // listeners have been removed.
                if(alias in oldConfig){

                  var oldValue;

                  if("state" in oldConfig[alias] && property in oldConfig[alias].state){
                    oldValue = oldConfig[alias].state[property];
                  } else {
                    oldValue = defaults[property];
                  }

                  // Ignore changes that originated from the config.
                  // Use oldConfig rather than chiasm.config to handle the case that
                  // chiasm.config has been changed and its listener that computes
                  // the diff and dispatches actions has not yet run.
                  // Use JSON.stringify so deep JSON structures are compared correctly.
                  // TODO refactor this part

                  if(JSON.stringify(oldValue) !== JSON.stringify(newValue)){

                    // Surgically change oldConfig so that the diff computation will yield
                    // no actions. Without this, the update would propagate from the 
                    // component to the config and then back again unnecessarily.

                    // If no state is tracked, create the state object.
                    if(!("state" in oldConfig[alias])){
                      oldConfig[alias].state = {};
                    }

                    oldConfig[alias].state[property] = newValue;

                    // This assignment will notify any listeners that the config has changed,
                    // (e.g. the config editor), but the config diff will yield no actions to execute.
                    chiasm.config = oldConfig;
                  }
                }

              }));
            });
          }
          callback();
        } catch (err) {
          callback(err);
        }
      });
    }

    // Applies a "destroy" action.
    function destroy(alias, callback){
      getComponent(alias, function(err, component){

        // Remove public property listeners.
        if(alias in listeners){
          listeners[alias].forEach(component.cancel);
          delete listeners[alias];
        }

        // Invoke component.destroy(), which is part of the plugin API.
        if("destroy" in component){
          component.destroy();
        }

        // Remove the internal reference to the component.
        delete components[alias];

        // Remove stored default values that were stored.
        delete publicPropertyDefaults[alias];

        callback();
      });
    }
    
    // Applies a "set" action.
    function set(alias, property, value, callback) {
      getComponent(alias, function(err, component){
        if(err) { callback(err); }
        else{

          // TODO strictly enforce that every property set via the configuration
          // is a public property that has a default value.

          component[property] = value;
          callback();
        }
      });
    }

    // Applies an "unset".
    function unset(alias, property, callback) {
      getComponent(alias, function(err, component){
        var defaultValue = publicPropertyDefaults[alias][property];
        component[property] = defaultValue;
        callback();
      });
    }

    // If the configuration is set via `chiasm.config = ...`,
    // this will work but any errors that occur will be thrown as exceptions.
    chiasm.on("config", function(newConfig){
      setConfig(newConfig);
    });

    // If the configuration is set via `chiasm.setConfig(...)`,
    // errors will passed to the async callback.
    function setConfig(newConfig, callback){

      // Compute the difference between the old and new configurations.
      var actions = configDiff(oldConfig, newConfig);

      // If there is any difference between the two configurations, 
      if(actions.length > 0){

        // Store the new config as the old config.
        oldConfig = _.cloneDeep(newConfig);

        // Push a new job onto the async action queue.
        actionQueue.push(function actionBatch(queueCallback){

          // The job will apply each action resulting from the configuration difference.
          async.eachSeries(actions, processAction, function(err){

            // pass any errors that resulted from this batch of actions
            // to the caller of setConfig.
            if(callback){
              callback(err);
            } else if(err) {
              throw err;
            }

            // Notify the async queue that this batch of actions has completed processing,
            // so it can move on to the next batch.
            queueCallback();
          });
        });
      }
    }

    // Processes a single action by executing it,
    // using the appropriate method depending on the action type.
    function processAction(action, callback){
      methods[action.method](action, callback);
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
