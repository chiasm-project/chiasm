// This module provides a single function that computes a nested box layout.
// Created by Cuyrran Kelleher Feb 2015
define(["lodash"], function (_) {

  // Takes as input
  //
  // * `layout` A tree data structure defining nested boxes. The root
  //   may be a leaf node or internal node.
  //   * Leaf nodes are component alias strings.
  //   * Internal nodes are objects with the following properties:
  //     * `orientation` A string, either
  //       * "horizontal", meaning this node is subdivided horizontally
  //         with children placed from left to right, or
  //       * "vertical", meaning this node is subdivided vertically
  //         with children placed from top to bottom.
  //     * `children` - an array of child node objects, which may be leaf
  //       nodes or internal nodes.
  // * `sizes` An object where
  //   * Keys are component aliases
  //   * Values are objects with the following properties
  //     * `size` the width (if the containing box is horizontal)
  //       or height (if the containing box is vertical) of the component.
  //       The `size` value may be either:
  //       * a number (like "1.5" or "1") that determines size relative to 
  //         siblings within the containing box, or
  //       * a count of pixels (like "50px" or "200px") that determines an absolute
  //         fixed size. This is useful in cases where components have fixed-size UI 
  //         widgets rather than resizable visualizations.
  //       * If `size` is not specified, it is assigned a default value of 1.
  //     * `hidden` A boolean for hiding components. If true, the component
  //       is excluded from the layout, if false the component is included.
  // * `box` An object describing the outermost box of the layout, with the following properties:
  //   * `width` The width of the box in pixels.
  //   * `height` The height of the box in pixels.
  //   * `x` The X offset of the box in pixels. If not specified, this defaults to zero.
  //   * `y` The Y offset of the box in pixels. If not specified, this defaults to zero.
  //
  // The returned result is an object where
  //
  //  * Keys are component aliases
  //  * Values are objects representing the computed box for the component, having the following properties:
  //   * `x` The X offset of the box in pixels.
  //   * `y` The Y offset of the box in pixels.
  //   * `width` The width of the box in pixels.
  //   * `height` The height of the box in pixels.
  return function computeLayout (layout, sizes, box){
    var result = {},
        alias,
        isHorizontal,
        wiggleRoom,
        sizeSum = 0,
        x,
        y;

    box.x = box.x || 0;
    box.y = box.y || 0;
    sizes = sizes || {};

    function size(layout){
      if(isLeafNode(layout)){
        alias = layout;
        if((alias in sizes) && ("size" in sizes[alias])){
          return sizes[alias].size;
        } else {
          return 1;
        }
      } else {
        // TODO test this path
        return layout.size || 1;
      }
    }

    if(isLeafNode(layout)){
      result[layout] = _.clone(box);
    } else {
      isHorizontal = layout.orientation === "horizontal";
      wiggleRoom = isHorizontal ? box.width : box.height;
      layout.children.forEach(function (child) {
        if(isPixelCount(size(child))){
          wiggleRoom -= pixelCount(size(child));
        } else {
          sizeSum += size(child);
        }
      });
      x = box.x;
      y = box.y;
      layout.children.forEach(function (child) {
        var childBox = { x: x, y: y},
            sizeInPixels;
        if(isPixelCount(size(child))){
          sizeInPixels = pixelCount(size(child));
        } else {
          sizeInPixels = (size(child) / sizeSum) * wiggleRoom;
        }
        if(isHorizontal){
          childBox.width = sizeInPixels;
          childBox.height = box.height;
          x += childBox.width;
        } else {
          // TODO test this path
          childBox.width = box.width;
          childBox.height = sizeInPixels;
          y += childBox.height;
        }
        if(isLeafNode(child)){
          alias = child;
          result[alias] = childBox;
        } else {
          // TODO test this path
        }
      });
    }

    return result;
  };

  function isLeafNode(layout){
    return typeof layout === "string";
  }

  function isPixelCount(size){
    return (typeof size === "string") && endsWith(size, "px");
  }

  // http://stackoverflow.com/questions/280634/endswith-in-javascript
  function endsWith(str, suffix){
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
  }

  function pixelCount(size){
    return parseInt(size.substr(0, size.length - 2));
  }
});
