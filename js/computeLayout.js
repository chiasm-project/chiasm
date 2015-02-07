// This module provides a single function that computes a nested box layout.
//
// Created by Curran Kelleher Feb 2015
define(["lodash"], function (_) {

  // Takes as input the following arguments:
  //
  // * `layout` A tree data structure defining nested boxes. The root
  //   of the tree may be either a leaf node or an internal node.
  //   * Leaf nodes are component alias strings.
  //   * Internal nodes are objects with the following properties:
  //     * `orientation` A string, either
  //       * "horizontal", meaning this node is subdivided horizontally
  //         with children placed from left to right, or
  //       * "vertical", meaning this node is subdivided vertically
  //         with children placed from top to bottom.
  //     * `children` An array of child node objects, each of which may be 
  //       either leaf nodes or internal nodes.
  //     * `size` The size of the internal node, with the same specifications
  //       as values within `sizes` (see next bullet point).
  // * `sizes` An object that specifies component size options, where
  //   * Keys are component alias strings.
  //   * Values are objects with the following properties:
  //     * `size` the width (if the containing box is horizontal)
  //       or height (if the containing box is vertical) of the component. May be either:
  //       * a number (like "1.5" or "1", expressed as a number or a string) that determines 
  //         size relative to siblings within the containing box, or
  //       * a count of pixels (like "50px" or "200px" expressed as a string with "px" suffix)
  //         that determines an absolute fixed size. This is useful in cases where components 
  //         have fixed-size UI widgets rather than flexibly resizable visualizations.
  //       * If `size` is not specified, it is assigned a default value of 1.
  //     * `hidden` A boolean for hiding components. If true, the component
  //       is excluded from the layout, if false the component is included.
  // * `box` An object describing the outermost box of the layout, with the following properties:
  //   * `width` The width of the box in pixels.
  //   * `height` The height of the box in pixels.
  //   * `x` The X offset of the box in pixels. If not specified, this defaults to zero.
  //   * `y` The Y offset of the box in pixels. If not specified, this defaults to zero.
  //
  // Returns an object where
  //
  //  * Keys are component aliases.
  //  * Values are objects representing the computed box for the component, having the following properties:
  //   * `x` The X offset of the box in pixels.
  //   * `y` The Y offset of the box in pixels.
  //   * `width` The width of the box in pixels.
  //   * `height` The height of the box in pixels.
  //   * These box dimensions are quantized from floats to ints such that there are no gaps.
  return function computeLayout (layout, sizes, box){
    var result = {},
        alias,
        isHorizontal,
        wiggleRoom,
        sizeSum = 0,
        x,
        y,
        visibleChildren;

    box.x = box.x || 0;
    box.y = box.y || 0;
    sizes = sizes || {};

    function size(layout){
      var result;
      if(isLeafNode(layout)){
        alias = layout;
        if((alias in sizes) && ("size" in sizes[alias])){
          result = sizes[alias].size;
        } else {
          result = 1;
        }
      } else {
        result = layout.size || 1;
      }
      if(typeof result === "string" && ! isPixelCount(result)){
        result = parseFloat(result);
      }
      return result;
    }

    function isVisible(layout) {
      if(isLeafNode(layout) && (layout in sizes)){
        return !sizes[layout].hidden;
      } else {
        return true;
      }
    }

    if(isLeafNode(layout)){
      result[layout] = _.clone(box);
    } else {
      isHorizontal = layout.orientation === "horizontal";
      wiggleRoom = isHorizontal ? box.width : box.height;
      visibleChildren = layout.children.filter(isVisible);
      visibleChildren.forEach(function (child) {
        if(isPixelCount(size(child))){
          wiggleRoom -= pixelCount(size(child));
        } else {
          sizeSum += size(child);
        }
      });
      x = box.x;
      y = box.y;
      visibleChildren.forEach(function (child) {
        var childBox = { x: x, y: y},
            childSize = size(child),
            sizeInPixels;

        if(isPixelCount(childSize)){
          sizeInPixels = pixelCount(childSize);
        } else {
          sizeInPixels = (childSize / sizeSum) * wiggleRoom;
        }

        if(isHorizontal){
          childBox.width = sizeInPixels;
          childBox.height = box.height;
          x += childBox.width;
        } else {
          childBox.width = box.width;
          childBox.height = sizeInPixels;
          y += childBox.height;
        }

        quantize(childBox);

        if(isLeafNode(child)){
          alias = child;
          result[alias] = childBox;
        } else {
          _.extend(result, computeLayout(child, sizes, childBox));
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

  function quantize(box){
    var x = Math.round(box.x),
        y = Math.round(box.y);
    box.width = Math.round(box.width + box.x - x);
    box.height = Math.round(box.height + box.y - y);
    box.x = x;
    box.y = y;
  }

});
