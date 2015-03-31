# [Chiasm](http://www.merriam-webster.com/audio.php?file=chiasm02&word=chiasm&text=)

> The optic nerve fibres on the nasal sides of each retina cross over to the opposite side of the brain via the optic nerve at the optic **chiasm**. -- [Wikipedia](http://en.wikipedia.org/wiki/Optic_chiasm)

> The **Chiasm** was a junction of interdimensional networks and corridors that allowed for instantaneous travel over long distances of space. - [Dr. Who](http://tardis.wikia.com/wiki/Chiasm)

**Chiasm**, this project, is an interactive data visualization system. It relates to the above meanings of the word "Chiasm" in that it connects the "brain" of Big Data and cluster computing to the eyes of users through interactive data visualization. The Chiasm server side implements a Big Data version of [Crossfilter](http://square.github.io/crossfilter/), so in a way this is an intersection of multidimensional corridors in data space, and interacting with it allows users to rapidly pivot and navigate through the data.

Here's a [talk on YouTube about Chiasm - Constructing Interactive Data Visualizations](https://www.youtube.com/watch?v=GxGkHam33Cw)

See also [Model.js](https://github.com/curran/model), which this project is built on.

## Examples
[![](http://bl.ocks.org/curran/raw/3f0b1128d74308fc8fe1/thumbnail.png)](http://bl.ocks.org/curran/3f0b1128d74308fc8fe1)
[![](http://bl.ocks.org/curran/raw/4ce2ee825811f1c32125/thumbnail.png)](http://bl.ocks.org/curran/4ce2ee825811f1c32125)
[![](http://bl.ocks.org/curran/raw/5a9767b5c23982c89632/thumbnail.png)](http://bl.ocks.org/curran/5a9767b5c23982c89632)
[![](http://bl.ocks.org/curran/raw/19d42e98ce25291eb45d/thumbnail.png)](http://bl.ocks.org/curran/19d42e98ce25291eb45d)

## Organization

Chiasm is a standalone system with client side and server side components, but is also designed such that it can integrated with [Chorus](https://github.com/Chorus/chorus), a collaboration platform for Big Data.

 * [`client`](client) The runtime and plugins for interactive visualizations.
 * [`server`](server) The data reduction service and its REST API.
   * `dataReductionService` The [Spark](https://spark.apache.org/)-based data reduction service.
   * `visEngine` The [Rails Engine](http://guides.rubyonrails.org/engines.html) for integration with [Chorus](https://github.com/Chorus/chorus).

## Architecture

![](http://curran.github.io/images/chiasm/vis_flow.png)

The overall architecture for interactive Big Data visualization with Chiasm. The goal is to establish an interactive feedback loop between the user and the data that enables rapid visual data exploration.
