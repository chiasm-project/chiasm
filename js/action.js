// This module provides methods for creating and serializing
// Action objects, which are used to express differences between 
// configurations.
//
// The primary purpose of Action objects is to support editing the
// JSON application configuration at runtime. To avoid reloading the
// entire configuration on each change, the difference is computed
// and expressed in terms of Action objects, then the Action objects
// are applied to the runtime.
//
// Based on previous work found at:
// https://github.com/curran/overseer/blob/master/src/action.js
//
// This lays the foundation for undo/redo and real-time synchronization.
//
// For synchronization, these Action objects should be directly translatable
// into ShareJS operations for JSON transformation, documented at
// https://github.com/ottypes/json0
//
// Created by Curran Kelleher Feb 2015
define([], function () {
  return {
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
      return action.method + "(" + [
        action.alias,
        action.property !== undefined ? ", " + action.property : "",
        action.value !== undefined ? ", " + action.value : "",
        action.plugin !== undefined ? ", " + action.plugin : ""
      ].join("") + ")";
    }
  };
});
