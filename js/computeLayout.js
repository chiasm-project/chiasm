// This module provides a single function that computes a nested box layout.
// Created by Cuyrran Kelleher Feb 2015
define([], function () {

  // Takes as input
  //
  // * `layout` A nested array structure defining the nested boxes.
  //   Each array starts with a string, either "horizontal" or "vertical", and subsequent entries are either
  //   * strings that are component aliases, or
  //   * arrays that follow the same structure as `layout`
  // * `properties` An object where
  //   * Keys are component aliases
  //   * Values are objects with the following properties
  //     * `size` the width (if the containing box is horizontal) or height (if the containing box is vertical) of the component. The `size` value may be either:
  //       * a number (like "1.5" or "1") that determines size relative to siblings within the containing box, or
  //       * a count of pixels (like "50px" or "200px") that determines an absolute fixed size. This is useful in cases where components have fixed-size UI widgets rather than resizable visualizations.
  //       * If `size` is not specified, it is assigned a default value of 1. For example, if a horizontal box has three components within it each with an unspecified `size`, they will all be given an equal amount of space within their containing box.
  return function computeLayout (layout, properties){

  };
});
