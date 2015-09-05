// This function computes the difference ("diff") between two configurations.
// The diff is returned as an array of Action objects.

var _ = require("lodash");
var Action = require("./action");

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
module.exports = configDiff;
