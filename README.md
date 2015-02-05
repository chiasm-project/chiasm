# visEditor

A pluggable interactive visualization runtime environment and configuration editor.

The core concept of this project is that visualizations can be instantiated, configured with data, arranged on the screen, and coupled together to produce linked views. A JSON configuration structure defines the entire state of an application. The configuration refers to plugins by name, which are loaded at runtime and called upon to instantiate instances of visualizations and other components. Configuration changes can be made at runtime using an interactive JSON editor.

## Configuration Structure

 * A configuration is a JSON object encapsulating an application state.
 * Keys are component aliases.
 * Values are objects with properties
   * `module` - The name of the plugin module that provides a factory
     that instantiates the component (and later tears it down).
   * `model` - An object containing the serialized state of the component,
     which is a ModelJS model created by the plugin.

## Runtime Environment

The runtime environment is responsible for synchronizing the JSON configuration with the running application. The runtime environment loads plugins referred to in the configuration using [RequireJS](http://requirejs.org/). Each plugin is an [AMD module](http://requirejs.org/docs/whyamd.html) that provides functionality to

 * create a runtime component,
 * manipulate the state of the component, 
 * listen for changes that occur within the component, and
 * destroy the component.

This organization allows a dynamic configuration structure to drive the state of the application, and also allows changes resulting from user interactions with runtime components to be propagated to the configuration.

![Runtime Diagram](images/Plugins.png)

This diagram illustrates that

 * Plugins create runtime components.
 * Changes in configuration propagate to runtime components.
 * Changes in runtime components propagate back to the configuration.

## Foundational Plugins

Since the architecture for this visualization editor is based on plugins, several foundational pieces are implemented as plugins.

### Layout

The `layout` module provides tiled visualization containers using a nested box layout, computed by the [computeLayout module](http://curran.github.io/visEditor/docs/computeLayout.html).

### JSON Editor

The JSON Editor is an enhanced text editor for editing the configuration at runtime. Changes are propagated through the runtime environment to the instantiated plugins. When changes are made, only the differences are propagated through the system. This lays the foundation for undo/redo and real-time synchronization between many clients.

### DummyVis

The DummyVis plugin is a simple example that demonstrates basic plugin structure and functionality. This plugin serves as a placeholder for real visualizations. Features include:

 * A colored background
   * Clicking on the background changes the color.
 * A colored X that resizes to the plugin container
   * Clicking and dragging the X changes its size.
   * Clicking and dragging also sets the `loading` property for one second, to 
   simulate asynchronous operations that may fetch data from a server.
 * Text in front of the X.
 * A progress indicator when a special property `pending` is set.
