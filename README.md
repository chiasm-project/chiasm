![Chiasm](http://curran.github.io/images/chiasm/chiasm_logo.png)

[![Build
Status](https://travis-ci.org/chiasm-project/chiasm.svg?branch=master)](https://travis-ci.org/chiasm-project/chiasm) Latest version: [chiasm-v0.2.0.js](http://chiasm-project.github.io/chiasm/chiasm-v0.2.0.js)

Chiasm is a browser based runtime environment and component architecture for
interactive data visualizations. It allows plugins for data access, data
transformation, and interactive visualization to be loaded and configured
dynamically.

## Examples

| thumbnail | description  |
|---|---|
| [![](http://bl.ocks.org/curran/raw/1af08ad6cdb01707c33f/thumbnail.png)](http://bl.ocks.org/curran/1af08ad6cdb01707c33f) | Chiasm Boilerplate. |
| [![](http://bl.ocks.org/curran/raw/f01e2a07ece4a9ad62cb/thumbnail.png)](http://bl.ocks.org/curran/f01e2a07ece4a9ad62cb) | Thumbnails of visualization techniques from a 1984 paper. |
| [![](https://gist.githubusercontent.com/curran/3cc1a2a289dddbd64688/raw/5a938f66c0cb728da8eaa28e15816fea74e57ae8/thumbnail.png)](http://bl.ocks.org/curran/3cc1a2a289dddbd64688) | Fundamental visualization techniques in Chiasm.  |
| [![](http://bl.ocks.org/curran/raw/d5252d37917ab6eab032/thumbnail.png)](http://bl.ocks.org/curran/d5252d37917ab6eab032) | Focus + Context Area Charts.|
| [![](http://bl.ocks.org/curran/raw/87d038562333a7ad4a64/thumbnail.png)](http://bl.ocks.org/curran/87d038562333a7ad4a64) | Crossfilter & Chiasm.|
| [![](http://bl.ocks.org/curran/raw/d1e9ea2850047562be09/thumbnail.png)](http://bl.ocks.org/curran/d1e9ea2850047562be09) | Focus + Context Scatter Plots.|
| [![](https://gist.githubusercontent.com/curran/01aa2685f083b6c1b9fb/raw/d20ddb8e5b42360234654d1a0d9344e8e15ae716/thumbnail.png)](http://bl.ocks.org/curran/01aa2685f083b6c1b9fb) | Map & Globe based on [Leaflet.js](leafletjs.com) and [This is a Globe](http://bl.ocks.org/mbostock/ba63c55dd2dbc3ab0127). |
| [![](http://bl.ocks.org/curran/raw/81271937fa94fdbdd854/thumbnail.png)](http://bl.ocks.org/curran/81271937fa94fdbdd854) | Migrant Deaths Map with Leaflet. |
| [![](http://bl.ocks.org/curran/raw/b4aa88691528c0f0b1fa/thumbnail.png)](http://bl.ocks.org/curran/b4aa88691528c0f0b1fa) | A self-contained example showing the new v0.2.0 plugin API. |
| [![](http://bl.ocks.org/curran/raw/3f0b1128d74308fc8fe1/thumbnail.png)](http://bl.ocks.org/curran/3f0b1128d74308fc8fe1) | A demo of the Chiasm configuration editor and nested box layout. |
| [![](http://bl.ocks.org/curran/raw/4ce2ee825811f1c32125/thumbnail.png)](http://bl.ocks.org/curran/4ce2ee825811f1c32125) | An example Chiasm configuration with a bar chart and line chart. |
| [![](http://curran.github.io/images/chiasm/kitchenSink.png)](http://bl.ocks.org/curran/70ae30ab3b3eea62f84e) | The Chiasm kitchen sink (<a href="https://github.com/curran/chiasm/tree/gh-pages/kitchenSink">code</a>), showing various configurations including scatter plot, line chart, and bar chart. |
| [![](http://bl.ocks.org/curran/raw/5a9767b5c23982c89632/thumbnail.png)](http://bl.ocks.org/curran/5a9767b5c23982c89632) | An example demonstrating linked views and having a common color scale. |
| [![](http://bl.ocks.org/curran/raw/19d42e98ce25291eb45d/thumbnail.png)](http://bl.ocks.org/curran/19d42e98ce25291eb45d) | A more complex example with linked views using Crossfilter and loading data from an API. |

## Usage

You can include Chiasm in your page like this:

```html
<script src="http://chiasm-project.github.io/chiasm/chiasm-v0.2.0.js"></script>
```

This will introduce a global variable `Chiasm`, which is a constructor function for instances of the Chiasm runtime environment.

Chiasm can also be used as an [NPM module](https://www.npmjs.com/package/chiasm). To install, run

```
npm install -S chiasm
```

To use in your CommonJS JavaScript, you can require it like this:

```
var Chiasm = require("chiasm");
```

## Components

The subproject [chiasm-component](https://github.com/chiasm-project/chiasm-component) defines a common base for Chiasm components.

Several components are also subprojects under [github.com/chiasm-project](https://github.com/chiasm-project/):

 * [chiasm-layout](https://github.com/chiasm-project/chiasm-layout) Nested box layout for Chiasm components.
 * [chiasm-links](https://github.com/chiasm-project/chiasm-links) Data binding for Chiasm components.

There are also the following other components that exist in various examples:

 * [dataLoader.js](https://gist.github.com/curran/d1e9ea2850047562be09#file-dataloader-js) in [Focus + Context Scatter Plots](http://bl.ocks.org/curran/d1e9ea2850047562be09) A component that loads and parses CSV files.
 * [chiasm-crossfilter.js](https://gist.github.com/curran/87d038562333a7ad4a64#file-chiasm-crossfilter-js) An integration with [Crossfilter.js](https://github.com/square/crossfilter).
 * [coloredRectangle.js](https://gist.github.com/curran/1af08ad6cdb01707c33f#file-coloredrectangle-js) in [Chiasm Boilerplate](http://bl.ocks.org/curran/1af08ad6cdb01707c33f) A colored rectangle that changes color when you click on it.
 * [dummyVis.js](https://gist.github.com/curran/b4aa88691528c0f0b1fa#file-dummyvis-js) in [Chiasm Foundation](http://bl.ocks.org/curran/b4aa88691528c0f0b1fa). A colored rectangle with a draggable X and text label.
 * [chiasm-leaflet.js](https://gist.github.com/curran/81271937fa94fdbdd854#file-chiasm-leaflet-js) An integration with [Leaflet.js](leafletjs.com).

## Presentations on Chiasm

 * [Chiasm @ Houston Data Visualization Meetup](https://www.youtube.com/watch?v=ivPSdm7Bz3o) - August 2015
 * [Lightning Demo (2 min) at San Francisco D3 Meetup](https://youtu.be/OJBwvSUgqQQ?t=5m58s) - July 2015
 * [Chiasm presentation at Alpine Data Labs](https://www.youtube.com/watch?v=9jh4E3-jxcQ&feature=youtu.be&a) ([slides](http://www.slideshare.net/currankelleher/chiasm)) - May 2015
 * [Constructing Interactive Data Visualizations - Plans for Chiasm](https://www.youtube.com/watch?v=GxGkHam33Cw) - February 2015
 * [Visualizing the Universal Data Cube](https://youtu.be/XVHyygdD1Kg?t=47m22s) - November 2014 - Doctoral dissertation defense including the blueprint for Chiasm.

## Notice

This project is currently undergoing restructuring and being split up
into many modules that live under
[github.com/chiasm-project](https://github.com/chiasm-project). The full project
state before the refactoring (including visualization and data loading plugins)
can be found on the [archive_v0.1.9 branch](https://github.com/curran/chiasm/tree/archive_v0.1.9).

# Background

The core concept of this project is that interactive graphics, particularly data visualizations, can be instantiated, configured with
data, arranged on the screen, and coupled together to produce interactive linked
views.

A JSON configuration structure defines the entire state of a Chiasm
application. The configuration refers to plugins by name, which are invoked to instantiate instances of 
components. Configuration changes can be made at runtime, and Chiasm will
propagate the changes through the system. The JSON configuration also updates in
response to changes in the state of the component's [Model](https://github.com/curran/model) at runtime.

With visualizations, this means that the state users arrived at by interacting with the system (customizing visualization parameters, changing the columns visualized, or changing colors) can be serialized. This makes it possible to build a system that stores and retrieves editable Chiasm configurations.

## Configuration Structure and Runtime Environment

A configuration is a JSON object encapsulating an application state. This
configuration contains specifications for a set of runtime components, each of
which has:

 * a unique name (called the "alias" of the component),
 * an associated plugin that creates the runtime component, and
 * a key-value dictionary specifying the state of the runtime component.

This organization allows a dynamic configuration structure to drive the state of
the application, and also allows changes resulting from user interactions with
runtime components to be propagated back to the configuration.

![Runtime Diagram](http://curran.github.io/images/visEditor/Runtime.png)

This diagram illustrates that

 * Plugins create runtime components.
 * Changes in configuration propagate to runtime components.
 * Changes in runtime components propagate back to the configuration.

# The word "[Chiasm](http://www.merriam-webster.com/audio.php?file=chiasm02&word=chiasm&text=)"

<img src="https://upload.wikimedia.org/wikipedia/commons/5/5c/1543%2CVisalius%27OpticChiasma.jpg" width=200>

> The optic nerve fibres on the nasal sides of each retina cross over to the opposite side of the brain via the optic nerve at the optic **chiasm**. -- [Wikipedia](http://en.wikipedia.org/wiki/Optic_chiasm)

> The **Chiasm** was a junction of interdimensional networks and corridors that allowed for instantaneous travel over long distances of space. - [Dr. Who](http://tardis.wikia.com/wiki/Chiasm)

**Chiasm**, this project, relates to the above meanings of the word "Chiasm" in
that it connects the "brain" of data to the "eyes" of users through interactive
visualization. When Chiasm is set up to use an interactive data transformation
like [Crossfilter](http://square.github.io/crossfilter/), the visualization
system is an intersection of multidimensional "corridors" in data space, and
interacting with it allows users to rapidly pivot and navigate through the data.

## Contributing

Any contributions or involvement is welcome. Feel free to [submit an issue](https://github.com/chiasm-project/chiasm/issues) for feature requests and bugs. For feedback and discussion in general, please post to the [Chiasm Google Group](https://groups.google.com/forum/?hl=en&fromgroups#!forum/chiasm-project).
