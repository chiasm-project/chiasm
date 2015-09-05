// All error message strings are kept track of here.
var ErrorMessages = {

  // This error occurs when a property is set via the configuration or is
  // declared as a public property but does not have a default value.  Every
  // property set via the configuration must be declared by the corresponding
  // plugin as a public property, and must have a default value.  Without this
  // strict enforcement , the behavior of Chiasm is unstable in the case that a
  // property is set, then the property is later removed from the configuration
  // (unset).  The default values tell Chiasm what value to use after a
  // property is unset.  Without default values, unsetting a property would
  // have no effect, which would make the state of the components out of sync
  // with the configuration after an unset.
  missingDefault: "Default value for public property '${ property }' " +
                  "not specified for component with alias '${ alias }'.",

  // This error occurs when a component is requested via `chiasm.getComponent()`,
  // but it fails to appear after a timeout elapses (`chiasm.timeout`).
  componentTimeout: "Component with alias '${ alias }' does not exist " +
                    "after timeout of ${ seconds } seconds exceeded."
};
module.exports = ErrorMessages;
