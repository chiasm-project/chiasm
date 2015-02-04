# visEditor

A pluggable interactive visualization runtime environment and configuration editor.

The core concept of this project is that visualizations can be instantiated,
configured with data, arranged on the screen, and coupled together to produce
linked views. A JSON configuration structure defines the entire state of an
application. The configuration refers to plugins by name, which are loaded
at runtime and called upon to instantiate instances of visualizations and other
components.

Configuration changes can be made at runtime using an interactive JSON editor
based on CodeMirror and Inlet. When changes are made, the difference in configuration
is computed and only the difference (not the entire configuration) is propagated
through the system. This lays the foundation for undo/redo and real-time
synchronization between many clients.

## Configuration Structure

 * A configuration is a JSON object encapsulating an application state.
 * Keys are component aliases.
 * Values are objects with properties
   * `module` - The name of the plugin module that provides a factory
     that instantiates the component (and later tears it down).
   * `model` - An object containing the serialized state of the component,
     which is a ModelJS model created by the plugin.

## Foundational Plugins

Since the architecture for this visualization editor is based on plugins,
several foundational pieces are implemented as plugins.

### Layout

The `layout` module provides visualization containers using a nested box layout.

### JSON Editor

The JSON Editor is an enhanced text editor for editing the configuration at runtime.

TODO

 * Get basic version working with CodeMirror and Inlet

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
