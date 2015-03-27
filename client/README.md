## Client

The Chiasm client side is a runtime environment and plugin architecture for interactive visualizations. It can be used independently of the Chiasm server, and allows visualization plugins to be loaded and configured dynamically.

[Try it out!](http://bl.ocks.org/curran/raw/3f0b1128d74308fc8fe1/) Edit the configuration by clicking on numbers and colors in the text on the left, or try clicking and dragging the diagonal lines in the boxes.

[![Config Editor Demo](http://curran.github.io/images/visEditor/configEditorDemo.png)](http://bl.ocks.org/curran/raw/3f0b1128d74308fc8fe1/)

The core concept is that visualizations can be instantiated, configured with data, arranged on the screen, and coupled together to produce linked views. A JSON configuration structure defines the entire state of an application. The configuration refers to plugins by name, which are loaded at runtime and called upon to instantiate instances of visualizations and other components. Configuration changes can be made at runtime using an interactive JSON editor. The JSON configuration also updates in response to user interactions with visualizations.

This system is intented to be embedded within larger Web applications to address interactive visualization needs. The JSON configuration can serve as the primary integration point. For example, the configuration could be automatically generated based on available data or user configurations. The configuration can also support collaboration, in that it can be stored to disk and restored at a later date (potentially by a user other than the original author).

Long term goals also include undo/redo support and real-time collaboration between many users.

### Configuration Structure and Runtime Environment

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

![Runtime Diagram](http://curran.github.io/images/visEditor/Runtime.png)

This diagram illustrates that

 * Plugins create runtime components.
 * Changes in configuration propagate to runtime components.
 * Changes in runtime components propagate back to the configuration.
 
See also

 * [runtime module](http://curran.github.io/chiasm/client/docs/core/runtime.html) Documents exact configuration structure.
 * [runtime module unit tests](https://github.com/curran/chiasm/blob/gh-pages/client/tests/runtimeTest.js) Contains simple example plugins.

Status: partially implemented.

## Foundational Plugins

Since the architecture for this visualization editor is based on plugins, several foundational pieces are implemented as plugins.

### Layout

The `layout` module provides tiled visualization containers using a nested box layout.

![Boxes](http://curran.github.io/images/visEditor/boxes.png)

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

Status: implemented.

 * [computeLayout module](http://curran.github.io/chiasm/client/docs/plugins/computeLayout.html) This implements the nested box layout algorithm.
 * [computeLayout module unit tests](https://github.com/curran/chiasm/blob/gh-pages/client/tests/computeLayoutTest.js)
 * [layout plugin](http://curran.github.io/chiasm/client/docs/plugins/layout.html) This provides the interface between the runtime and nested box layout algorithm.
 * [layout plugin unit tests](https://github.com/curran/chiasm/blob/gh-pages/client/tests/plugins/layout.js)


### JSON Editor

The JSON Editor is an enhanced text editor for editing the configuration at runtime. Changes are propagated through the runtime environment to the instantiated plugins. When changes are made, only the differences are propagated through the system. This lays the foundation for undo/redo and real-time synchronization between many clients.

Status: implemented, leveraging [CodeMirror](http://codemirror.net/) and [Inlet](http://enjalot.github.io/Inlet/).

 * [configEditor plugin](http://curran.github.io/chiasm/client/docs/plugins/configEditor.html)

### DummyVis

The DummyVis plugin is a simple example that demonstrates basic plugin structure and functionality. This plugin serves as a placeholder for real visualizations.

![DummyVis](http://curran.github.io/images/visEditor/dummyVis.png)

Features include:

 * A colored background
   * Clicking on the background changes the color.
 * A colored X that resizes to the plugin container
   * Clicking and dragging the X changes its size.
   * Clicking and dragging also sets the `loading` property for one second, to 
   simulate asynchronous operations that may fetch data from a server.
 * Text in front of the X.
 * A progress indicator when a special property `pending` is set.

Status: implemented.

 * [dummyVis plugin](http://curran.github.io/chiasm/client/docs/plugins/dummyVis.html)

### Links

The Links plugin is for establishing bindings between runtime components. By specifying a link using the Links plugin in a configuration, the output resulting from a user interaction in one view can be used as input to another view. This is the foundation for linked views.

Plugins may be created for components that make requests to a server. The inputs and outputs of such components may also be bound to visualizations in order to establish linked views with an asynchronous step that leverages server-side capabilities.

Status: implemented.

 * [links plugin](http://curran.github.io/chiasm/client/docs/plugins/links.html)

## Visualization Plugins

Implemented visualization plugins:

 * [bar chart](http://curran.github.io/chiasm/client/docs/plugins/barChart.html)
 * [line chart](http://curran.github.io/chiasm/client/docs/plugins/lineChart.html)

Targets for implementation as plugins include the following visualizations:

 * [Scatter Plot](http://bl.ocks.org/curran/9e04ccfebeb84bcdc76c)
 * [Table](http://curran.github.io/model-contrib/#/examples/table)
 * [Crossfilter](http://curran.github.io/model-contrib/#/examples/linkedViews)
 * [Parallel Coordinates](https://github.com/curran/model/tree/gh-pages/examples/d3ParallelCoordinates)
 * [Stacked Area Chart](https://github.com/curran/model/tree/gh-pages/examples/d3StackedArea)
 * [Choropleth Map (using Leaflet)](http://leafletjs.com/examples/choropleth.html)
 * [Calendar View](http://bl.ocks.org/mbostock/4063318)

The following features common to many D3-based visualizations can reside in a separate module (prototyped in the [Reactivis project](https://github.com/curran/reactivis)):

 * Margins
 * Scales (X, Y, color)
 * Axes
 * Color Legend
 * [Brushing (draw a rectangle to select many records)](http://curran.github.io/model-contrib/#/examples/linkedViews)
 * [Selecting (click/tap to select a single value)](http://curran.github.io/model/examples/d3LinkedChoropleth/)
 * [Hovering](http://curran.github.io/model/examples/d3LinkedChoropleth/)

If you're interested in contributing plugins, please get in touch! Feel free to email me at curran.kelleher@gmail.com or send a pull request with your work.
