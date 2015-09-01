![Chiasm](http://curran.github.io/images/chiasm/chiasm_logo.png)

[![Build Status](https://travis-ci.org/curran/chiasm.svg)](https://travis-ci.org/curran/chiasm)

Chiasm is a browser based runtime environment and plugin architecture for interactive visualizations. It allows plugins for data access, data transformation, and interactive visualization to be loaded and configured dynamically.

Presentations on Chiasm:

 * [Lightning Demo (2 min) at San Francisco D3 Meetup](https://youtu.be/OJBwvSUgqQQ?t=5m58s) - July 2015
 * [Chiasm presentation at Alpine Data Labs](https://www.youtube.com/watch?v=9jh4E3-jxcQ&feature=youtu.be&a) ([slides](http://www.slideshare.net/currankelleher/chiasm)) - May 2015
 * [Constructing Interactive Data Visualizations - Plans for Chiasm](https://www.youtube.com/watch?v=GxGkHam33Cw) - February 2015

See also

 * [Model.js](https://github.com/curran/model)
 * [dsv-dataset](https://github.com/curran/dsv-dataset)
 * [data-reduction](https://github.com/curran/data-reduction)

## Examples

| thumbnail | description  |
|---|---|
| [![](http://bl.ocks.org/curran/raw/3f0b1128d74308fc8fe1/thumbnail.png)](http://bl.ocks.org/curran/3f0b1128d74308fc8fe1) | A demo of the Chiasm configuration editor and nested box layout. |
| [![](http://bl.ocks.org/curran/raw/4ce2ee825811f1c32125/thumbnail.png)](http://bl.ocks.org/curran/4ce2ee825811f1c32125) | An example Chiasm configuration with a bar chart and line chart. |
| [![](http://curran.github.io/images/chiasm/kitchenSink.png)](http://bl.ocks.org/curran/70ae30ab3b3eea62f84e) | The Chiasm kitchen sink (<a href="https://github.com/curran/chiasm/tree/gh-pages/kitchenSink">code</a>), showing various configurations including scatter plot, line chart, and bar chart. |
| [![](http://bl.ocks.org/curran/raw/5a9767b5c23982c89632/thumbnail.png)](http://bl.ocks.org/curran/5a9767b5c23982c89632) | An example demonstrating linked views and having a common color scale. |
| [![](http://bl.ocks.org/curran/raw/19d42e98ce25291eb45d/thumbnail.png)](http://bl.ocks.org/curran/19d42e98ce25291eb45d) | A more complex example with linked views using Crossfilter and loading data from an API. |

## Overview

The core concept is that visualizations can be instantiated, configured with data, arranged on the screen, and coupled together to produce interactive linked views. A JSON configuration structure defines the entire state of an application. The configuration refers to plugins by name, which are loaded at runtime and called upon to instantiate instances of visualizations and other components. Configuration changes can be made at runtime, and Chiasm will propagate the changes through the system. The JSON configuration also updates in response to user interactions with visualizations, so can be used to serialize visualization state resulting from user interactions.

Please give this repo a star if you think it is cool. Also feel free to submit issues for feature requests, or reach out to me if you're at all interested in collaborating on this curran.kelleher@gmail.com

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

The runtime environment is responsible for synchronizing the JSON configuration with the running application. The runtime environment loads plugins referred to in the configuration using the contents of a special property on the Chiasm instance, `chiasm.plugins`. Plugins are aggregated into a single JavaScript file, `chiasm-bundle.js`, using [Browserify](http://browserify.org/). Each plugin is a CommonJS module that provides functionality to

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

 * [runtime module (chiasm.js)](https://github.com/curran/chiasm/blob/gh-pages/src/chiasm.js) Documents exact configuration structure.
 * [runtime module unit tests](https://github.com/curran/chiasm/blob/gh-pages/test/runtimeTest.js) Contains simple example plugins.

## Plugins

Here's [documentation on how to create a Chiasm plugin](https://github.com/curran/chiasm/wiki).

The following sections describe foundational plugins that are included in the Chiasm project under `src/plugins`.

### Visualization Plugins

 * [bar chart](https://github.com/curran/chiasm/blob/gh-pages/src/plugins/barChart/barChart.js)
 * [line chart](https://github.com/curran/chiasm/blob/gh-pages/src/plugins/lineChart/lineChart.js)
 * [Scatter Plot](https://github.com/curran/chiasm/blob/gh-pages/src/plugins/scatterPlot/scatterPlot.js)
 * [Crossfilter](https://github.com/curran/chiasm/blob/gh-pages/src/plugins/crossfilter.js)

Targets for implementation as plugins include the following visualizations:

 * [Table](http://curran.github.io/model-contrib/#/examples/table)
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

If you're interested in contributing plugins, please experiment and get in touch! Feel free to email me at curran.kelleher@gmail.com or send a pull request with your work. I am looking for collaborators on this project.

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

See also:

 * [computeLayout module unit tests](https://github.com/curran/chiasm/blob/gh-pages/test/computeLayoutTest.js)
 * [layout plugin unit tests](https://github.com/curran/chiasm/blob/gh-pages/test/plugins/layout.js)

### JSON Editor

The JSON Editor is an enhanced text editor for editing the configuration at runtime. Changes are propagated through the runtime environment to the instantiated plugins. When changes are made, only the differences are propagated through the system. This lays the foundation for undo/redo and real-time synchronization between many clients.

See also:

 * [CodeMirror](http://codemirror.net/) - This provides the syntax highlighted code editor.
 * [Inlet](http://enjalot.github.io/Inlet/) - This provides interactive sliders and color pickers.

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

### Links

The Links plugin is for establishing bindings between runtime components. By specifying a link using the Links plugin in a configuration, the output resulting from a user interaction in one view can be used as input to another view. This is the foundation for linked views.

Plugins may be created for components that make requests to a server. The inputs and outputs of such components may also be bound to visualizations in order to establish linked views with an asynchronous step that leverages server-side capabilities.

# The word "[Chiasm](http://www.merriam-webster.com/audio.php?file=chiasm02&word=chiasm&text=)"

> The optic nerve fibres on the nasal sides of each retina cross over to the opposite side of the brain via the optic nerve at the optic **chiasm**. -- [Wikipedia](http://en.wikipedia.org/wiki/Optic_chiasm)

> The **Chiasm** was a junction of interdimensional networks and corridors that allowed for instantaneous travel over long distances of space. - [Dr. Who](http://tardis.wikia.com/wiki/Chiasm)

**Chiasm**, this project, relates to the above meanings of the word "Chiasm" in that it connects the "brain" of data to the "eyes" of users through interactive visualization. When Chiasm is set up to use an interactive data transformation like [Crossfilter](http://square.github.io/crossfilter/), the visualization system is an intersection of multidimensional "corridors" in data space, and interacting with it allows users to rapidly pivot and navigate through the data.
