# visEditor

A pluggable interactive visualization runtime environment.

The core concept of this editor is that visualizations can be instantiated,
configured with data, arranged on the screen, and linked together through
interactions. A JSON configuration structure defines the entire state of an
application. The configuration refers to plugins by name, which are loaded
at runtime and instantiate instances of visualizations.

Configuration changes can be made at runtime, at which time the change is
detected and only the change (not the entire configuration) is propagated
through the system. This lays the foundation for undo/redo and real-time
synchronization between many clients.

## Configuration Structure

 * A configuration is a JSON structure containing an array of
   component configuration objects.
 * Each component configuration object has the following properties:
   * `id` A unique string identifier for the component.
   * `module` the name of the AMD module that provides the plugin
     that sets up (and later tears down) the component at runtime.
   * Additional properties are used to populate property values of 
     the runtime component model (a ModelJS model returned by the factory).

## Syntactic Sugar

The following rules when loading a configuration allow for cleaner
configurations that are easier to read and do not have any unnecessary
repetition.

 * If `id` is unspecified, the value for `module` is used as the value for `id`.
 * If `module` and `id` are both unspecified and there is only one property,
   that property name is used for the value of both `id` and `module`.

## Foundational Plugins

Since the architecture for this visualization editor is based on plugins,
several foundational pieces are implemented as plugins.

### Layout

The `layout` module provides visualization containers using a nested box layout.

### JSON Editor

The JSON Editor is an enhanced text editor for editing the configuration at runtime.

TODO

 * Get basic version working with CodeMirror and Inlet
 * Investigate ShareJS

### DummyVis

The DummyVis plugin is a simple example that demonstrates basic plugin structure
and functionality. This plugin serves as a placeholder for real visualizations.
Features include:

 * A colored background
   * Clicking on the background changes the color.
 * A colored X that resizes to the plugin container
   * Clicking and dragging the X changes its size.
   * Clicking and dragging also sets the `loading` property for one second, to 
   simulate asynchronous operations that may fetch data from a server.
 * Text in front of the X.
 * A progress indicator when a special property `pending` is set.
