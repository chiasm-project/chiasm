![Chiasm](http://curran.github.io/images/chiasm/chiasm_logo.png)

[github.com/chiasm-project](https://github.com/chiasm-project)

[![Build
Status](https://travis-ci.org/chiasm-project/chiasm.svg?branch=master)](https://travis-ci.org/chiasm-project/chiasm)

Chiasm is a browser based runtime environment and plugin architecture for
interactive visualizations. It allows plugins for data access, data
transformation, and interactive visualization to be loaded and configured
dynamically.

This repository contains `chiasm.js`, the core runtime environment. Also check
out these other projects under
[github.com/chiasm-project](https://github.com/chiasm-project/):

 * [chiasm-component](https://github.com/chiasm-project/chiasm-component) A common base for Chiasm plugins.
 * [chiasm-layout](https://github.com/chiasm-project/chiasm-layout) Nested box layout for Chiasm components.

Please give this repo a star if you think it is cool. Also feel free to submit
GitHub issues for feature requests and bugs. For questions on using Chiasm and
discussion in general, please post to the [Chiasm Google
Group](https://groups.google.com/forum/?hl=en&fromgroups#!forum/chiasm-project).

Presentations on Chiasm:

 * [Chiasm @ Houston Data Visualization Meetup](https://www.youtube.com/watch?v=ivPSdm7Bz3o) - August 2015
 * [Lightning Demo (2 min) at San Francisco D3 Meetup](https://youtu.be/OJBwvSUgqQQ?t=5m58s) - July 2015
 * [Chiasm presentation at Alpine Data Labs](https://www.youtube.com/watch?v=9jh4E3-jxcQ&feature=youtu.be&a) ([slides](http://www.slideshare.net/currankelleher/chiasm)) - May 2015
 * [Constructing Interactive Data Visualizations - Plans for Chiasm](https://www.youtube.com/watch?v=GxGkHam33Cw) - February 2015
 * [Visualizing the Universal Data Cube](https://youtu.be/XVHyygdD1Kg?t=47m22s) - November 2014 - Doctoral dissertation defense including the blueprint for Chiasm.

**Notice:** This project is currently undergoing restructuring and being split up
into many modules that live under
[github.com/chiasm-project](https://github.com/chiasm-project). The full project
state before the refactoring (including visualization and data loading plugins)
can be found on the [archive_v0.1.9 branch](https://github.com/curran/chiasm/tree/archive_v0.1.9).

## Examples

| thumbnail | description  |
|---|---|
| [![](https://gist.githubusercontent.com/curran/01aa2685f083b6c1b9fb/raw/d20ddb8e5b42360234654d1a0d9344e8e15ae716/thumbnail.png)](http://bl.ocks.org/curran/01aa2685f083b6c1b9fb) | Map & Globe based on [Leaflet.js](leafletjs.com) and [This is a Globe](http://bl.ocks.org/mbostock/ba63c55dd2dbc3ab0127). |
| [![](http://bl.ocks.org/curran/raw/b4aa88691528c0f0b1fa/thumbnail.png)](http://bl.ocks.org/curran/b4aa88691528c0f0b1fa) | A self-contained example showing the new v0.2.0 plugin API. |
| [![](http://bl.ocks.org/curran/raw/3f0b1128d74308fc8fe1/thumbnail.png)](http://bl.ocks.org/curran/3f0b1128d74308fc8fe1) | A demo of the Chiasm configuration editor and nested box layout. |
| [![](http://bl.ocks.org/curran/raw/4ce2ee825811f1c32125/thumbnail.png)](http://bl.ocks.org/curran/4ce2ee825811f1c32125) | An example Chiasm configuration with a bar chart and line chart. |
| [![](http://curran.github.io/images/chiasm/kitchenSink.png)](http://bl.ocks.org/curran/70ae30ab3b3eea62f84e) | The Chiasm kitchen sink (<a href="https://github.com/curran/chiasm/tree/gh-pages/kitchenSink">code</a>), showing various configurations including scatter plot, line chart, and bar chart. |
| [![](http://bl.ocks.org/curran/raw/5a9767b5c23982c89632/thumbnail.png)](http://bl.ocks.org/curran/5a9767b5c23982c89632) | An example demonstrating linked views and having a common color scale. |
| [![](http://bl.ocks.org/curran/raw/19d42e98ce25291eb45d/thumbnail.png)](http://bl.ocks.org/curran/19d42e98ce25291eb45d) | A more complex example with linked views using Crossfilter and loading data from an API. |

## Overview

The core concept is that visualizations can be instantiated, configured with
data, arranged on the screen, and coupled together to produce interactive linked
views. A JSON configuration structure defines the entire state of an
application. The configuration refers to plugins by name, which are loaded at
runtime and called upon to instantiate instances of visualizations and other
components. Configuration changes can be made at runtime, and Chiasm will
propagate the changes through the system. The JSON configuration also updates in
response to user interactions with visualizations, so can be used to serialize
visualization state resulting from user interactions.

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
