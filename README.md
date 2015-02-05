# visEditor

A pluggable interactive visualization runtime environment and configuration editor.

The core concept of this project is that visualizations can be instantiated, configured with data, arranged on the screen, and coupled together to produce linked views. A JSON configuration structure defines the entire state of an application. The configuration refers to plugins by name, which are loaded at runtime and called upon to instantiate instances of visualizations and other components. Configuration changes can be made at runtime using an interactive JSON editor.

## Configuration Structure and Runtime Environment

A configuration is a JSON object encapsulating an application state. This configuration contains specifications for a set of runtime components, each of which has:

 * a unique name (called the "alias" of the component),
 * an associated plugin that creates the runtime component, and
 * a key-value dictionary specifying the state of the runtime component.

The configuration structure can be summarized as follows.

```
{ 
  alias -> {
    plugin: string,
    state: { property -> value }
  }
}
```

The runtime environment is responsible for synchronizing the JSON configuration with the running application. The runtime environment loads plugins referred to in the configuration using [RequireJS](http://requirejs.org/). Each plugin is an [AMD module](http://requirejs.org/docs/whyamd.html) that provides functionality to

 * create a runtime component,
 * manipulate the state of the component, 
 * listen for changes that occur within the component, and
 * destroy the component.

This organization allows a dynamic configuration structure to drive the state of the application, and also allows changes resulting from user interactions with runtime components to be propagated to the configuration.

![Runtime Diagram](images/Runtime.png)

This diagram illustrates that

 * Plugins create runtime components.
 * Changes in configuration propagate to runtime components.
 * Changes in runtime components propagate back to the configuration.
 
See also

 * [runtime module](http://curran.github.io/visEditor/docs/runtime.html)
 * [runtime module unit tests](https://github.com/curran/visEditor/blob/gh-pages/tests/runtimeTest.js)

## Foundational Plugins

Since the architecture for this visualization editor is based on plugins, several foundational pieces are implemented as plugins.

### Layout

The `layout` module provides tiled visualization containers using a nested box layout, computed by the [computeLayout module](http://curran.github.io/visEditor/docs/computeLayout.html).

![Boxes](images/boxes.png)
The above image is a simple example of a nested box layout, which can be configured by the following JSON structure.

```
{
  "orientation": "vertical",
  "children": [
    "A",
    "B",
    {
      "orientation": "horizontal",
      "children": [
        "C",
        "D"
      ]
    }
  ]
}
```

The following features are also present:

 * Specifying relative (proportions to siblings) or absolute (fixed number of pixels) size of any node in the layout tree. Relative size makes sense for resizable visualizations, while absolute size makes sense for conventional UI widgets that only look good at a specific size in terms of pixels.
 * Toggling visibility of components. When a component is marked as "hidden", it is excluded from the layout algorithm. This could be used to, for example, hide and show the JSON configuration editor when the user clicks on a "settings" button.

See also

 * [computeLayout module](http://curran.github.io/visEditor/docs/computeLayout.html) This implements the nested box layout algorithm.
 * [computeLayout module unit tests](https://github.com/curran/visEditor/blob/gh-pages/tests/computeLayoutTest.js)

### JSON Editor

The JSON Editor is an enhanced text editor for editing the configuration at runtime. Changes are propagated through the runtime environment to the instantiated plugins. When changes are made, only the differences are propagated through the system. This lays the foundation for undo/redo and real-time synchronization between many clients.

### DummyVis

The DummyVis plugin is a simple example that demonstrates basic plugin structure and functionality. This plugin serves as a placeholder for real visualizations.

![DummyVis](images/dummyVis.png)

Features include:

 * A colored background
   * Clicking on the background changes the color.
 * A colored X that resizes to the plugin container
   * Clicking and dragging the X changes its size.
   * Clicking and dragging also sets the `loading` property for one second, to 
   simulate asynchronous operations that may fetch data from a server.
 * Text in front of the X.
 * A progress indicator when a special property `pending` is set.
