(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Chiasm = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// This is the top-level Chiasm bundle module that includes visualization plugins,
// and exposes a Chiasm constructor that makes the plugins available statically.
// Work-in-progress regarding how to bundle.
// Considering switching to ES6 and Rollup in future iterations,
// and possibly JSPM/SystemJS for dynamic loading.

// Curran Kelleher 6/29/15
var Chiasm = require("./src/chiasm");
var layout = require("./src/plugins/layout/layout");
var barChart = require("./src/plugins/barChart/barChart");
var lineChart = require("./src/plugins/lineChart/lineChart");
var scatterPlot = require("./src/plugins/scatterPlot/scatterPlot");
var links = require("./src/plugins/links/links");
var dummyVis = require("./src/plugins/dummyVis/dummyVis");
var csvLoader = require("./src/plugins/csvLoader/csvLoader");
var dataReduction = require("./src/plugins/dataReduction/dataReduction");
var dsvDataset = require("./src/plugins/dsvDataset/dsvDataset");

module.exports = function (container){
  var chiasm = Chiasm(container);
  chiasm.plugins.layout = layout;
  chiasm.plugins.barChart = barChart;
  chiasm.plugins.lineChart = lineChart;
  chiasm.plugins.scatterPlot = scatterPlot;
  chiasm.plugins.links = links;
  chiasm.plugins.dummyVis = dummyVis;
  chiasm.plugins.csvLoader = csvLoader;
  chiasm.plugins.dataReduction = dataReduction;
  chiasm.plugins.dsvDataset = dsvDataset;

//src/plugins/colorScale.js
//src/plugins/configEditor.js
//src/plugins/crossfilter.js
  return chiasm;
};

},{"./src/chiasm":7,"./src/plugins/barChart/barChart":8,"./src/plugins/csvLoader/csvLoader":9,"./src/plugins/dataReduction/dataReduction":10,"./src/plugins/dsvDataset/dsvDataset":11,"./src/plugins/dummyVis/dummyVis":12,"./src/plugins/layout/layout":14,"./src/plugins/lineChart/lineChart":15,"./src/plugins/links/links":16,"./src/plugins/scatterPlot/scatterPlot":17}],2:[function(require,module,exports){
'use strict';

function filter(data, predicates){
  predicates.forEach(function (predicate){
    var column = predicate.column;
    if("min" in predicate){
      var min = predicate.min;
      data = data.filter(function (d){
        return d[column] >= min;
      });
    }
    if("max" in predicate){
      var max = predicate.max;
      data = data.filter(function (d){
        return d[column] <= max;
      });
    }
    if("equal" in predicate){
      var equal = predicate.equal;
      data = data.filter(function (d){
        return d[column] == equal;
      });
    }
  });
  return data;
}

function aggregate(data, options){

  var dataByKey = {};

  function getRow(d, dimensions){
    var key = makeKey(d, dimensions);
    if(key in dataByKey){
      return dataByKey[key];
    } else {
      var row = makeRow(d, dimensions);
      dataByKey[key] = row;
      return row;
    }
  }

  data.forEach(function (d){
    var row = getRow(d, options.dimensions);
    options.measures.forEach(function (measure){
      var outColumn = measure.outColumn;
      if(measure.operator === "count"){
        row[outColumn] = (row[outColumn] || 0) + 1;
      }
    });
  });

  return Object.keys(dataByKey).map(function (key){
    return dataByKey[key];
  });
}

function makeKey(d, dimensions){
  return dimensions.map(function (dimension){
    return dimension.accessor(d);
  }).join(";");
}

function makeRow(d, dimensions){
  var row = {};
  dimensions.forEach(function (dimension){
    row[dimension.column] = dimension.accessor(d);
  });
  return row;
}

function extent(array, f) {
  var i = -1,
      n = array.length,
      a,
      b,
      c;

  if (arguments.length === 1) {
    while (++i < n) if ((b = array[i]) != null && b >= b) { a = c = b; break; }
    while (++i < n) if ((b = array[i]) != null) {
      if (a > b) a = b;
      if (c < b) c = b;
    }
  }

  else {
    while (++i < n) if ((b = f.call(array, array[i], i)) != null && b >= b) { a = c = b; break; }
    while (++i < n) if ((b = f.call(array, array[i], i)) != null) {
      if (a > b) a = b;
      if (c < b) c = b;
    }
  }

  return [a, c];
}

function interpolateNumber(a, b) {
  return a = +a, b -= a, function(t) {
    return a + b * t;
  };
}

function interpolateObject(a, b) {
  var i = {},
      c = {},
      k;

  for (k in a) {
    if (k in b) {
      i[k] = interpolate(a[k], b[k]);
    } else {
      c[k] = a[k];
    }
  }

  for (k in b) {
    if (!(k in a)) {
      c[k] = b[k];
    }
  }

  return function(t) {
    for (k in i) c[k] = i[k](t);
    return c;
  };
}


// TODO sparse arrays?
function interpolateArray(a, b) {
  var x = [],
      c = [],
      na = a.length,
      nb = b.length,
      n0 = Math.min(a.length, b.length),
      i;

  for (i = 0; i < n0; ++i) x.push(interpolate(a[i], b[i]));
  for (; i < na; ++i) c[i] = a[i];
  for (; i < nb; ++i) c[i] = b[i];

  return function(t) {
    for (i = 0; i < n0; ++i) c[i] = x[i](t);
    return c;
  };
}

function _format(r, g, b) {
  if (isNaN(r)) r = 0;
  if (isNaN(g)) g = 0;
  if (isNaN(b)) b = 0;
  return "#"
      + (r < 16 ? "0" + r.toString(16) : r.toString(16))
      + (g < 16 ? "0" + g.toString(16) : g.toString(16))
      + (b < 16 ? "0" + b.toString(16) : b.toString(16));
}

function Rgb(r, g, b) {
  this.r = Math.max(0, Math.min(255, Math.round(r)));
  this.g = Math.max(0, Math.min(255, Math.round(g)));
  this.b = Math.max(0, Math.min(255, Math.round(b)));
}

function Color() {}

Color.prototype = {
  toString: function() {
    return this.rgb() + "";
  }
};

var _prototype = Rgb.prototype = new Color;

var darker = .7;

_prototype.darker = function(k) {
  k = k == null ? darker : Math.pow(darker, k);
  return new Rgb(this.r * k, this.g * k, this.b * k);
};

var brighter = 1 / darker;

_prototype.brighter = function(k) {
  k = k == null ? brighter : Math.pow(brighter, k);
  return new Rgb(this.r * k, this.g * k, this.b * k);
};

_prototype.rgb = function() {
  return this;
};

_prototype.toString = function() {
  return _format(this.r, this.g, this.b);
};

var named = (new Map)
    .set("aliceblue", 0xf0f8ff)
    .set("antiquewhite", 0xfaebd7)
    .set("aqua", 0x00ffff)
    .set("aquamarine", 0x7fffd4)
    .set("azure", 0xf0ffff)
    .set("beige", 0xf5f5dc)
    .set("bisque", 0xffe4c4)
    .set("black", 0x000000)
    .set("blanchedalmond", 0xffebcd)
    .set("blue", 0x0000ff)
    .set("blueviolet", 0x8a2be2)
    .set("brown", 0xa52a2a)
    .set("burlywood", 0xdeb887)
    .set("cadetblue", 0x5f9ea0)
    .set("chartreuse", 0x7fff00)
    .set("chocolate", 0xd2691e)
    .set("coral", 0xff7f50)
    .set("cornflowerblue", 0x6495ed)
    .set("cornsilk", 0xfff8dc)
    .set("crimson", 0xdc143c)
    .set("cyan", 0x00ffff)
    .set("darkblue", 0x00008b)
    .set("darkcyan", 0x008b8b)
    .set("darkgoldenrod", 0xb8860b)
    .set("darkgray", 0xa9a9a9)
    .set("darkgreen", 0x006400)
    .set("darkgrey", 0xa9a9a9)
    .set("darkkhaki", 0xbdb76b)
    .set("darkmagenta", 0x8b008b)
    .set("darkolivegreen", 0x556b2f)
    .set("darkorange", 0xff8c00)
    .set("darkorchid", 0x9932cc)
    .set("darkred", 0x8b0000)
    .set("darksalmon", 0xe9967a)
    .set("darkseagreen", 0x8fbc8f)
    .set("darkslateblue", 0x483d8b)
    .set("darkslategray", 0x2f4f4f)
    .set("darkslategrey", 0x2f4f4f)
    .set("darkturquoise", 0x00ced1)
    .set("darkviolet", 0x9400d3)
    .set("deeppink", 0xff1493)
    .set("deepskyblue", 0x00bfff)
    .set("dimgray", 0x696969)
    .set("dimgrey", 0x696969)
    .set("dodgerblue", 0x1e90ff)
    .set("firebrick", 0xb22222)
    .set("floralwhite", 0xfffaf0)
    .set("forestgreen", 0x228b22)
    .set("fuchsia", 0xff00ff)
    .set("gainsboro", 0xdcdcdc)
    .set("ghostwhite", 0xf8f8ff)
    .set("gold", 0xffd700)
    .set("goldenrod", 0xdaa520)
    .set("gray", 0x808080)
    .set("green", 0x008000)
    .set("greenyellow", 0xadff2f)
    .set("grey", 0x808080)
    .set("honeydew", 0xf0fff0)
    .set("hotpink", 0xff69b4)
    .set("indianred", 0xcd5c5c)
    .set("indigo", 0x4b0082)
    .set("ivory", 0xfffff0)
    .set("khaki", 0xf0e68c)
    .set("lavender", 0xe6e6fa)
    .set("lavenderblush", 0xfff0f5)
    .set("lawngreen", 0x7cfc00)
    .set("lemonchiffon", 0xfffacd)
    .set("lightblue", 0xadd8e6)
    .set("lightcoral", 0xf08080)
    .set("lightcyan", 0xe0ffff)
    .set("lightgoldenrodyellow", 0xfafad2)
    .set("lightgray", 0xd3d3d3)
    .set("lightgreen", 0x90ee90)
    .set("lightgrey", 0xd3d3d3)
    .set("lightpink", 0xffb6c1)
    .set("lightsalmon", 0xffa07a)
    .set("lightseagreen", 0x20b2aa)
    .set("lightskyblue", 0x87cefa)
    .set("lightslategray", 0x778899)
    .set("lightslategrey", 0x778899)
    .set("lightsteelblue", 0xb0c4de)
    .set("lightyellow", 0xffffe0)
    .set("lime", 0x00ff00)
    .set("limegreen", 0x32cd32)
    .set("linen", 0xfaf0e6)
    .set("magenta", 0xff00ff)
    .set("maroon", 0x800000)
    .set("mediumaquamarine", 0x66cdaa)
    .set("mediumblue", 0x0000cd)
    .set("mediumorchid", 0xba55d3)
    .set("mediumpurple", 0x9370db)
    .set("mediumseagreen", 0x3cb371)
    .set("mediumslateblue", 0x7b68ee)
    .set("mediumspringgreen", 0x00fa9a)
    .set("mediumturquoise", 0x48d1cc)
    .set("mediumvioletred", 0xc71585)
    .set("midnightblue", 0x191970)
    .set("mintcream", 0xf5fffa)
    .set("mistyrose", 0xffe4e1)
    .set("moccasin", 0xffe4b5)
    .set("navajowhite", 0xffdead)
    .set("navy", 0x000080)
    .set("oldlace", 0xfdf5e6)
    .set("olive", 0x808000)
    .set("olivedrab", 0x6b8e23)
    .set("orange", 0xffa500)
    .set("orangered", 0xff4500)
    .set("orchid", 0xda70d6)
    .set("palegoldenrod", 0xeee8aa)
    .set("palegreen", 0x98fb98)
    .set("paleturquoise", 0xafeeee)
    .set("palevioletred", 0xdb7093)
    .set("papayawhip", 0xffefd5)
    .set("peachpuff", 0xffdab9)
    .set("peru", 0xcd853f)
    .set("pink", 0xffc0cb)
    .set("plum", 0xdda0dd)
    .set("powderblue", 0xb0e0e6)
    .set("purple", 0x800080)
    .set("rebeccapurple", 0x663399)
    .set("red", 0xff0000)
    .set("rosybrown", 0xbc8f8f)
    .set("royalblue", 0x4169e1)
    .set("saddlebrown", 0x8b4513)
    .set("salmon", 0xfa8072)
    .set("sandybrown", 0xf4a460)
    .set("seagreen", 0x2e8b57)
    .set("seashell", 0xfff5ee)
    .set("sienna", 0xa0522d)
    .set("silver", 0xc0c0c0)
    .set("skyblue", 0x87ceeb)
    .set("slateblue", 0x6a5acd)
    .set("slategray", 0x708090)
    .set("slategrey", 0x708090)
    .set("snow", 0xfffafa)
    .set("springgreen", 0x00ff7f)
    .set("steelblue", 0x4682b4)
    .set("tan", 0xd2b48c)
    .set("teal", 0x008080)
    .set("thistle", 0xd8bfd8)
    .set("tomato", 0xff6347)
    .set("turquoise", 0x40e0d0)
    .set("violet", 0xee82ee)
    .set("wheat", 0xf5deb3)
    .set("white", 0xffffff)
    .set("whitesmoke", 0xf5f5f5)
    .set("yellow", 0xffff00)
    .set("yellowgreen", 0x9acd32);

function rgbn(n) {
  return rgb(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff);
}

function Hsl(h, s, l) {
  this.h = +h;
  this.s = Math.max(0, Math.min(1, +s));
  this.l = Math.max(0, Math.min(1, +l));
}

var prototype = Hsl.prototype = new Color;

prototype.brighter = function(k) {
  k = k == null ? brighter : Math.pow(brighter, k);
  return new Hsl(this.h, this.s, this.l * k);
};

prototype.darker = function(k) {
  k = k == null ? darker : Math.pow(darker, k);
  return new Hsl(this.h, this.s, this.l * k);
};


/* From FvD 13.37, CSS Color Module Level 3 */
function hsl2rgb(h, m1, m2) {
  return (h < 60 ? m1 + (m2 - m1) * h / 60
      : h < 180 ? m2
      : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60
      : m1) * 255;
}

prototype.rgb = function() {
  var h = this.h % 360 + (this.h < 0) * 360,
      s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
      l = this.l,
      m2 = l <= .5 ? l * (1 + s) : l + s - l * s,
      m1 = 2 * l - m2;
  return new Rgb(
    hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
    hsl2rgb(h, m1, m2),
    hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2)
  );
};

function hsl(h, s, l) {
  if (arguments.length === 1) {
    if (h instanceof Hsl) {
      l = h.l;
      s = h.s;
      h = h.h;
    } else {
      if (!(h instanceof Color)) h = color(h);
      if (h) {
        if (h instanceof Hsl) return h;
        h = h.rgb();
        var r = h.r / 255,
            g = h.g / 255,
            b = h.b / 255,
            min = Math.min(r, g, b),
            max = Math.max(r, g, b),
            range = max - min;
        l = (max + min) / 2;
        if (range) {
          s = l < .5 ? range / (max + min) : range / (2 - max - min);
          if (r === max) h = (g - b) / range + (g < b) * 6;
          else if (g === max) h = (b - r) / range + 2;
          else h = (r - g) / range + 4;
          h *= 60;
        } else {
          h = NaN;
          s = l > 0 && l < 1 ? 0 : h;
        }
      } else {
        h = s = l = NaN;
      }
    }
  }
  return new Hsl(h, s, l);
}

var reHslPercent = /^hsl\(\s*([-+]?\d+(?:\.\d+)?)\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*\)$/;

var reRgbPercent = /^rgb\(\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*\)$/;

var reRgbInteger = /^rgb\(\s*([-+]?\d+)\s*,\s*([-+]?\d+)\s*,\s*([-+]?\d+)\s*\)$/;

var reHex6 = /^#([0-9a-f]{6})$/;

var reHex3 = /^#([0-9a-f]{3})$/;

function color(format) {
  var m;
  format = (format + "").trim().toLowerCase();
  return (m = reHex3.exec(format)) ? (m = parseInt(m[1], 16), rgb((m >> 8 & 0xf) | (m >> 4 & 0x0f0), (m >> 4 & 0xf) | (m & 0xf0), ((m & 0xf) << 4) | (m & 0xf))) // #f00
      : (m = reHex6.exec(format)) ? rgbn(parseInt(m[1], 16)) // #ff0000
      : (m = reRgbInteger.exec(format)) ? rgb(m[1], m[2], m[3]) // rgb(255,0,0)
      : (m = reRgbPercent.exec(format)) ? rgb(m[1] * 2.55, m[2] * 2.55, m[3] * 2.55) // rgb(100%,0%,0%)
      : (m = reHslPercent.exec(format)) ? hsl(m[1], m[2] * .01, m[3] * .01) // hsl(120,50%,50%)
      : named.has(format) ? rgbn(named.get(format))
      : null;
}

function rgb(r, g, b) {
  if (arguments.length === 1) {
    if (!(r instanceof Color)) r = color(r);
    if (r) {
      r = r.rgb();
      b = r.b;
      g = r.g;
      r = r.r;
    } else {
      r = g = b = NaN;
    }
  }
  return new Rgb(r, g, b);
}

function interpolateRgb(a, b) {
  a = rgb(a);
  b = rgb(b);
  var ar = a.r,
      ag = a.g,
      ab = a.b,
      br = b.r - ar,
      bg = b.g - ag,
      bb = b.b - ab;
  return function(t) {
    return _format(Math.round(ar + br * t), Math.round(ag + bg * t), Math.round(ab + bb * t));
  };
}

function interpolate0(b) {
  return function() {
    return b;
  };
}

function interpolate1(b) {
  return function(t) {
    return b(t) + "";
  };
}

var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g;
var reB = new RegExp(reA.source, "g");

function interpolateString(a, b) {
  var bi = reA.lastIndex = reB.lastIndex = 0, // scan index for next number in b
      am, // current match in a
      bm, // current match in b
      bs, // string preceding current number in b, if any
      i = -1, // index in s
      s = [], // string constants and placeholders
      q = []; // number interpolators

  // Coerce inputs to strings.
  a = a + "", b = b + "";

  // Interpolate pairs of numbers in a & b.
  while ((am = reA.exec(a))
      && (bm = reB.exec(b))) {
    if ((bs = bm.index) > bi) { // a string precedes the next number in b
      bs = b.slice(bi, bs);
      if (s[i]) s[i] += bs; // coalesce with previous string
      else s[++i] = bs;
    }
    if ((am = am[0]) === (bm = bm[0])) { // numbers in a & b match
      if (s[i]) s[i] += bm; // coalesce with previous string
      else s[++i] = bm;
    } else { // interpolate non-matching numbers
      s[++i] = null;
      q.push({i: i, x: interpolateNumber(am, bm)});
    }
    bi = reB.lastIndex;
  }

  // Add remains of b.
  if (bi < b.length) {
    bs = b.slice(bi);
    if (s[i]) s[i] += bs; // coalesce with previous string
    else s[++i] = bs;
  }

  // Special optimization for only a single match.
  // Otherwise, interpolate each of the numbers and rejoin the string.
  return s.length < 2 ? (q[0]
      ? interpolate1(q[0].x)
      : interpolate0(b))
      : (b = q.length, function(t) {
          for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
          return s.join("");
        });
}

var interpolators = [
  function(a, b) {
    var t = typeof b, c;
    return (t === "string" ? ((c = color(b)) ? (b = c, interpolateRgb) : interpolateString)
        : b instanceof color ? interpolateRgb
        : Array.isArray(b) ? interpolateArray
        : t === "object" && isNaN(b) ? interpolateObject
        : interpolateNumber)(a, b);
  }
];

function interpolate(a, b) {
  var i = interpolators.length, f;
  while (--i >= 0 && !(f = interpolators[i](a, b)));
  return f;
}

var e2 = Math.sqrt(2);

var e5 = Math.sqrt(10);

var e10 = Math.sqrt(50);

function tickRange(domain, count) {
  if (count == null) count = 10;

  var start = domain[0],
      stop = domain[domain.length - 1];

  if (stop < start) error = stop, stop = start, start = error;

  var span = stop - start,
      step = Math.pow(10, Math.floor(Math.log(span / count) / Math.LN10)),
      error = span / count / step;

  // Filter ticks to get closer to the desired count.
  if (error >= e10) step *= 10;
  else if (error >= e5) step *= 5;
  else if (error >= e2) step *= 2;

  // Round start and stop values to step interval.
  return [
    Math.ceil(start / step) * step,
    Math.floor(stop / step) * step + step / 2, // inclusive
    step
  ];
}

function nice(domain, step) {
  domain = domain.slice();
  if (!step) return domain;

  var i0 = 0,
      i1 = domain.length - 1,
      x0 = domain[i0],
      x1 = domain[i1],
      dx;

  if (x1 < x0) {
    dx = i0, i0 = i1, i1 = dx;
    dx = x0, x0 = x1, x1 = dx;
  }

  domain[i0] = Math.floor(x0 / step) * step;
  domain[i1] = Math.ceil(x1 / step) * step;
  return domain;
}

var prefixes = ["y","z","a","f","p","n","µ","m","","k","M","G","T","P","E","Z","Y"];


// Computes the decimal coefficient and exponent of the specified number x with
// significant digits p, where x is positive and p is in [1, 21] or undefined.
// For example, formatDecimal(1.23) returns ["123", 0].
function formatDecimal(x, p) {
  if ((i = (x = p ? x.toExponential(p - 1) : x.toExponential()).indexOf("e")) < 0) return null; // NaN, ±Infinity
  var i, coefficient = x.slice(0, i);

  // The string returned by toExponential either has the form \d\.\d+e[-+]\d+
  // (e.g., 1.2e+3) or the form \de[-+]\d+ (e.g., 1e+3).
  return [
    coefficient.length > 1 ? coefficient[0] + coefficient.slice(2) : coefficient,
    +x.slice(i + 1)
  ];
}

function exponent(x) {
  return x = formatDecimal(Math.abs(x)), x ? x[1] : NaN;
}

var prefixExponent;

function formatPrefixAuto(x, p) {
  var d = formatDecimal(x, p);
  if (!d) return x + "";
  var coefficient = d[0],
      exponent = d[1],
      i = exponent - (prefixExponent = Math.max(-8, Math.min(8, Math.floor(exponent / 3))) * 3) + 1,
      n = coefficient.length;
  return i === n ? coefficient
      : i > n ? coefficient + new Array(i - n + 1).join("0")
      : i > 0 ? coefficient.slice(0, i) + "." + coefficient.slice(i)
      : "0." + new Array(1 - i).join("0") + formatDecimal(x, p + i - 1)[0]; // less than 1y!
}

function formatRounded(x, p) {
  var d = formatDecimal(x, p);
  if (!d) return x + "";
  var coefficient = d[0],
      exponent = d[1];
  return exponent < 0 ? "0." + new Array(-exponent).join("0") + coefficient
      : coefficient.length > exponent + 1 ? coefficient.slice(0, exponent + 1) + "." + coefficient.slice(exponent + 1)
      : coefficient + new Array(exponent - coefficient.length + 2).join("0");
}

function formatDefault(x, p) {
  x = x.toPrecision(p);

  out: for (var n = x.length, i = 1, i0 = -1, i1; i < n; ++i) {
    switch (x[i]) {
      case ".": i0 = i1 = i; break;
      case "0": if (i0 === 0) i0 = i; i1 = i; break;
      case "e": break out;
      default: if (i0 > 0) i0 = 0; break;
    }
  }

  return i0 > 0 ? x.slice(0, i0) + x.slice(i1 + 1) : x;
}

var formatTypes = {
  "": formatDefault,
  "%": function(x, p) { return (x * 100).toFixed(p); },
  "b": function(x) { return Math.round(x).toString(2); },
  "c": function(x) { return x + ""; },
  "d": function(x) { return Math.round(x).toString(10); },
  "e": function(x, p) { return x.toExponential(p); },
  "f": function(x, p) { return x.toFixed(p); },
  "g": function(x, p) { return x.toPrecision(p); },
  "o": function(x) { return Math.round(x).toString(8); },
  "p": function(x, p) { return formatRounded(x * 100, p); },
  "r": formatRounded,
  "s": formatPrefixAuto,
  "X": function(x) { return Math.round(x).toString(16).toUpperCase(); },
  "x": function(x) { return Math.round(x).toString(16); }
};


// [[fill]align][sign][symbol][0][width][,][.precision][type]
var re = /^(?:(.)?([<>=^]))?([+\-\( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?([a-z%])?$/i;

function FormatSpecifier(specifier) {
  if (!(match = re.exec(specifier))) throw new Error("invalid format: " + specifier);

  var match,
      fill = match[1] || " ",
      align = match[2] || ">",
      sign = match[3] || "-",
      symbol = match[4] || "",
      zero = !!match[5],
      width = match[6] && +match[6],
      comma = !!match[7],
      precision = match[8] && +match[8].slice(1),
      type = match[9] || "";

  // The "n" type is an alias for ",g".
  if (type === "n") comma = true, type = "g";

  // Map invalid types to the default format.
  else if (!formatTypes[type]) type = "";

  // If zero fill is specified, padding goes after sign and before digits.
  if (zero || (fill === "0" && align === "=")) zero = true, fill = "0", align = "=";

  this.fill = fill;
  this.align = align;
  this.sign = sign;
  this.symbol = symbol;
  this.zero = zero;
  this.width = width;
  this.comma = comma;
  this.precision = precision;
  this.type = type;
}

FormatSpecifier.prototype.toString = function() {
  return this.fill
      + this.align
      + this.sign
      + this.symbol
      + (this.zero ? "0" : "")
      + (this.width == null ? "" : Math.max(1, this.width | 0))
      + (this.comma ? "," : "")
      + (this.precision == null ? "" : "." + Math.max(0, this.precision | 0))
      + this.type;
};

function formatSpecifier(specifier) {
  return new FormatSpecifier(specifier);
}

function identity(x) {
  return x;
}

function formatGroup(grouping, thousands) {
  return function(value, width) {
    var i = value.length,
        t = [],
        j = 0,
        g = grouping[0],
        length = 0;

    while (i > 0 && g > 0) {
      if (length + g + 1 > width) g = Math.max(1, width - length);
      t.push(value.substring(i -= g, i + g));
      if ((length += g + 1) > width) break;
      g = grouping[j = (j + 1) % grouping.length];
    }

    return t.reverse().join(thousands);
  };
}

function localeFormat(locale) {
  var group = locale.grouping && locale.thousands ? formatGroup(locale.grouping, locale.thousands) : identity,
      currency = locale.currency,
      decimal = locale.decimal;

  function format(specifier) {
    specifier = formatSpecifier(specifier);

    var fill = specifier.fill,
        align = specifier.align,
        sign = specifier.sign,
        symbol = specifier.symbol,
        zero = specifier.zero,
        width = specifier.width,
        comma = specifier.comma,
        precision = specifier.precision,
        type = specifier.type;

    // Compute the prefix and suffix.
    // For SI-prefix, the suffix is lazily computed.
    var prefix = symbol === "$" ? currency[0] : symbol === "#" && /[boxX]/.test(type) ? "0" + type.toLowerCase() : "",
        suffix = symbol === "$" ? currency[1] : /[%p]/.test(type) ? "%" : "";

    // What format function should we use?
    // Is this an integer type?
    // Can this type generate exponential notation?
    var formatType = formatTypes[type],
        maybeSuffix = !type || /[defgprs%]/.test(type);

    // Set the default precision if not specified,
    // or clamp the specified precision to the supported range.
    // For significant precision, it must be in [1, 21].
    // For fixed precision, it must be in [0, 20].
    precision = precision == null ? (type ? 6 : 12)
        : /[gprs]/.test(type) ? Math.max(1, Math.min(21, precision))
        : Math.max(0, Math.min(20, precision));

    return function(value) {
      var valuePrefix = prefix,
          valueSuffix = suffix;

      if (type === "c") {
        valueSuffix = formatType(value) + valueSuffix;
        value = "";
      } else {
        value = +value;

        // Convert negative to positive, and compute the prefix.
        // Note that -0 is not less than 0, but 1 / -0 is!
        var valueNegative = (value < 0 || 1 / value < 0) && (value *= -1, true);

        // Perform the initial formatting.
        value = formatType(value, precision);

        // Compute the prefix and suffix.
        valuePrefix = (valueNegative ? (sign === "(" ? sign : "-") : sign === "-" || sign === "(" ? "" : sign) + valuePrefix;
        valueSuffix = valueSuffix + (type === "s" ? prefixes[8 + prefixExponent / 3] : "") + (valueNegative && sign === "(" ? ")" : "");

        // Break the formatted value into the integer “value” part that can be
        // grouped, and fractional or exponential “suffix” part that is not.
        if (maybeSuffix) {
          var i = -1, n = value.length, c;
          while (++i < n) {
            if (c = value.charCodeAt(i), 48 > c || c > 57) {
              valueSuffix = (c === 46 ? decimal + value.slice(i + 1) : value.slice(i)) + valueSuffix;
              value = value.slice(0, i);
              break;
            }
          }
        }
      }

      // If the fill character is not "0", grouping is applied before padding.
      if (comma && !zero) value = group(value, Infinity);

      // Compute the padding.
      var length = valuePrefix.length + value.length + valueSuffix.length,
          padding = length < width ? new Array(width - length + 1).join(fill) : "";

      // If the fill character is "0", grouping is applied after padding.
      if (comma && zero) value = group(padding + value, padding.length ? width - valueSuffix.length : Infinity), padding = "";

      // Reconstruct the final output based on the desired alignment.
      switch (align) {
        case "<": return valuePrefix + value + valueSuffix + padding;
        case "=": return valuePrefix + padding + value + valueSuffix;
        case "^": return padding.slice(0, length = padding.length >> 1) + valuePrefix + value + valueSuffix + padding.slice(length);
      }
      return padding + valuePrefix + value + valueSuffix;
    };
  }

  function formatPrefix(specifier, value) {
    var f = format((specifier = formatSpecifier(specifier), specifier.type = "f", specifier)),
        e = Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3,
        k = Math.pow(10, -e),
        prefix = prefixes[8 + e / 3];
    return function(value) {
      return f(k * value) + prefix;
    };
  }

  return {
    format: format,
    formatPrefix: formatPrefix
  };
}

var locale = localeFormat({
  decimal: ".",
  thousands: ",",
  grouping: [3],
  currency: ["$", ""]
});

var format = locale.format;

function precisionFixed(step) {
  return Math.max(0, -exponent(Math.abs(step)));
}

function precisionRound(step, max) {
  return Math.max(0, exponent(Math.abs(max)) - exponent(Math.abs(step))) + 1;
}

var formatPrefix = locale.formatPrefix;

function precisionPrefix(step, value) {
  return Math.max(0, Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3 - exponent(Math.abs(step)));
}

function tickFormat(domain, count, specifier) {
  var range = tickRange(domain, count);
  if (specifier == null) {
    specifier = ",." + precisionFixed(range[2]) + "f";
  } else {
    switch (specifier = formatSpecifier(specifier), specifier.type) {
      case "s": {
        var value = Math.max(Math.abs(range[0]), Math.abs(range[1]));
        if (specifier.precision == null) specifier.precision = precisionPrefix(range[2], value);
        return formatPrefix(specifier, value);
      }
      case "":
      case "e":
      case "g":
      case "p":
      case "r": {
        if (specifier.precision == null) specifier.precision = precisionRound(range[2], Math.max(Math.abs(range[0]), Math.abs(range[1]))) - (specifier.type === "e");
        break;
      }
      case "f":
      case "%": {
        if (specifier.precision == null) specifier.precision = precisionFixed(range[2]) - (specifier.type === "%") * 2;
        break;
      }
    }
  }
  return format(specifier);
}

function scale(x) {
  var k = 1;
  while (x * k % 1) k *= 10;
  return k;
}

function range(start, stop, step) {
  if ((n = arguments.length) < 3) {
    step = 1;
    if (n < 2) {
      stop = start;
      start = 0;
    }
  }

  var i = -1,
      n = Math.max(0, Math.ceil((stop - start) / step)) | 0,
      k = scale(Math.abs(step)),
      range = new Array(n);

  start *= k;
  step *= k;
  while (++i < n) {
    range[i] = (start + i * step) / k;
  }

  return range;
}

function ticks(domain, count) {
  return range.apply(null, tickRange(domain, count));
}

function interpolateRound(a, b) {
  return a = +a, b -= a, function(t) {
    return Math.round(a + b * t);
  };
}

function uninterpolateNumber(a, b) {
  b = (b -= a = +a) || 1 / b;
  return function(x) {
    return (x - a) / b;
  };
}

function uninterpolateClamp(a, b) {
  b = (b -= a = +a) || 1 / b;
  return function(x) {
    return Math.max(0, Math.min(1, (x - a) / b));
  };
}

function bilinear(domain, range, uninterpolate, interpolate) {
  var u = uninterpolate(domain[0], domain[1]),
      i = interpolate(range[0], range[1]);
  return function(x) {
    return i(u(x));
  };
}

function ascending(a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}

function ascendingComparator(f) {
  return function(d, x) {
    return ascending(f(d), x);
  };
}

function bisector(compare) {
  if (compare.length === 1) compare = ascendingComparator(compare);
  return {
    left: function(a, x, lo, hi) {
      if (arguments.length < 3) lo = 0;
      if (arguments.length < 4) hi = a.length;
      while (lo < hi) {
        var mid = lo + hi >>> 1;
        if (compare(a[mid], x) < 0) lo = mid + 1;
        else hi = mid;
      }
      return lo;
    },
    right: function(a, x, lo, hi) {
      if (arguments.length < 3) lo = 0;
      if (arguments.length < 4) hi = a.length;
      while (lo < hi) {
        var mid = lo + hi >>> 1;
        if (compare(a[mid], x) > 0) hi = mid;
        else lo = mid + 1;
      }
      return lo;
    }
  };
}

var ascendingBisect = bisector(ascending);
var bisectRight = ascendingBisect.right;

var bisect = bisectRight;

function polylinear(domain, range, uninterpolate, interpolate) {
  var k = Math.min(domain.length, range.length) - 1,
      u = new Array(k),
      i = new Array(k),
      j = -1;

  // Handle descending domains.
  if (domain[k] < domain[0]) {
    domain = domain.slice().reverse();
    range = range.slice().reverse();
  }

  while (++j < k) {
    u[j] = uninterpolate(domain[j], domain[j + 1]);
    i[j] = interpolate(range[j], range[j + 1]);
  }

  return function(x) {
    var j = bisect(domain, x, 1, k) - 1;
    return i[j](u[j](x));
  };
}

function newLinear(domain, range, interpolate, clamp) {
  var output,
      input;

  function rescale() {
    var linear = Math.min(domain.length, range.length) > 2 ? polylinear : bilinear,
        uninterpolate = clamp ? uninterpolateClamp : uninterpolateNumber;
    output = linear(domain, range, uninterpolate, interpolate);
    input = linear(range, domain, uninterpolate, interpolateNumber);
    return scale;
  }

  function scale(x) {
    return output(x);
  }

  scale.invert = function(y) {
    return input(y);
  };

  scale.domain = function(x) {
    if (!arguments.length) return domain.slice();
    domain = x.map(Number);
    return rescale();
  };

  scale.range = function(x) {
    if (!arguments.length) return range.slice();
    range = x.slice();
    return rescale();
  };

  scale.rangeRound = function(x) {
    return scale.range(x).interpolate(interpolateRound);
  };

  scale.clamp = function(x) {
    if (!arguments.length) return clamp;
    clamp = !!x;
    return rescale();
  };

  scale.interpolate = function(x) {
    if (!arguments.length) return interpolate;
    interpolate = x;
    return rescale();
  };

  scale.ticks = function(count) {
    return ticks(domain, count);
  };

  scale.tickFormat = function(count, specifier) {
    return tickFormat(domain, count, specifier);
  };

  scale.nice = function(count) {
    domain = nice(domain, tickRange(domain, count)[2]);
    return rescale();
  };

  scale.copy = function() {
    return newLinear(domain, range, interpolate, clamp);
  };

  return rescale();
}

function linear() {
  return newLinear([0, 1], [0, 1], interpolate, false);
}

function accessor(column){
  return function (d){
    return d[column];
  };
}


// Implements a filter -> aggregate data flow.
function dataReduction(data, options){

  var metadata = {};

  if("filter" in options){
    data = filter(data, options.filter);
  }

  if("aggregate" in options){
    options.aggregate.dimensions.forEach(function (dimension){

      dimension.accessor = accessor(dimension.column);

      if(dimension.histogram){

        var count = dimension.numBins + 1;

        var ticks = linear()
          .domain(extent(data, dimension.accessor))
          .nice(count)
          .ticks(count);

        var n = ticks.length - 1;
        var min = ticks[0];
        var max = ticks[n];
        var span = max - min;
        var step = span / n;

        var rawAccessor = dimension.accessor;

        var binAccessor = function(d){
          var value = rawAccessor(d);
          var normalized = (value - min) / span; // Varies between 0 and 1
          var i = Math.floor(normalized * n);

          // Handle the special case of the max value,
          // making the last bin inclusive of the max.
          if( i === n ){
            i--;
          }

          return ticks[i];
        };

        dimension.accessor = binAccessor;

        // The step metadata is exported for a HeatMap implementation to use.
        // see https://gist.github.com/mbostock/3202354#file-index-html-L42
        metadata[dimension.column] = { step: step };

      }
    });
    data = aggregate(data, options.aggregate);
  }

  return {
    data: data,
    metadata: metadata
  };
}
;


var index = dataReduction;

module.exports = index;
},{}],3:[function(require,module,exports){
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('moment')) :
  typeof define === 'function' && define.amd ? define(['moment'], factory) :
  global.dsvDataset = factory(moment);
}(this, function (moment) { 'use strict';

  function dsv(delimiter) {
    var reFormat = new RegExp("[\"" + delimiter + "\n]"),
        delimiterCode = delimiter.charCodeAt(0);

    function parse(text, f) {
      var o;
      return parseRows(text, function(row, i) {
        if (o) return o(row, i - 1);
        var a = new Function("d", "return {" + row.map(function(name, i) {
          return JSON.stringify(name) + ": d[" + i + "]";
        }).join(",") + "}");
        o = f ? function(row, i) { return f(a(row), i); } : a;
      });
    }

    function parseRows(text, f) {
      var EOL = {}, // sentinel value for end-of-line
          EOF = {}, // sentinel value for end-of-file
          rows = [], // output rows
          N = text.length,
          I = 0, // current character index
          n = 0, // the current line number
          t, // the current token
          eol; // is the current token followed by EOL?

      function token() {
        if (I >= N) return EOF; // special case: end of file
        if (eol) return eol = false, EOL; // special case: end of line

        // special case: quotes
        var j = I;
        if (text.charCodeAt(j) === 34) {
          var i = j;
          while (i++ < N) {
            if (text.charCodeAt(i) === 34) {
              if (text.charCodeAt(i + 1) !== 34) break;
              ++i;
            }
          }
          I = i + 2;
          var c = text.charCodeAt(i + 1);
          if (c === 13) {
            eol = true;
            if (text.charCodeAt(i + 2) === 10) ++I;
          } else if (c === 10) {
            eol = true;
          }
          return text.slice(j + 1, i).replace(/""/g, "\"");
        }

        // common case: find next delimiter or newline
        while (I < N) {
          var c = text.charCodeAt(I++), k = 1;
          if (c === 10) eol = true; // \n
          else if (c === 13) { eol = true; if (text.charCodeAt(I) === 10) ++I, ++k; } // \r|\r\n
          else if (c !== delimiterCode) continue;
          return text.slice(j, I - k);
        }

        // special case: last token before EOF
        return text.slice(j);
      }

      while ((t = token()) !== EOF) {
        var a = [];
        while (t !== EOL && t !== EOF) {
          a.push(t);
          t = token();
        }
        if (f && (a = f(a, n++)) == null) continue;
        rows.push(a);
      }

      return rows;
    }

    function format(rows) {
      if (Array.isArray(rows[0])) return formatRows(rows); // deprecated; use formatRows
      var fieldSet = Object.create(null), fields = [];

      // Compute unique fields in order of discovery.
      rows.forEach(function(row) {
        for (var field in row) {
          if (!((field += "") in fieldSet)) {
            fields.push(fieldSet[field] = field);
          }
        }
      });

      return [fields.map(formatValue).join(delimiter)].concat(rows.map(function(row) {
        return fields.map(function(field) {
          return formatValue(row[field]);
        }).join(delimiter);
      })).join("\n");
    }

    function formatRows(rows) {
      return rows.map(formatRow).join("\n");
    }

    function formatRow(row) {
      return row.map(formatValue).join(delimiter);
    }

    function formatValue(text) {
      return reFormat.test(text) ? "\"" + text.replace(/\"/g, "\"\"") + "\"" : text;
    }

    return {
      parse: parse,
      parseRows: parseRows,
      format: format,
      formatRows: formatRows
    };
  }

  var parseFunctions = {
    number: parseFloat,
    date: function (str) {
      return moment(str).toDate();
    }
  };

  function generateColumnParsers(metadata) {
    if("columns" in metadata){
      return metadata.columns

        // Do not generate column parsing functions for string columns,
        // because they are already strings and need no modification.
        .filter(function (column){
          return column.type !== "string";
        })

        .map(function (column){
          var parseValue = parseFunctions[column.type];
          var columnName = column.name;
          return function (d){
            d[columnName] = parseValue(d[columnName]);
          }
        });
    } else {
      return [];
    }
  }

  var index = {
    parse: function (dataset){

      var dsvString = dataset.dsvString;

      // Handle the case where `metadata` is not speficied.
      var metadata = dataset.metadata || {};

      // Default to CSV if no delimiter speficied.
      var delimiter = metadata.delimiter || ",";

      var columnParsers = generateColumnParsers(metadata);
      var numColumns = columnParsers.length;
      var i;

      dataset.data = dsv(delimiter).parse(dsvString, function (d){

        // Old school for loop as an optimization.
        for(i = 0; i < numColumns; i++){

          // Each column parser function mutates the row object,
          // replacing the column property string with its parsed variant.
          columnParsers[i](d);
        }
        return d;
      });

      return dataset;
    }
  };

  return index;

}));
},{"moment":4}],4:[function(require,module,exports){
//! moment.js
//! version : 2.10.6
//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
//! license : MIT
//! momentjs.com

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.moment = factory()
}(this, function () { 'use strict';

    var hookCallback;

    function utils_hooks__hooks () {
        return hookCallback.apply(null, arguments);
    }

    // This is done to register the method called with moment()
    // without creating circular dependencies.
    function setHookCallback (callback) {
        hookCallback = callback;
    }

    function isArray(input) {
        return Object.prototype.toString.call(input) === '[object Array]';
    }

    function isDate(input) {
        return input instanceof Date || Object.prototype.toString.call(input) === '[object Date]';
    }

    function map(arr, fn) {
        var res = [], i;
        for (i = 0; i < arr.length; ++i) {
            res.push(fn(arr[i], i));
        }
        return res;
    }

    function hasOwnProp(a, b) {
        return Object.prototype.hasOwnProperty.call(a, b);
    }

    function extend(a, b) {
        for (var i in b) {
            if (hasOwnProp(b, i)) {
                a[i] = b[i];
            }
        }

        if (hasOwnProp(b, 'toString')) {
            a.toString = b.toString;
        }

        if (hasOwnProp(b, 'valueOf')) {
            a.valueOf = b.valueOf;
        }

        return a;
    }

    function create_utc__createUTC (input, format, locale, strict) {
        return createLocalOrUTC(input, format, locale, strict, true).utc();
    }

    function defaultParsingFlags() {
        // We need to deep clone this object.
        return {
            empty           : false,
            unusedTokens    : [],
            unusedInput     : [],
            overflow        : -2,
            charsLeftOver   : 0,
            nullInput       : false,
            invalidMonth    : null,
            invalidFormat   : false,
            userInvalidated : false,
            iso             : false
        };
    }

    function getParsingFlags(m) {
        if (m._pf == null) {
            m._pf = defaultParsingFlags();
        }
        return m._pf;
    }

    function valid__isValid(m) {
        if (m._isValid == null) {
            var flags = getParsingFlags(m);
            m._isValid = !isNaN(m._d.getTime()) &&
                flags.overflow < 0 &&
                !flags.empty &&
                !flags.invalidMonth &&
                !flags.invalidWeekday &&
                !flags.nullInput &&
                !flags.invalidFormat &&
                !flags.userInvalidated;

            if (m._strict) {
                m._isValid = m._isValid &&
                    flags.charsLeftOver === 0 &&
                    flags.unusedTokens.length === 0 &&
                    flags.bigHour === undefined;
            }
        }
        return m._isValid;
    }

    function valid__createInvalid (flags) {
        var m = create_utc__createUTC(NaN);
        if (flags != null) {
            extend(getParsingFlags(m), flags);
        }
        else {
            getParsingFlags(m).userInvalidated = true;
        }

        return m;
    }

    var momentProperties = utils_hooks__hooks.momentProperties = [];

    function copyConfig(to, from) {
        var i, prop, val;

        if (typeof from._isAMomentObject !== 'undefined') {
            to._isAMomentObject = from._isAMomentObject;
        }
        if (typeof from._i !== 'undefined') {
            to._i = from._i;
        }
        if (typeof from._f !== 'undefined') {
            to._f = from._f;
        }
        if (typeof from._l !== 'undefined') {
            to._l = from._l;
        }
        if (typeof from._strict !== 'undefined') {
            to._strict = from._strict;
        }
        if (typeof from._tzm !== 'undefined') {
            to._tzm = from._tzm;
        }
        if (typeof from._isUTC !== 'undefined') {
            to._isUTC = from._isUTC;
        }
        if (typeof from._offset !== 'undefined') {
            to._offset = from._offset;
        }
        if (typeof from._pf !== 'undefined') {
            to._pf = getParsingFlags(from);
        }
        if (typeof from._locale !== 'undefined') {
            to._locale = from._locale;
        }

        if (momentProperties.length > 0) {
            for (i in momentProperties) {
                prop = momentProperties[i];
                val = from[prop];
                if (typeof val !== 'undefined') {
                    to[prop] = val;
                }
            }
        }

        return to;
    }

    var updateInProgress = false;

    // Moment prototype object
    function Moment(config) {
        copyConfig(this, config);
        this._d = new Date(config._d != null ? config._d.getTime() : NaN);
        // Prevent infinite loop in case updateOffset creates new moment
        // objects.
        if (updateInProgress === false) {
            updateInProgress = true;
            utils_hooks__hooks.updateOffset(this);
            updateInProgress = false;
        }
    }

    function isMoment (obj) {
        return obj instanceof Moment || (obj != null && obj._isAMomentObject != null);
    }

    function absFloor (number) {
        if (number < 0) {
            return Math.ceil(number);
        } else {
            return Math.floor(number);
        }
    }

    function toInt(argumentForCoercion) {
        var coercedNumber = +argumentForCoercion,
            value = 0;

        if (coercedNumber !== 0 && isFinite(coercedNumber)) {
            value = absFloor(coercedNumber);
        }

        return value;
    }

    function compareArrays(array1, array2, dontConvert) {
        var len = Math.min(array1.length, array2.length),
            lengthDiff = Math.abs(array1.length - array2.length),
            diffs = 0,
            i;
        for (i = 0; i < len; i++) {
            if ((dontConvert && array1[i] !== array2[i]) ||
                (!dontConvert && toInt(array1[i]) !== toInt(array2[i]))) {
                diffs++;
            }
        }
        return diffs + lengthDiff;
    }

    function Locale() {
    }

    var locales = {};
    var globalLocale;

    function normalizeLocale(key) {
        return key ? key.toLowerCase().replace('_', '-') : key;
    }

    // pick the locale from the array
    // try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
    // substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
    function chooseLocale(names) {
        var i = 0, j, next, locale, split;

        while (i < names.length) {
            split = normalizeLocale(names[i]).split('-');
            j = split.length;
            next = normalizeLocale(names[i + 1]);
            next = next ? next.split('-') : null;
            while (j > 0) {
                locale = loadLocale(split.slice(0, j).join('-'));
                if (locale) {
                    return locale;
                }
                if (next && next.length >= j && compareArrays(split, next, true) >= j - 1) {
                    //the next array item is better than a shallower substring of this one
                    break;
                }
                j--;
            }
            i++;
        }
        return null;
    }

    function loadLocale(name) {
        var oldLocale = null;
        // TODO: Find a better way to register and load all the locales in Node
        if (!locales[name] && typeof module !== 'undefined' &&
                module && module.exports) {
            try {
                oldLocale = globalLocale._abbr;
                require('./locale/' + name);
                // because defineLocale currently also sets the global locale, we
                // want to undo that for lazy loaded locales
                locale_locales__getSetGlobalLocale(oldLocale);
            } catch (e) { }
        }
        return locales[name];
    }

    // This function will load locale and then set the global locale.  If
    // no arguments are passed in, it will simply return the current global
    // locale key.
    function locale_locales__getSetGlobalLocale (key, values) {
        var data;
        if (key) {
            if (typeof values === 'undefined') {
                data = locale_locales__getLocale(key);
            }
            else {
                data = defineLocale(key, values);
            }

            if (data) {
                // moment.duration._locale = moment._locale = data;
                globalLocale = data;
            }
        }

        return globalLocale._abbr;
    }

    function defineLocale (name, values) {
        if (values !== null) {
            values.abbr = name;
            locales[name] = locales[name] || new Locale();
            locales[name].set(values);

            // backwards compat for now: also set the locale
            locale_locales__getSetGlobalLocale(name);

            return locales[name];
        } else {
            // useful for testing
            delete locales[name];
            return null;
        }
    }

    // returns locale data
    function locale_locales__getLocale (key) {
        var locale;

        if (key && key._locale && key._locale._abbr) {
            key = key._locale._abbr;
        }

        if (!key) {
            return globalLocale;
        }

        if (!isArray(key)) {
            //short-circuit everything else
            locale = loadLocale(key);
            if (locale) {
                return locale;
            }
            key = [key];
        }

        return chooseLocale(key);
    }

    var aliases = {};

    function addUnitAlias (unit, shorthand) {
        var lowerCase = unit.toLowerCase();
        aliases[lowerCase] = aliases[lowerCase + 's'] = aliases[shorthand] = unit;
    }

    function normalizeUnits(units) {
        return typeof units === 'string' ? aliases[units] || aliases[units.toLowerCase()] : undefined;
    }

    function normalizeObjectUnits(inputObject) {
        var normalizedInput = {},
            normalizedProp,
            prop;

        for (prop in inputObject) {
            if (hasOwnProp(inputObject, prop)) {
                normalizedProp = normalizeUnits(prop);
                if (normalizedProp) {
                    normalizedInput[normalizedProp] = inputObject[prop];
                }
            }
        }

        return normalizedInput;
    }

    function makeGetSet (unit, keepTime) {
        return function (value) {
            if (value != null) {
                get_set__set(this, unit, value);
                utils_hooks__hooks.updateOffset(this, keepTime);
                return this;
            } else {
                return get_set__get(this, unit);
            }
        };
    }

    function get_set__get (mom, unit) {
        return mom._d['get' + (mom._isUTC ? 'UTC' : '') + unit]();
    }

    function get_set__set (mom, unit, value) {
        return mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value);
    }

    // MOMENTS

    function getSet (units, value) {
        var unit;
        if (typeof units === 'object') {
            for (unit in units) {
                this.set(unit, units[unit]);
            }
        } else {
            units = normalizeUnits(units);
            if (typeof this[units] === 'function') {
                return this[units](value);
            }
        }
        return this;
    }

    function zeroFill(number, targetLength, forceSign) {
        var absNumber = '' + Math.abs(number),
            zerosToFill = targetLength - absNumber.length,
            sign = number >= 0;
        return (sign ? (forceSign ? '+' : '') : '-') +
            Math.pow(10, Math.max(0, zerosToFill)).toString().substr(1) + absNumber;
    }

    var formattingTokens = /(\[[^\[]*\])|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Q|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g;

    var localFormattingTokens = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g;

    var formatFunctions = {};

    var formatTokenFunctions = {};

    // token:    'M'
    // padded:   ['MM', 2]
    // ordinal:  'Mo'
    // callback: function () { this.month() + 1 }
    function addFormatToken (token, padded, ordinal, callback) {
        var func = callback;
        if (typeof callback === 'string') {
            func = function () {
                return this[callback]();
            };
        }
        if (token) {
            formatTokenFunctions[token] = func;
        }
        if (padded) {
            formatTokenFunctions[padded[0]] = function () {
                return zeroFill(func.apply(this, arguments), padded[1], padded[2]);
            };
        }
        if (ordinal) {
            formatTokenFunctions[ordinal] = function () {
                return this.localeData().ordinal(func.apply(this, arguments), token);
            };
        }
    }

    function removeFormattingTokens(input) {
        if (input.match(/\[[\s\S]/)) {
            return input.replace(/^\[|\]$/g, '');
        }
        return input.replace(/\\/g, '');
    }

    function makeFormatFunction(format) {
        var array = format.match(formattingTokens), i, length;

        for (i = 0, length = array.length; i < length; i++) {
            if (formatTokenFunctions[array[i]]) {
                array[i] = formatTokenFunctions[array[i]];
            } else {
                array[i] = removeFormattingTokens(array[i]);
            }
        }

        return function (mom) {
            var output = '';
            for (i = 0; i < length; i++) {
                output += array[i] instanceof Function ? array[i].call(mom, format) : array[i];
            }
            return output;
        };
    }

    // format date using native date object
    function formatMoment(m, format) {
        if (!m.isValid()) {
            return m.localeData().invalidDate();
        }

        format = expandFormat(format, m.localeData());
        formatFunctions[format] = formatFunctions[format] || makeFormatFunction(format);

        return formatFunctions[format](m);
    }

    function expandFormat(format, locale) {
        var i = 5;

        function replaceLongDateFormatTokens(input) {
            return locale.longDateFormat(input) || input;
        }

        localFormattingTokens.lastIndex = 0;
        while (i >= 0 && localFormattingTokens.test(format)) {
            format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
            localFormattingTokens.lastIndex = 0;
            i -= 1;
        }

        return format;
    }

    var match1         = /\d/;            //       0 - 9
    var match2         = /\d\d/;          //      00 - 99
    var match3         = /\d{3}/;         //     000 - 999
    var match4         = /\d{4}/;         //    0000 - 9999
    var match6         = /[+-]?\d{6}/;    // -999999 - 999999
    var match1to2      = /\d\d?/;         //       0 - 99
    var match1to3      = /\d{1,3}/;       //       0 - 999
    var match1to4      = /\d{1,4}/;       //       0 - 9999
    var match1to6      = /[+-]?\d{1,6}/;  // -999999 - 999999

    var matchUnsigned  = /\d+/;           //       0 - inf
    var matchSigned    = /[+-]?\d+/;      //    -inf - inf

    var matchOffset    = /Z|[+-]\d\d:?\d\d/gi; // +00:00 -00:00 +0000 -0000 or Z

    var matchTimestamp = /[+-]?\d+(\.\d{1,3})?/; // 123456789 123456789.123

    // any word (or two) characters or numbers including two/three word month in arabic.
    var matchWord = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i;

    var regexes = {};

    function isFunction (sth) {
        // https://github.com/moment/moment/issues/2325
        return typeof sth === 'function' &&
            Object.prototype.toString.call(sth) === '[object Function]';
    }


    function addRegexToken (token, regex, strictRegex) {
        regexes[token] = isFunction(regex) ? regex : function (isStrict) {
            return (isStrict && strictRegex) ? strictRegex : regex;
        };
    }

    function getParseRegexForToken (token, config) {
        if (!hasOwnProp(regexes, token)) {
            return new RegExp(unescapeFormat(token));
        }

        return regexes[token](config._strict, config._locale);
    }

    // Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
    function unescapeFormat(s) {
        return s.replace('\\', '').replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (matched, p1, p2, p3, p4) {
            return p1 || p2 || p3 || p4;
        }).replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    var tokens = {};

    function addParseToken (token, callback) {
        var i, func = callback;
        if (typeof token === 'string') {
            token = [token];
        }
        if (typeof callback === 'number') {
            func = function (input, array) {
                array[callback] = toInt(input);
            };
        }
        for (i = 0; i < token.length; i++) {
            tokens[token[i]] = func;
        }
    }

    function addWeekParseToken (token, callback) {
        addParseToken(token, function (input, array, config, token) {
            config._w = config._w || {};
            callback(input, config._w, config, token);
        });
    }

    function addTimeToArrayFromToken(token, input, config) {
        if (input != null && hasOwnProp(tokens, token)) {
            tokens[token](input, config._a, config, token);
        }
    }

    var YEAR = 0;
    var MONTH = 1;
    var DATE = 2;
    var HOUR = 3;
    var MINUTE = 4;
    var SECOND = 5;
    var MILLISECOND = 6;

    function daysInMonth(year, month) {
        return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    }

    // FORMATTING

    addFormatToken('M', ['MM', 2], 'Mo', function () {
        return this.month() + 1;
    });

    addFormatToken('MMM', 0, 0, function (format) {
        return this.localeData().monthsShort(this, format);
    });

    addFormatToken('MMMM', 0, 0, function (format) {
        return this.localeData().months(this, format);
    });

    // ALIASES

    addUnitAlias('month', 'M');

    // PARSING

    addRegexToken('M',    match1to2);
    addRegexToken('MM',   match1to2, match2);
    addRegexToken('MMM',  matchWord);
    addRegexToken('MMMM', matchWord);

    addParseToken(['M', 'MM'], function (input, array) {
        array[MONTH] = toInt(input) - 1;
    });

    addParseToken(['MMM', 'MMMM'], function (input, array, config, token) {
        var month = config._locale.monthsParse(input, token, config._strict);
        // if we didn't find a month name, mark the date as invalid.
        if (month != null) {
            array[MONTH] = month;
        } else {
            getParsingFlags(config).invalidMonth = input;
        }
    });

    // LOCALES

    var defaultLocaleMonths = 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_');
    function localeMonths (m) {
        return this._months[m.month()];
    }

    var defaultLocaleMonthsShort = 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_');
    function localeMonthsShort (m) {
        return this._monthsShort[m.month()];
    }

    function localeMonthsParse (monthName, format, strict) {
        var i, mom, regex;

        if (!this._monthsParse) {
            this._monthsParse = [];
            this._longMonthsParse = [];
            this._shortMonthsParse = [];
        }

        for (i = 0; i < 12; i++) {
            // make the regex if we don't have it already
            mom = create_utc__createUTC([2000, i]);
            if (strict && !this._longMonthsParse[i]) {
                this._longMonthsParse[i] = new RegExp('^' + this.months(mom, '').replace('.', '') + '$', 'i');
                this._shortMonthsParse[i] = new RegExp('^' + this.monthsShort(mom, '').replace('.', '') + '$', 'i');
            }
            if (!strict && !this._monthsParse[i]) {
                regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
                this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
            }
            // test the regex
            if (strict && format === 'MMMM' && this._longMonthsParse[i].test(monthName)) {
                return i;
            } else if (strict && format === 'MMM' && this._shortMonthsParse[i].test(monthName)) {
                return i;
            } else if (!strict && this._monthsParse[i].test(monthName)) {
                return i;
            }
        }
    }

    // MOMENTS

    function setMonth (mom, value) {
        var dayOfMonth;

        // TODO: Move this out of here!
        if (typeof value === 'string') {
            value = mom.localeData().monthsParse(value);
            // TODO: Another silent failure?
            if (typeof value !== 'number') {
                return mom;
            }
        }

        dayOfMonth = Math.min(mom.date(), daysInMonth(mom.year(), value));
        mom._d['set' + (mom._isUTC ? 'UTC' : '') + 'Month'](value, dayOfMonth);
        return mom;
    }

    function getSetMonth (value) {
        if (value != null) {
            setMonth(this, value);
            utils_hooks__hooks.updateOffset(this, true);
            return this;
        } else {
            return get_set__get(this, 'Month');
        }
    }

    function getDaysInMonth () {
        return daysInMonth(this.year(), this.month());
    }

    function checkOverflow (m) {
        var overflow;
        var a = m._a;

        if (a && getParsingFlags(m).overflow === -2) {
            overflow =
                a[MONTH]       < 0 || a[MONTH]       > 11  ? MONTH :
                a[DATE]        < 1 || a[DATE]        > daysInMonth(a[YEAR], a[MONTH]) ? DATE :
                a[HOUR]        < 0 || a[HOUR]        > 24 || (a[HOUR] === 24 && (a[MINUTE] !== 0 || a[SECOND] !== 0 || a[MILLISECOND] !== 0)) ? HOUR :
                a[MINUTE]      < 0 || a[MINUTE]      > 59  ? MINUTE :
                a[SECOND]      < 0 || a[SECOND]      > 59  ? SECOND :
                a[MILLISECOND] < 0 || a[MILLISECOND] > 999 ? MILLISECOND :
                -1;

            if (getParsingFlags(m)._overflowDayOfYear && (overflow < YEAR || overflow > DATE)) {
                overflow = DATE;
            }

            getParsingFlags(m).overflow = overflow;
        }

        return m;
    }

    function warn(msg) {
        if (utils_hooks__hooks.suppressDeprecationWarnings === false && typeof console !== 'undefined' && console.warn) {
            console.warn('Deprecation warning: ' + msg);
        }
    }

    function deprecate(msg, fn) {
        var firstTime = true;

        return extend(function () {
            if (firstTime) {
                warn(msg + '\n' + (new Error()).stack);
                firstTime = false;
            }
            return fn.apply(this, arguments);
        }, fn);
    }

    var deprecations = {};

    function deprecateSimple(name, msg) {
        if (!deprecations[name]) {
            warn(msg);
            deprecations[name] = true;
        }
    }

    utils_hooks__hooks.suppressDeprecationWarnings = false;

    var from_string__isoRegex = /^\s*(?:[+-]\d{6}|\d{4})-(?:(\d\d-\d\d)|(W\d\d$)|(W\d\d-\d)|(\d\d\d))((T| )(\d\d(:\d\d(:\d\d(\.\d+)?)?)?)?([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/;

    var isoDates = [
        ['YYYYYY-MM-DD', /[+-]\d{6}-\d{2}-\d{2}/],
        ['YYYY-MM-DD', /\d{4}-\d{2}-\d{2}/],
        ['GGGG-[W]WW-E', /\d{4}-W\d{2}-\d/],
        ['GGGG-[W]WW', /\d{4}-W\d{2}/],
        ['YYYY-DDD', /\d{4}-\d{3}/]
    ];

    // iso time formats and regexes
    var isoTimes = [
        ['HH:mm:ss.SSSS', /(T| )\d\d:\d\d:\d\d\.\d+/],
        ['HH:mm:ss', /(T| )\d\d:\d\d:\d\d/],
        ['HH:mm', /(T| )\d\d:\d\d/],
        ['HH', /(T| )\d\d/]
    ];

    var aspNetJsonRegex = /^\/?Date\((\-?\d+)/i;

    // date from iso format
    function configFromISO(config) {
        var i, l,
            string = config._i,
            match = from_string__isoRegex.exec(string);

        if (match) {
            getParsingFlags(config).iso = true;
            for (i = 0, l = isoDates.length; i < l; i++) {
                if (isoDates[i][1].exec(string)) {
                    config._f = isoDates[i][0];
                    break;
                }
            }
            for (i = 0, l = isoTimes.length; i < l; i++) {
                if (isoTimes[i][1].exec(string)) {
                    // match[6] should be 'T' or space
                    config._f += (match[6] || ' ') + isoTimes[i][0];
                    break;
                }
            }
            if (string.match(matchOffset)) {
                config._f += 'Z';
            }
            configFromStringAndFormat(config);
        } else {
            config._isValid = false;
        }
    }

    // date from iso format or fallback
    function configFromString(config) {
        var matched = aspNetJsonRegex.exec(config._i);

        if (matched !== null) {
            config._d = new Date(+matched[1]);
            return;
        }

        configFromISO(config);
        if (config._isValid === false) {
            delete config._isValid;
            utils_hooks__hooks.createFromInputFallback(config);
        }
    }

    utils_hooks__hooks.createFromInputFallback = deprecate(
        'moment construction falls back to js Date. This is ' +
        'discouraged and will be removed in upcoming major ' +
        'release. Please refer to ' +
        'https://github.com/moment/moment/issues/1407 for more info.',
        function (config) {
            config._d = new Date(config._i + (config._useUTC ? ' UTC' : ''));
        }
    );

    function createDate (y, m, d, h, M, s, ms) {
        //can't just apply() to create a date:
        //http://stackoverflow.com/questions/181348/instantiating-a-javascript-object-by-calling-prototype-constructor-apply
        var date = new Date(y, m, d, h, M, s, ms);

        //the date constructor doesn't accept years < 1970
        if (y < 1970) {
            date.setFullYear(y);
        }
        return date;
    }

    function createUTCDate (y) {
        var date = new Date(Date.UTC.apply(null, arguments));
        if (y < 1970) {
            date.setUTCFullYear(y);
        }
        return date;
    }

    addFormatToken(0, ['YY', 2], 0, function () {
        return this.year() % 100;
    });

    addFormatToken(0, ['YYYY',   4],       0, 'year');
    addFormatToken(0, ['YYYYY',  5],       0, 'year');
    addFormatToken(0, ['YYYYYY', 6, true], 0, 'year');

    // ALIASES

    addUnitAlias('year', 'y');

    // PARSING

    addRegexToken('Y',      matchSigned);
    addRegexToken('YY',     match1to2, match2);
    addRegexToken('YYYY',   match1to4, match4);
    addRegexToken('YYYYY',  match1to6, match6);
    addRegexToken('YYYYYY', match1to6, match6);

    addParseToken(['YYYYY', 'YYYYYY'], YEAR);
    addParseToken('YYYY', function (input, array) {
        array[YEAR] = input.length === 2 ? utils_hooks__hooks.parseTwoDigitYear(input) : toInt(input);
    });
    addParseToken('YY', function (input, array) {
        array[YEAR] = utils_hooks__hooks.parseTwoDigitYear(input);
    });

    // HELPERS

    function daysInYear(year) {
        return isLeapYear(year) ? 366 : 365;
    }

    function isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    }

    // HOOKS

    utils_hooks__hooks.parseTwoDigitYear = function (input) {
        return toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
    };

    // MOMENTS

    var getSetYear = makeGetSet('FullYear', false);

    function getIsLeapYear () {
        return isLeapYear(this.year());
    }

    addFormatToken('w', ['ww', 2], 'wo', 'week');
    addFormatToken('W', ['WW', 2], 'Wo', 'isoWeek');

    // ALIASES

    addUnitAlias('week', 'w');
    addUnitAlias('isoWeek', 'W');

    // PARSING

    addRegexToken('w',  match1to2);
    addRegexToken('ww', match1to2, match2);
    addRegexToken('W',  match1to2);
    addRegexToken('WW', match1to2, match2);

    addWeekParseToken(['w', 'ww', 'W', 'WW'], function (input, week, config, token) {
        week[token.substr(0, 1)] = toInt(input);
    });

    // HELPERS

    // firstDayOfWeek       0 = sun, 6 = sat
    //                      the day of the week that starts the week
    //                      (usually sunday or monday)
    // firstDayOfWeekOfYear 0 = sun, 6 = sat
    //                      the first week is the week that contains the first
    //                      of this day of the week
    //                      (eg. ISO weeks use thursday (4))
    function weekOfYear(mom, firstDayOfWeek, firstDayOfWeekOfYear) {
        var end = firstDayOfWeekOfYear - firstDayOfWeek,
            daysToDayOfWeek = firstDayOfWeekOfYear - mom.day(),
            adjustedMoment;


        if (daysToDayOfWeek > end) {
            daysToDayOfWeek -= 7;
        }

        if (daysToDayOfWeek < end - 7) {
            daysToDayOfWeek += 7;
        }

        adjustedMoment = local__createLocal(mom).add(daysToDayOfWeek, 'd');
        return {
            week: Math.ceil(adjustedMoment.dayOfYear() / 7),
            year: adjustedMoment.year()
        };
    }

    // LOCALES

    function localeWeek (mom) {
        return weekOfYear(mom, this._week.dow, this._week.doy).week;
    }

    var defaultLocaleWeek = {
        dow : 0, // Sunday is the first day of the week.
        doy : 6  // The week that contains Jan 1st is the first week of the year.
    };

    function localeFirstDayOfWeek () {
        return this._week.dow;
    }

    function localeFirstDayOfYear () {
        return this._week.doy;
    }

    // MOMENTS

    function getSetWeek (input) {
        var week = this.localeData().week(this);
        return input == null ? week : this.add((input - week) * 7, 'd');
    }

    function getSetISOWeek (input) {
        var week = weekOfYear(this, 1, 4).week;
        return input == null ? week : this.add((input - week) * 7, 'd');
    }

    addFormatToken('DDD', ['DDDD', 3], 'DDDo', 'dayOfYear');

    // ALIASES

    addUnitAlias('dayOfYear', 'DDD');

    // PARSING

    addRegexToken('DDD',  match1to3);
    addRegexToken('DDDD', match3);
    addParseToken(['DDD', 'DDDD'], function (input, array, config) {
        config._dayOfYear = toInt(input);
    });

    // HELPERS

    //http://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
    function dayOfYearFromWeeks(year, week, weekday, firstDayOfWeekOfYear, firstDayOfWeek) {
        var week1Jan = 6 + firstDayOfWeek - firstDayOfWeekOfYear, janX = createUTCDate(year, 0, 1 + week1Jan), d = janX.getUTCDay(), dayOfYear;
        if (d < firstDayOfWeek) {
            d += 7;
        }

        weekday = weekday != null ? 1 * weekday : firstDayOfWeek;

        dayOfYear = 1 + week1Jan + 7 * (week - 1) - d + weekday;

        return {
            year: dayOfYear > 0 ? year : year - 1,
            dayOfYear: dayOfYear > 0 ?  dayOfYear : daysInYear(year - 1) + dayOfYear
        };
    }

    // MOMENTS

    function getSetDayOfYear (input) {
        var dayOfYear = Math.round((this.clone().startOf('day') - this.clone().startOf('year')) / 864e5) + 1;
        return input == null ? dayOfYear : this.add((input - dayOfYear), 'd');
    }

    // Pick the first defined of two or three arguments.
    function defaults(a, b, c) {
        if (a != null) {
            return a;
        }
        if (b != null) {
            return b;
        }
        return c;
    }

    function currentDateArray(config) {
        var now = new Date();
        if (config._useUTC) {
            return [now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()];
        }
        return [now.getFullYear(), now.getMonth(), now.getDate()];
    }

    // convert an array to a date.
    // the array should mirror the parameters below
    // note: all values past the year are optional and will default to the lowest possible value.
    // [year, month, day , hour, minute, second, millisecond]
    function configFromArray (config) {
        var i, date, input = [], currentDate, yearToUse;

        if (config._d) {
            return;
        }

        currentDate = currentDateArray(config);

        //compute day of the year from weeks and weekdays
        if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
            dayOfYearFromWeekInfo(config);
        }

        //if the day of the year is set, figure out what it is
        if (config._dayOfYear) {
            yearToUse = defaults(config._a[YEAR], currentDate[YEAR]);

            if (config._dayOfYear > daysInYear(yearToUse)) {
                getParsingFlags(config)._overflowDayOfYear = true;
            }

            date = createUTCDate(yearToUse, 0, config._dayOfYear);
            config._a[MONTH] = date.getUTCMonth();
            config._a[DATE] = date.getUTCDate();
        }

        // Default to current date.
        // * if no year, month, day of month are given, default to today
        // * if day of month is given, default month and year
        // * if month is given, default only year
        // * if year is given, don't default anything
        for (i = 0; i < 3 && config._a[i] == null; ++i) {
            config._a[i] = input[i] = currentDate[i];
        }

        // Zero out whatever was not defaulted, including time
        for (; i < 7; i++) {
            config._a[i] = input[i] = (config._a[i] == null) ? (i === 2 ? 1 : 0) : config._a[i];
        }

        // Check for 24:00:00.000
        if (config._a[HOUR] === 24 &&
                config._a[MINUTE] === 0 &&
                config._a[SECOND] === 0 &&
                config._a[MILLISECOND] === 0) {
            config._nextDay = true;
            config._a[HOUR] = 0;
        }

        config._d = (config._useUTC ? createUTCDate : createDate).apply(null, input);
        // Apply timezone offset from input. The actual utcOffset can be changed
        // with parseZone.
        if (config._tzm != null) {
            config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);
        }

        if (config._nextDay) {
            config._a[HOUR] = 24;
        }
    }

    function dayOfYearFromWeekInfo(config) {
        var w, weekYear, week, weekday, dow, doy, temp;

        w = config._w;
        if (w.GG != null || w.W != null || w.E != null) {
            dow = 1;
            doy = 4;

            // TODO: We need to take the current isoWeekYear, but that depends on
            // how we interpret now (local, utc, fixed offset). So create
            // a now version of current config (take local/utc/offset flags, and
            // create now).
            weekYear = defaults(w.GG, config._a[YEAR], weekOfYear(local__createLocal(), 1, 4).year);
            week = defaults(w.W, 1);
            weekday = defaults(w.E, 1);
        } else {
            dow = config._locale._week.dow;
            doy = config._locale._week.doy;

            weekYear = defaults(w.gg, config._a[YEAR], weekOfYear(local__createLocal(), dow, doy).year);
            week = defaults(w.w, 1);

            if (w.d != null) {
                // weekday -- low day numbers are considered next week
                weekday = w.d;
                if (weekday < dow) {
                    ++week;
                }
            } else if (w.e != null) {
                // local weekday -- counting starts from begining of week
                weekday = w.e + dow;
            } else {
                // default to begining of week
                weekday = dow;
            }
        }
        temp = dayOfYearFromWeeks(weekYear, week, weekday, doy, dow);

        config._a[YEAR] = temp.year;
        config._dayOfYear = temp.dayOfYear;
    }

    utils_hooks__hooks.ISO_8601 = function () {};

    // date from string and format string
    function configFromStringAndFormat(config) {
        // TODO: Move this to another part of the creation flow to prevent circular deps
        if (config._f === utils_hooks__hooks.ISO_8601) {
            configFromISO(config);
            return;
        }

        config._a = [];
        getParsingFlags(config).empty = true;

        // This array is used to make a Date, either with `new Date` or `Date.UTC`
        var string = '' + config._i,
            i, parsedInput, tokens, token, skipped,
            stringLength = string.length,
            totalParsedInputLength = 0;

        tokens = expandFormat(config._f, config._locale).match(formattingTokens) || [];

        for (i = 0; i < tokens.length; i++) {
            token = tokens[i];
            parsedInput = (string.match(getParseRegexForToken(token, config)) || [])[0];
            if (parsedInput) {
                skipped = string.substr(0, string.indexOf(parsedInput));
                if (skipped.length > 0) {
                    getParsingFlags(config).unusedInput.push(skipped);
                }
                string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
                totalParsedInputLength += parsedInput.length;
            }
            // don't parse if it's not a known token
            if (formatTokenFunctions[token]) {
                if (parsedInput) {
                    getParsingFlags(config).empty = false;
                }
                else {
                    getParsingFlags(config).unusedTokens.push(token);
                }
                addTimeToArrayFromToken(token, parsedInput, config);
            }
            else if (config._strict && !parsedInput) {
                getParsingFlags(config).unusedTokens.push(token);
            }
        }

        // add remaining unparsed input length to the string
        getParsingFlags(config).charsLeftOver = stringLength - totalParsedInputLength;
        if (string.length > 0) {
            getParsingFlags(config).unusedInput.push(string);
        }

        // clear _12h flag if hour is <= 12
        if (getParsingFlags(config).bigHour === true &&
                config._a[HOUR] <= 12 &&
                config._a[HOUR] > 0) {
            getParsingFlags(config).bigHour = undefined;
        }
        // handle meridiem
        config._a[HOUR] = meridiemFixWrap(config._locale, config._a[HOUR], config._meridiem);

        configFromArray(config);
        checkOverflow(config);
    }


    function meridiemFixWrap (locale, hour, meridiem) {
        var isPm;

        if (meridiem == null) {
            // nothing to do
            return hour;
        }
        if (locale.meridiemHour != null) {
            return locale.meridiemHour(hour, meridiem);
        } else if (locale.isPM != null) {
            // Fallback
            isPm = locale.isPM(meridiem);
            if (isPm && hour < 12) {
                hour += 12;
            }
            if (!isPm && hour === 12) {
                hour = 0;
            }
            return hour;
        } else {
            // this is not supposed to happen
            return hour;
        }
    }

    function configFromStringAndArray(config) {
        var tempConfig,
            bestMoment,

            scoreToBeat,
            i,
            currentScore;

        if (config._f.length === 0) {
            getParsingFlags(config).invalidFormat = true;
            config._d = new Date(NaN);
            return;
        }

        for (i = 0; i < config._f.length; i++) {
            currentScore = 0;
            tempConfig = copyConfig({}, config);
            if (config._useUTC != null) {
                tempConfig._useUTC = config._useUTC;
            }
            tempConfig._f = config._f[i];
            configFromStringAndFormat(tempConfig);

            if (!valid__isValid(tempConfig)) {
                continue;
            }

            // if there is any input that was not parsed add a penalty for that format
            currentScore += getParsingFlags(tempConfig).charsLeftOver;

            //or tokens
            currentScore += getParsingFlags(tempConfig).unusedTokens.length * 10;

            getParsingFlags(tempConfig).score = currentScore;

            if (scoreToBeat == null || currentScore < scoreToBeat) {
                scoreToBeat = currentScore;
                bestMoment = tempConfig;
            }
        }

        extend(config, bestMoment || tempConfig);
    }

    function configFromObject(config) {
        if (config._d) {
            return;
        }

        var i = normalizeObjectUnits(config._i);
        config._a = [i.year, i.month, i.day || i.date, i.hour, i.minute, i.second, i.millisecond];

        configFromArray(config);
    }

    function createFromConfig (config) {
        var res = new Moment(checkOverflow(prepareConfig(config)));
        if (res._nextDay) {
            // Adding is smart enough around DST
            res.add(1, 'd');
            res._nextDay = undefined;
        }

        return res;
    }

    function prepareConfig (config) {
        var input = config._i,
            format = config._f;

        config._locale = config._locale || locale_locales__getLocale(config._l);

        if (input === null || (format === undefined && input === '')) {
            return valid__createInvalid({nullInput: true});
        }

        if (typeof input === 'string') {
            config._i = input = config._locale.preparse(input);
        }

        if (isMoment(input)) {
            return new Moment(checkOverflow(input));
        } else if (isArray(format)) {
            configFromStringAndArray(config);
        } else if (format) {
            configFromStringAndFormat(config);
        } else if (isDate(input)) {
            config._d = input;
        } else {
            configFromInput(config);
        }

        return config;
    }

    function configFromInput(config) {
        var input = config._i;
        if (input === undefined) {
            config._d = new Date();
        } else if (isDate(input)) {
            config._d = new Date(+input);
        } else if (typeof input === 'string') {
            configFromString(config);
        } else if (isArray(input)) {
            config._a = map(input.slice(0), function (obj) {
                return parseInt(obj, 10);
            });
            configFromArray(config);
        } else if (typeof(input) === 'object') {
            configFromObject(config);
        } else if (typeof(input) === 'number') {
            // from milliseconds
            config._d = new Date(input);
        } else {
            utils_hooks__hooks.createFromInputFallback(config);
        }
    }

    function createLocalOrUTC (input, format, locale, strict, isUTC) {
        var c = {};

        if (typeof(locale) === 'boolean') {
            strict = locale;
            locale = undefined;
        }
        // object construction must be done this way.
        // https://github.com/moment/moment/issues/1423
        c._isAMomentObject = true;
        c._useUTC = c._isUTC = isUTC;
        c._l = locale;
        c._i = input;
        c._f = format;
        c._strict = strict;

        return createFromConfig(c);
    }

    function local__createLocal (input, format, locale, strict) {
        return createLocalOrUTC(input, format, locale, strict, false);
    }

    var prototypeMin = deprecate(
         'moment().min is deprecated, use moment.min instead. https://github.com/moment/moment/issues/1548',
         function () {
             var other = local__createLocal.apply(null, arguments);
             return other < this ? this : other;
         }
     );

    var prototypeMax = deprecate(
        'moment().max is deprecated, use moment.max instead. https://github.com/moment/moment/issues/1548',
        function () {
            var other = local__createLocal.apply(null, arguments);
            return other > this ? this : other;
        }
    );

    // Pick a moment m from moments so that m[fn](other) is true for all
    // other. This relies on the function fn to be transitive.
    //
    // moments should either be an array of moment objects or an array, whose
    // first element is an array of moment objects.
    function pickBy(fn, moments) {
        var res, i;
        if (moments.length === 1 && isArray(moments[0])) {
            moments = moments[0];
        }
        if (!moments.length) {
            return local__createLocal();
        }
        res = moments[0];
        for (i = 1; i < moments.length; ++i) {
            if (!moments[i].isValid() || moments[i][fn](res)) {
                res = moments[i];
            }
        }
        return res;
    }

    // TODO: Use [].sort instead?
    function min () {
        var args = [].slice.call(arguments, 0);

        return pickBy('isBefore', args);
    }

    function max () {
        var args = [].slice.call(arguments, 0);

        return pickBy('isAfter', args);
    }

    function Duration (duration) {
        var normalizedInput = normalizeObjectUnits(duration),
            years = normalizedInput.year || 0,
            quarters = normalizedInput.quarter || 0,
            months = normalizedInput.month || 0,
            weeks = normalizedInput.week || 0,
            days = normalizedInput.day || 0,
            hours = normalizedInput.hour || 0,
            minutes = normalizedInput.minute || 0,
            seconds = normalizedInput.second || 0,
            milliseconds = normalizedInput.millisecond || 0;

        // representation for dateAddRemove
        this._milliseconds = +milliseconds +
            seconds * 1e3 + // 1000
            minutes * 6e4 + // 1000 * 60
            hours * 36e5; // 1000 * 60 * 60
        // Because of dateAddRemove treats 24 hours as different from a
        // day when working around DST, we need to store them separately
        this._days = +days +
            weeks * 7;
        // It is impossible translate months into days without knowing
        // which months you are are talking about, so we have to store
        // it separately.
        this._months = +months +
            quarters * 3 +
            years * 12;

        this._data = {};

        this._locale = locale_locales__getLocale();

        this._bubble();
    }

    function isDuration (obj) {
        return obj instanceof Duration;
    }

    function offset (token, separator) {
        addFormatToken(token, 0, 0, function () {
            var offset = this.utcOffset();
            var sign = '+';
            if (offset < 0) {
                offset = -offset;
                sign = '-';
            }
            return sign + zeroFill(~~(offset / 60), 2) + separator + zeroFill(~~(offset) % 60, 2);
        });
    }

    offset('Z', ':');
    offset('ZZ', '');

    // PARSING

    addRegexToken('Z',  matchOffset);
    addRegexToken('ZZ', matchOffset);
    addParseToken(['Z', 'ZZ'], function (input, array, config) {
        config._useUTC = true;
        config._tzm = offsetFromString(input);
    });

    // HELPERS

    // timezone chunker
    // '+10:00' > ['10',  '00']
    // '-1530'  > ['-15', '30']
    var chunkOffset = /([\+\-]|\d\d)/gi;

    function offsetFromString(string) {
        var matches = ((string || '').match(matchOffset) || []);
        var chunk   = matches[matches.length - 1] || [];
        var parts   = (chunk + '').match(chunkOffset) || ['-', 0, 0];
        var minutes = +(parts[1] * 60) + toInt(parts[2]);

        return parts[0] === '+' ? minutes : -minutes;
    }

    // Return a moment from input, that is local/utc/zone equivalent to model.
    function cloneWithOffset(input, model) {
        var res, diff;
        if (model._isUTC) {
            res = model.clone();
            diff = (isMoment(input) || isDate(input) ? +input : +local__createLocal(input)) - (+res);
            // Use low-level api, because this fn is low-level api.
            res._d.setTime(+res._d + diff);
            utils_hooks__hooks.updateOffset(res, false);
            return res;
        } else {
            return local__createLocal(input).local();
        }
    }

    function getDateOffset (m) {
        // On Firefox.24 Date#getTimezoneOffset returns a floating point.
        // https://github.com/moment/moment/pull/1871
        return -Math.round(m._d.getTimezoneOffset() / 15) * 15;
    }

    // HOOKS

    // This function will be called whenever a moment is mutated.
    // It is intended to keep the offset in sync with the timezone.
    utils_hooks__hooks.updateOffset = function () {};

    // MOMENTS

    // keepLocalTime = true means only change the timezone, without
    // affecting the local hour. So 5:31:26 +0300 --[utcOffset(2, true)]-->
    // 5:31:26 +0200 It is possible that 5:31:26 doesn't exist with offset
    // +0200, so we adjust the time as needed, to be valid.
    //
    // Keeping the time actually adds/subtracts (one hour)
    // from the actual represented time. That is why we call updateOffset
    // a second time. In case it wants us to change the offset again
    // _changeInProgress == true case, then we have to adjust, because
    // there is no such time in the given timezone.
    function getSetOffset (input, keepLocalTime) {
        var offset = this._offset || 0,
            localAdjust;
        if (input != null) {
            if (typeof input === 'string') {
                input = offsetFromString(input);
            }
            if (Math.abs(input) < 16) {
                input = input * 60;
            }
            if (!this._isUTC && keepLocalTime) {
                localAdjust = getDateOffset(this);
            }
            this._offset = input;
            this._isUTC = true;
            if (localAdjust != null) {
                this.add(localAdjust, 'm');
            }
            if (offset !== input) {
                if (!keepLocalTime || this._changeInProgress) {
                    add_subtract__addSubtract(this, create__createDuration(input - offset, 'm'), 1, false);
                } else if (!this._changeInProgress) {
                    this._changeInProgress = true;
                    utils_hooks__hooks.updateOffset(this, true);
                    this._changeInProgress = null;
                }
            }
            return this;
        } else {
            return this._isUTC ? offset : getDateOffset(this);
        }
    }

    function getSetZone (input, keepLocalTime) {
        if (input != null) {
            if (typeof input !== 'string') {
                input = -input;
            }

            this.utcOffset(input, keepLocalTime);

            return this;
        } else {
            return -this.utcOffset();
        }
    }

    function setOffsetToUTC (keepLocalTime) {
        return this.utcOffset(0, keepLocalTime);
    }

    function setOffsetToLocal (keepLocalTime) {
        if (this._isUTC) {
            this.utcOffset(0, keepLocalTime);
            this._isUTC = false;

            if (keepLocalTime) {
                this.subtract(getDateOffset(this), 'm');
            }
        }
        return this;
    }

    function setOffsetToParsedOffset () {
        if (this._tzm) {
            this.utcOffset(this._tzm);
        } else if (typeof this._i === 'string') {
            this.utcOffset(offsetFromString(this._i));
        }
        return this;
    }

    function hasAlignedHourOffset (input) {
        input = input ? local__createLocal(input).utcOffset() : 0;

        return (this.utcOffset() - input) % 60 === 0;
    }

    function isDaylightSavingTime () {
        return (
            this.utcOffset() > this.clone().month(0).utcOffset() ||
            this.utcOffset() > this.clone().month(5).utcOffset()
        );
    }

    function isDaylightSavingTimeShifted () {
        if (typeof this._isDSTShifted !== 'undefined') {
            return this._isDSTShifted;
        }

        var c = {};

        copyConfig(c, this);
        c = prepareConfig(c);

        if (c._a) {
            var other = c._isUTC ? create_utc__createUTC(c._a) : local__createLocal(c._a);
            this._isDSTShifted = this.isValid() &&
                compareArrays(c._a, other.toArray()) > 0;
        } else {
            this._isDSTShifted = false;
        }

        return this._isDSTShifted;
    }

    function isLocal () {
        return !this._isUTC;
    }

    function isUtcOffset () {
        return this._isUTC;
    }

    function isUtc () {
        return this._isUTC && this._offset === 0;
    }

    var aspNetRegex = /(\-)?(?:(\d*)\.)?(\d+)\:(\d+)(?:\:(\d+)\.?(\d{3})?)?/;

    // from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
    // somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
    var create__isoRegex = /^(-)?P(?:(?:([0-9,.]*)Y)?(?:([0-9,.]*)M)?(?:([0-9,.]*)D)?(?:T(?:([0-9,.]*)H)?(?:([0-9,.]*)M)?(?:([0-9,.]*)S)?)?|([0-9,.]*)W)$/;

    function create__createDuration (input, key) {
        var duration = input,
            // matching against regexp is expensive, do it on demand
            match = null,
            sign,
            ret,
            diffRes;

        if (isDuration(input)) {
            duration = {
                ms : input._milliseconds,
                d  : input._days,
                M  : input._months
            };
        } else if (typeof input === 'number') {
            duration = {};
            if (key) {
                duration[key] = input;
            } else {
                duration.milliseconds = input;
            }
        } else if (!!(match = aspNetRegex.exec(input))) {
            sign = (match[1] === '-') ? -1 : 1;
            duration = {
                y  : 0,
                d  : toInt(match[DATE])        * sign,
                h  : toInt(match[HOUR])        * sign,
                m  : toInt(match[MINUTE])      * sign,
                s  : toInt(match[SECOND])      * sign,
                ms : toInt(match[MILLISECOND]) * sign
            };
        } else if (!!(match = create__isoRegex.exec(input))) {
            sign = (match[1] === '-') ? -1 : 1;
            duration = {
                y : parseIso(match[2], sign),
                M : parseIso(match[3], sign),
                d : parseIso(match[4], sign),
                h : parseIso(match[5], sign),
                m : parseIso(match[6], sign),
                s : parseIso(match[7], sign),
                w : parseIso(match[8], sign)
            };
        } else if (duration == null) {// checks for null or undefined
            duration = {};
        } else if (typeof duration === 'object' && ('from' in duration || 'to' in duration)) {
            diffRes = momentsDifference(local__createLocal(duration.from), local__createLocal(duration.to));

            duration = {};
            duration.ms = diffRes.milliseconds;
            duration.M = diffRes.months;
        }

        ret = new Duration(duration);

        if (isDuration(input) && hasOwnProp(input, '_locale')) {
            ret._locale = input._locale;
        }

        return ret;
    }

    create__createDuration.fn = Duration.prototype;

    function parseIso (inp, sign) {
        // We'd normally use ~~inp for this, but unfortunately it also
        // converts floats to ints.
        // inp may be undefined, so careful calling replace on it.
        var res = inp && parseFloat(inp.replace(',', '.'));
        // apply sign while we're at it
        return (isNaN(res) ? 0 : res) * sign;
    }

    function positiveMomentsDifference(base, other) {
        var res = {milliseconds: 0, months: 0};

        res.months = other.month() - base.month() +
            (other.year() - base.year()) * 12;
        if (base.clone().add(res.months, 'M').isAfter(other)) {
            --res.months;
        }

        res.milliseconds = +other - +(base.clone().add(res.months, 'M'));

        return res;
    }

    function momentsDifference(base, other) {
        var res;
        other = cloneWithOffset(other, base);
        if (base.isBefore(other)) {
            res = positiveMomentsDifference(base, other);
        } else {
            res = positiveMomentsDifference(other, base);
            res.milliseconds = -res.milliseconds;
            res.months = -res.months;
        }

        return res;
    }

    function createAdder(direction, name) {
        return function (val, period) {
            var dur, tmp;
            //invert the arguments, but complain about it
            if (period !== null && !isNaN(+period)) {
                deprecateSimple(name, 'moment().' + name  + '(period, number) is deprecated. Please use moment().' + name + '(number, period).');
                tmp = val; val = period; period = tmp;
            }

            val = typeof val === 'string' ? +val : val;
            dur = create__createDuration(val, period);
            add_subtract__addSubtract(this, dur, direction);
            return this;
        };
    }

    function add_subtract__addSubtract (mom, duration, isAdding, updateOffset) {
        var milliseconds = duration._milliseconds,
            days = duration._days,
            months = duration._months;
        updateOffset = updateOffset == null ? true : updateOffset;

        if (milliseconds) {
            mom._d.setTime(+mom._d + milliseconds * isAdding);
        }
        if (days) {
            get_set__set(mom, 'Date', get_set__get(mom, 'Date') + days * isAdding);
        }
        if (months) {
            setMonth(mom, get_set__get(mom, 'Month') + months * isAdding);
        }
        if (updateOffset) {
            utils_hooks__hooks.updateOffset(mom, days || months);
        }
    }

    var add_subtract__add      = createAdder(1, 'add');
    var add_subtract__subtract = createAdder(-1, 'subtract');

    function moment_calendar__calendar (time, formats) {
        // We want to compare the start of today, vs this.
        // Getting start-of-today depends on whether we're local/utc/offset or not.
        var now = time || local__createLocal(),
            sod = cloneWithOffset(now, this).startOf('day'),
            diff = this.diff(sod, 'days', true),
            format = diff < -6 ? 'sameElse' :
                diff < -1 ? 'lastWeek' :
                diff < 0 ? 'lastDay' :
                diff < 1 ? 'sameDay' :
                diff < 2 ? 'nextDay' :
                diff < 7 ? 'nextWeek' : 'sameElse';
        return this.format(formats && formats[format] || this.localeData().calendar(format, this, local__createLocal(now)));
    }

    function clone () {
        return new Moment(this);
    }

    function isAfter (input, units) {
        var inputMs;
        units = normalizeUnits(typeof units !== 'undefined' ? units : 'millisecond');
        if (units === 'millisecond') {
            input = isMoment(input) ? input : local__createLocal(input);
            return +this > +input;
        } else {
            inputMs = isMoment(input) ? +input : +local__createLocal(input);
            return inputMs < +this.clone().startOf(units);
        }
    }

    function isBefore (input, units) {
        var inputMs;
        units = normalizeUnits(typeof units !== 'undefined' ? units : 'millisecond');
        if (units === 'millisecond') {
            input = isMoment(input) ? input : local__createLocal(input);
            return +this < +input;
        } else {
            inputMs = isMoment(input) ? +input : +local__createLocal(input);
            return +this.clone().endOf(units) < inputMs;
        }
    }

    function isBetween (from, to, units) {
        return this.isAfter(from, units) && this.isBefore(to, units);
    }

    function isSame (input, units) {
        var inputMs;
        units = normalizeUnits(units || 'millisecond');
        if (units === 'millisecond') {
            input = isMoment(input) ? input : local__createLocal(input);
            return +this === +input;
        } else {
            inputMs = +local__createLocal(input);
            return +(this.clone().startOf(units)) <= inputMs && inputMs <= +(this.clone().endOf(units));
        }
    }

    function diff (input, units, asFloat) {
        var that = cloneWithOffset(input, this),
            zoneDelta = (that.utcOffset() - this.utcOffset()) * 6e4,
            delta, output;

        units = normalizeUnits(units);

        if (units === 'year' || units === 'month' || units === 'quarter') {
            output = monthDiff(this, that);
            if (units === 'quarter') {
                output = output / 3;
            } else if (units === 'year') {
                output = output / 12;
            }
        } else {
            delta = this - that;
            output = units === 'second' ? delta / 1e3 : // 1000
                units === 'minute' ? delta / 6e4 : // 1000 * 60
                units === 'hour' ? delta / 36e5 : // 1000 * 60 * 60
                units === 'day' ? (delta - zoneDelta) / 864e5 : // 1000 * 60 * 60 * 24, negate dst
                units === 'week' ? (delta - zoneDelta) / 6048e5 : // 1000 * 60 * 60 * 24 * 7, negate dst
                delta;
        }
        return asFloat ? output : absFloor(output);
    }

    function monthDiff (a, b) {
        // difference in months
        var wholeMonthDiff = ((b.year() - a.year()) * 12) + (b.month() - a.month()),
            // b is in (anchor - 1 month, anchor + 1 month)
            anchor = a.clone().add(wholeMonthDiff, 'months'),
            anchor2, adjust;

        if (b - anchor < 0) {
            anchor2 = a.clone().add(wholeMonthDiff - 1, 'months');
            // linear across the month
            adjust = (b - anchor) / (anchor - anchor2);
        } else {
            anchor2 = a.clone().add(wholeMonthDiff + 1, 'months');
            // linear across the month
            adjust = (b - anchor) / (anchor2 - anchor);
        }

        return -(wholeMonthDiff + adjust);
    }

    utils_hooks__hooks.defaultFormat = 'YYYY-MM-DDTHH:mm:ssZ';

    function toString () {
        return this.clone().locale('en').format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
    }

    function moment_format__toISOString () {
        var m = this.clone().utc();
        if (0 < m.year() && m.year() <= 9999) {
            if ('function' === typeof Date.prototype.toISOString) {
                // native implementation is ~50x faster, use it when we can
                return this.toDate().toISOString();
            } else {
                return formatMoment(m, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
            }
        } else {
            return formatMoment(m, 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
        }
    }

    function format (inputString) {
        var output = formatMoment(this, inputString || utils_hooks__hooks.defaultFormat);
        return this.localeData().postformat(output);
    }

    function from (time, withoutSuffix) {
        if (!this.isValid()) {
            return this.localeData().invalidDate();
        }
        return create__createDuration({to: this, from: time}).locale(this.locale()).humanize(!withoutSuffix);
    }

    function fromNow (withoutSuffix) {
        return this.from(local__createLocal(), withoutSuffix);
    }

    function to (time, withoutSuffix) {
        if (!this.isValid()) {
            return this.localeData().invalidDate();
        }
        return create__createDuration({from: this, to: time}).locale(this.locale()).humanize(!withoutSuffix);
    }

    function toNow (withoutSuffix) {
        return this.to(local__createLocal(), withoutSuffix);
    }

    function locale (key) {
        var newLocaleData;

        if (key === undefined) {
            return this._locale._abbr;
        } else {
            newLocaleData = locale_locales__getLocale(key);
            if (newLocaleData != null) {
                this._locale = newLocaleData;
            }
            return this;
        }
    }

    var lang = deprecate(
        'moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.',
        function (key) {
            if (key === undefined) {
                return this.localeData();
            } else {
                return this.locale(key);
            }
        }
    );

    function localeData () {
        return this._locale;
    }

    function startOf (units) {
        units = normalizeUnits(units);
        // the following switch intentionally omits break keywords
        // to utilize falling through the cases.
        switch (units) {
        case 'year':
            this.month(0);
            /* falls through */
        case 'quarter':
        case 'month':
            this.date(1);
            /* falls through */
        case 'week':
        case 'isoWeek':
        case 'day':
            this.hours(0);
            /* falls through */
        case 'hour':
            this.minutes(0);
            /* falls through */
        case 'minute':
            this.seconds(0);
            /* falls through */
        case 'second':
            this.milliseconds(0);
        }

        // weeks are a special case
        if (units === 'week') {
            this.weekday(0);
        }
        if (units === 'isoWeek') {
            this.isoWeekday(1);
        }

        // quarters are also special
        if (units === 'quarter') {
            this.month(Math.floor(this.month() / 3) * 3);
        }

        return this;
    }

    function endOf (units) {
        units = normalizeUnits(units);
        if (units === undefined || units === 'millisecond') {
            return this;
        }
        return this.startOf(units).add(1, (units === 'isoWeek' ? 'week' : units)).subtract(1, 'ms');
    }

    function to_type__valueOf () {
        return +this._d - ((this._offset || 0) * 60000);
    }

    function unix () {
        return Math.floor(+this / 1000);
    }

    function toDate () {
        return this._offset ? new Date(+this) : this._d;
    }

    function toArray () {
        var m = this;
        return [m.year(), m.month(), m.date(), m.hour(), m.minute(), m.second(), m.millisecond()];
    }

    function toObject () {
        var m = this;
        return {
            years: m.year(),
            months: m.month(),
            date: m.date(),
            hours: m.hours(),
            minutes: m.minutes(),
            seconds: m.seconds(),
            milliseconds: m.milliseconds()
        };
    }

    function moment_valid__isValid () {
        return valid__isValid(this);
    }

    function parsingFlags () {
        return extend({}, getParsingFlags(this));
    }

    function invalidAt () {
        return getParsingFlags(this).overflow;
    }

    addFormatToken(0, ['gg', 2], 0, function () {
        return this.weekYear() % 100;
    });

    addFormatToken(0, ['GG', 2], 0, function () {
        return this.isoWeekYear() % 100;
    });

    function addWeekYearFormatToken (token, getter) {
        addFormatToken(0, [token, token.length], 0, getter);
    }

    addWeekYearFormatToken('gggg',     'weekYear');
    addWeekYearFormatToken('ggggg',    'weekYear');
    addWeekYearFormatToken('GGGG',  'isoWeekYear');
    addWeekYearFormatToken('GGGGG', 'isoWeekYear');

    // ALIASES

    addUnitAlias('weekYear', 'gg');
    addUnitAlias('isoWeekYear', 'GG');

    // PARSING

    addRegexToken('G',      matchSigned);
    addRegexToken('g',      matchSigned);
    addRegexToken('GG',     match1to2, match2);
    addRegexToken('gg',     match1to2, match2);
    addRegexToken('GGGG',   match1to4, match4);
    addRegexToken('gggg',   match1to4, match4);
    addRegexToken('GGGGG',  match1to6, match6);
    addRegexToken('ggggg',  match1to6, match6);

    addWeekParseToken(['gggg', 'ggggg', 'GGGG', 'GGGGG'], function (input, week, config, token) {
        week[token.substr(0, 2)] = toInt(input);
    });

    addWeekParseToken(['gg', 'GG'], function (input, week, config, token) {
        week[token] = utils_hooks__hooks.parseTwoDigitYear(input);
    });

    // HELPERS

    function weeksInYear(year, dow, doy) {
        return weekOfYear(local__createLocal([year, 11, 31 + dow - doy]), dow, doy).week;
    }

    // MOMENTS

    function getSetWeekYear (input) {
        var year = weekOfYear(this, this.localeData()._week.dow, this.localeData()._week.doy).year;
        return input == null ? year : this.add((input - year), 'y');
    }

    function getSetISOWeekYear (input) {
        var year = weekOfYear(this, 1, 4).year;
        return input == null ? year : this.add((input - year), 'y');
    }

    function getISOWeeksInYear () {
        return weeksInYear(this.year(), 1, 4);
    }

    function getWeeksInYear () {
        var weekInfo = this.localeData()._week;
        return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
    }

    addFormatToken('Q', 0, 0, 'quarter');

    // ALIASES

    addUnitAlias('quarter', 'Q');

    // PARSING

    addRegexToken('Q', match1);
    addParseToken('Q', function (input, array) {
        array[MONTH] = (toInt(input) - 1) * 3;
    });

    // MOMENTS

    function getSetQuarter (input) {
        return input == null ? Math.ceil((this.month() + 1) / 3) : this.month((input - 1) * 3 + this.month() % 3);
    }

    addFormatToken('D', ['DD', 2], 'Do', 'date');

    // ALIASES

    addUnitAlias('date', 'D');

    // PARSING

    addRegexToken('D',  match1to2);
    addRegexToken('DD', match1to2, match2);
    addRegexToken('Do', function (isStrict, locale) {
        return isStrict ? locale._ordinalParse : locale._ordinalParseLenient;
    });

    addParseToken(['D', 'DD'], DATE);
    addParseToken('Do', function (input, array) {
        array[DATE] = toInt(input.match(match1to2)[0], 10);
    });

    // MOMENTS

    var getSetDayOfMonth = makeGetSet('Date', true);

    addFormatToken('d', 0, 'do', 'day');

    addFormatToken('dd', 0, 0, function (format) {
        return this.localeData().weekdaysMin(this, format);
    });

    addFormatToken('ddd', 0, 0, function (format) {
        return this.localeData().weekdaysShort(this, format);
    });

    addFormatToken('dddd', 0, 0, function (format) {
        return this.localeData().weekdays(this, format);
    });

    addFormatToken('e', 0, 0, 'weekday');
    addFormatToken('E', 0, 0, 'isoWeekday');

    // ALIASES

    addUnitAlias('day', 'd');
    addUnitAlias('weekday', 'e');
    addUnitAlias('isoWeekday', 'E');

    // PARSING

    addRegexToken('d',    match1to2);
    addRegexToken('e',    match1to2);
    addRegexToken('E',    match1to2);
    addRegexToken('dd',   matchWord);
    addRegexToken('ddd',  matchWord);
    addRegexToken('dddd', matchWord);

    addWeekParseToken(['dd', 'ddd', 'dddd'], function (input, week, config) {
        var weekday = config._locale.weekdaysParse(input);
        // if we didn't get a weekday name, mark the date as invalid
        if (weekday != null) {
            week.d = weekday;
        } else {
            getParsingFlags(config).invalidWeekday = input;
        }
    });

    addWeekParseToken(['d', 'e', 'E'], function (input, week, config, token) {
        week[token] = toInt(input);
    });

    // HELPERS

    function parseWeekday(input, locale) {
        if (typeof input !== 'string') {
            return input;
        }

        if (!isNaN(input)) {
            return parseInt(input, 10);
        }

        input = locale.weekdaysParse(input);
        if (typeof input === 'number') {
            return input;
        }

        return null;
    }

    // LOCALES

    var defaultLocaleWeekdays = 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_');
    function localeWeekdays (m) {
        return this._weekdays[m.day()];
    }

    var defaultLocaleWeekdaysShort = 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_');
    function localeWeekdaysShort (m) {
        return this._weekdaysShort[m.day()];
    }

    var defaultLocaleWeekdaysMin = 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_');
    function localeWeekdaysMin (m) {
        return this._weekdaysMin[m.day()];
    }

    function localeWeekdaysParse (weekdayName) {
        var i, mom, regex;

        this._weekdaysParse = this._weekdaysParse || [];

        for (i = 0; i < 7; i++) {
            // make the regex if we don't have it already
            if (!this._weekdaysParse[i]) {
                mom = local__createLocal([2000, 1]).day(i);
                regex = '^' + this.weekdays(mom, '') + '|^' + this.weekdaysShort(mom, '') + '|^' + this.weekdaysMin(mom, '');
                this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
            }
            // test the regex
            if (this._weekdaysParse[i].test(weekdayName)) {
                return i;
            }
        }
    }

    // MOMENTS

    function getSetDayOfWeek (input) {
        var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
        if (input != null) {
            input = parseWeekday(input, this.localeData());
            return this.add(input - day, 'd');
        } else {
            return day;
        }
    }

    function getSetLocaleDayOfWeek (input) {
        var weekday = (this.day() + 7 - this.localeData()._week.dow) % 7;
        return input == null ? weekday : this.add(input - weekday, 'd');
    }

    function getSetISODayOfWeek (input) {
        // behaves the same as moment#day except
        // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
        // as a setter, sunday should belong to the previous week.
        return input == null ? this.day() || 7 : this.day(this.day() % 7 ? input : input - 7);
    }

    addFormatToken('H', ['HH', 2], 0, 'hour');
    addFormatToken('h', ['hh', 2], 0, function () {
        return this.hours() % 12 || 12;
    });

    function meridiem (token, lowercase) {
        addFormatToken(token, 0, 0, function () {
            return this.localeData().meridiem(this.hours(), this.minutes(), lowercase);
        });
    }

    meridiem('a', true);
    meridiem('A', false);

    // ALIASES

    addUnitAlias('hour', 'h');

    // PARSING

    function matchMeridiem (isStrict, locale) {
        return locale._meridiemParse;
    }

    addRegexToken('a',  matchMeridiem);
    addRegexToken('A',  matchMeridiem);
    addRegexToken('H',  match1to2);
    addRegexToken('h',  match1to2);
    addRegexToken('HH', match1to2, match2);
    addRegexToken('hh', match1to2, match2);

    addParseToken(['H', 'HH'], HOUR);
    addParseToken(['a', 'A'], function (input, array, config) {
        config._isPm = config._locale.isPM(input);
        config._meridiem = input;
    });
    addParseToken(['h', 'hh'], function (input, array, config) {
        array[HOUR] = toInt(input);
        getParsingFlags(config).bigHour = true;
    });

    // LOCALES

    function localeIsPM (input) {
        // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
        // Using charAt should be more compatible.
        return ((input + '').toLowerCase().charAt(0) === 'p');
    }

    var defaultLocaleMeridiemParse = /[ap]\.?m?\.?/i;
    function localeMeridiem (hours, minutes, isLower) {
        if (hours > 11) {
            return isLower ? 'pm' : 'PM';
        } else {
            return isLower ? 'am' : 'AM';
        }
    }


    // MOMENTS

    // Setting the hour should keep the time, because the user explicitly
    // specified which hour he wants. So trying to maintain the same hour (in
    // a new timezone) makes sense. Adding/subtracting hours does not follow
    // this rule.
    var getSetHour = makeGetSet('Hours', true);

    addFormatToken('m', ['mm', 2], 0, 'minute');

    // ALIASES

    addUnitAlias('minute', 'm');

    // PARSING

    addRegexToken('m',  match1to2);
    addRegexToken('mm', match1to2, match2);
    addParseToken(['m', 'mm'], MINUTE);

    // MOMENTS

    var getSetMinute = makeGetSet('Minutes', false);

    addFormatToken('s', ['ss', 2], 0, 'second');

    // ALIASES

    addUnitAlias('second', 's');

    // PARSING

    addRegexToken('s',  match1to2);
    addRegexToken('ss', match1to2, match2);
    addParseToken(['s', 'ss'], SECOND);

    // MOMENTS

    var getSetSecond = makeGetSet('Seconds', false);

    addFormatToken('S', 0, 0, function () {
        return ~~(this.millisecond() / 100);
    });

    addFormatToken(0, ['SS', 2], 0, function () {
        return ~~(this.millisecond() / 10);
    });

    addFormatToken(0, ['SSS', 3], 0, 'millisecond');
    addFormatToken(0, ['SSSS', 4], 0, function () {
        return this.millisecond() * 10;
    });
    addFormatToken(0, ['SSSSS', 5], 0, function () {
        return this.millisecond() * 100;
    });
    addFormatToken(0, ['SSSSSS', 6], 0, function () {
        return this.millisecond() * 1000;
    });
    addFormatToken(0, ['SSSSSSS', 7], 0, function () {
        return this.millisecond() * 10000;
    });
    addFormatToken(0, ['SSSSSSSS', 8], 0, function () {
        return this.millisecond() * 100000;
    });
    addFormatToken(0, ['SSSSSSSSS', 9], 0, function () {
        return this.millisecond() * 1000000;
    });


    // ALIASES

    addUnitAlias('millisecond', 'ms');

    // PARSING

    addRegexToken('S',    match1to3, match1);
    addRegexToken('SS',   match1to3, match2);
    addRegexToken('SSS',  match1to3, match3);

    var token;
    for (token = 'SSSS'; token.length <= 9; token += 'S') {
        addRegexToken(token, matchUnsigned);
    }

    function parseMs(input, array) {
        array[MILLISECOND] = toInt(('0.' + input) * 1000);
    }

    for (token = 'S'; token.length <= 9; token += 'S') {
        addParseToken(token, parseMs);
    }
    // MOMENTS

    var getSetMillisecond = makeGetSet('Milliseconds', false);

    addFormatToken('z',  0, 0, 'zoneAbbr');
    addFormatToken('zz', 0, 0, 'zoneName');

    // MOMENTS

    function getZoneAbbr () {
        return this._isUTC ? 'UTC' : '';
    }

    function getZoneName () {
        return this._isUTC ? 'Coordinated Universal Time' : '';
    }

    var momentPrototype__proto = Moment.prototype;

    momentPrototype__proto.add          = add_subtract__add;
    momentPrototype__proto.calendar     = moment_calendar__calendar;
    momentPrototype__proto.clone        = clone;
    momentPrototype__proto.diff         = diff;
    momentPrototype__proto.endOf        = endOf;
    momentPrototype__proto.format       = format;
    momentPrototype__proto.from         = from;
    momentPrototype__proto.fromNow      = fromNow;
    momentPrototype__proto.to           = to;
    momentPrototype__proto.toNow        = toNow;
    momentPrototype__proto.get          = getSet;
    momentPrototype__proto.invalidAt    = invalidAt;
    momentPrototype__proto.isAfter      = isAfter;
    momentPrototype__proto.isBefore     = isBefore;
    momentPrototype__proto.isBetween    = isBetween;
    momentPrototype__proto.isSame       = isSame;
    momentPrototype__proto.isValid      = moment_valid__isValid;
    momentPrototype__proto.lang         = lang;
    momentPrototype__proto.locale       = locale;
    momentPrototype__proto.localeData   = localeData;
    momentPrototype__proto.max          = prototypeMax;
    momentPrototype__proto.min          = prototypeMin;
    momentPrototype__proto.parsingFlags = parsingFlags;
    momentPrototype__proto.set          = getSet;
    momentPrototype__proto.startOf      = startOf;
    momentPrototype__proto.subtract     = add_subtract__subtract;
    momentPrototype__proto.toArray      = toArray;
    momentPrototype__proto.toObject     = toObject;
    momentPrototype__proto.toDate       = toDate;
    momentPrototype__proto.toISOString  = moment_format__toISOString;
    momentPrototype__proto.toJSON       = moment_format__toISOString;
    momentPrototype__proto.toString     = toString;
    momentPrototype__proto.unix         = unix;
    momentPrototype__proto.valueOf      = to_type__valueOf;

    // Year
    momentPrototype__proto.year       = getSetYear;
    momentPrototype__proto.isLeapYear = getIsLeapYear;

    // Week Year
    momentPrototype__proto.weekYear    = getSetWeekYear;
    momentPrototype__proto.isoWeekYear = getSetISOWeekYear;

    // Quarter
    momentPrototype__proto.quarter = momentPrototype__proto.quarters = getSetQuarter;

    // Month
    momentPrototype__proto.month       = getSetMonth;
    momentPrototype__proto.daysInMonth = getDaysInMonth;

    // Week
    momentPrototype__proto.week           = momentPrototype__proto.weeks        = getSetWeek;
    momentPrototype__proto.isoWeek        = momentPrototype__proto.isoWeeks     = getSetISOWeek;
    momentPrototype__proto.weeksInYear    = getWeeksInYear;
    momentPrototype__proto.isoWeeksInYear = getISOWeeksInYear;

    // Day
    momentPrototype__proto.date       = getSetDayOfMonth;
    momentPrototype__proto.day        = momentPrototype__proto.days             = getSetDayOfWeek;
    momentPrototype__proto.weekday    = getSetLocaleDayOfWeek;
    momentPrototype__proto.isoWeekday = getSetISODayOfWeek;
    momentPrototype__proto.dayOfYear  = getSetDayOfYear;

    // Hour
    momentPrototype__proto.hour = momentPrototype__proto.hours = getSetHour;

    // Minute
    momentPrototype__proto.minute = momentPrototype__proto.minutes = getSetMinute;

    // Second
    momentPrototype__proto.second = momentPrototype__proto.seconds = getSetSecond;

    // Millisecond
    momentPrototype__proto.millisecond = momentPrototype__proto.milliseconds = getSetMillisecond;

    // Offset
    momentPrototype__proto.utcOffset            = getSetOffset;
    momentPrototype__proto.utc                  = setOffsetToUTC;
    momentPrototype__proto.local                = setOffsetToLocal;
    momentPrototype__proto.parseZone            = setOffsetToParsedOffset;
    momentPrototype__proto.hasAlignedHourOffset = hasAlignedHourOffset;
    momentPrototype__proto.isDST                = isDaylightSavingTime;
    momentPrototype__proto.isDSTShifted         = isDaylightSavingTimeShifted;
    momentPrototype__proto.isLocal              = isLocal;
    momentPrototype__proto.isUtcOffset          = isUtcOffset;
    momentPrototype__proto.isUtc                = isUtc;
    momentPrototype__proto.isUTC                = isUtc;

    // Timezone
    momentPrototype__proto.zoneAbbr = getZoneAbbr;
    momentPrototype__proto.zoneName = getZoneName;

    // Deprecations
    momentPrototype__proto.dates  = deprecate('dates accessor is deprecated. Use date instead.', getSetDayOfMonth);
    momentPrototype__proto.months = deprecate('months accessor is deprecated. Use month instead', getSetMonth);
    momentPrototype__proto.years  = deprecate('years accessor is deprecated. Use year instead', getSetYear);
    momentPrototype__proto.zone   = deprecate('moment().zone is deprecated, use moment().utcOffset instead. https://github.com/moment/moment/issues/1779', getSetZone);

    var momentPrototype = momentPrototype__proto;

    function moment__createUnix (input) {
        return local__createLocal(input * 1000);
    }

    function moment__createInZone () {
        return local__createLocal.apply(null, arguments).parseZone();
    }

    var defaultCalendar = {
        sameDay : '[Today at] LT',
        nextDay : '[Tomorrow at] LT',
        nextWeek : 'dddd [at] LT',
        lastDay : '[Yesterday at] LT',
        lastWeek : '[Last] dddd [at] LT',
        sameElse : 'L'
    };

    function locale_calendar__calendar (key, mom, now) {
        var output = this._calendar[key];
        return typeof output === 'function' ? output.call(mom, now) : output;
    }

    var defaultLongDateFormat = {
        LTS  : 'h:mm:ss A',
        LT   : 'h:mm A',
        L    : 'MM/DD/YYYY',
        LL   : 'MMMM D, YYYY',
        LLL  : 'MMMM D, YYYY h:mm A',
        LLLL : 'dddd, MMMM D, YYYY h:mm A'
    };

    function longDateFormat (key) {
        var format = this._longDateFormat[key],
            formatUpper = this._longDateFormat[key.toUpperCase()];

        if (format || !formatUpper) {
            return format;
        }

        this._longDateFormat[key] = formatUpper.replace(/MMMM|MM|DD|dddd/g, function (val) {
            return val.slice(1);
        });

        return this._longDateFormat[key];
    }

    var defaultInvalidDate = 'Invalid date';

    function invalidDate () {
        return this._invalidDate;
    }

    var defaultOrdinal = '%d';
    var defaultOrdinalParse = /\d{1,2}/;

    function ordinal (number) {
        return this._ordinal.replace('%d', number);
    }

    function preParsePostFormat (string) {
        return string;
    }

    var defaultRelativeTime = {
        future : 'in %s',
        past   : '%s ago',
        s  : 'a few seconds',
        m  : 'a minute',
        mm : '%d minutes',
        h  : 'an hour',
        hh : '%d hours',
        d  : 'a day',
        dd : '%d days',
        M  : 'a month',
        MM : '%d months',
        y  : 'a year',
        yy : '%d years'
    };

    function relative__relativeTime (number, withoutSuffix, string, isFuture) {
        var output = this._relativeTime[string];
        return (typeof output === 'function') ?
            output(number, withoutSuffix, string, isFuture) :
            output.replace(/%d/i, number);
    }

    function pastFuture (diff, output) {
        var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
        return typeof format === 'function' ? format(output) : format.replace(/%s/i, output);
    }

    function locale_set__set (config) {
        var prop, i;
        for (i in config) {
            prop = config[i];
            if (typeof prop === 'function') {
                this[i] = prop;
            } else {
                this['_' + i] = prop;
            }
        }
        // Lenient ordinal parsing accepts just a number in addition to
        // number + (possibly) stuff coming from _ordinalParseLenient.
        this._ordinalParseLenient = new RegExp(this._ordinalParse.source + '|' + (/\d{1,2}/).source);
    }

    var prototype__proto = Locale.prototype;

    prototype__proto._calendar       = defaultCalendar;
    prototype__proto.calendar        = locale_calendar__calendar;
    prototype__proto._longDateFormat = defaultLongDateFormat;
    prototype__proto.longDateFormat  = longDateFormat;
    prototype__proto._invalidDate    = defaultInvalidDate;
    prototype__proto.invalidDate     = invalidDate;
    prototype__proto._ordinal        = defaultOrdinal;
    prototype__proto.ordinal         = ordinal;
    prototype__proto._ordinalParse   = defaultOrdinalParse;
    prototype__proto.preparse        = preParsePostFormat;
    prototype__proto.postformat      = preParsePostFormat;
    prototype__proto._relativeTime   = defaultRelativeTime;
    prototype__proto.relativeTime    = relative__relativeTime;
    prototype__proto.pastFuture      = pastFuture;
    prototype__proto.set             = locale_set__set;

    // Month
    prototype__proto.months       =        localeMonths;
    prototype__proto._months      = defaultLocaleMonths;
    prototype__proto.monthsShort  =        localeMonthsShort;
    prototype__proto._monthsShort = defaultLocaleMonthsShort;
    prototype__proto.monthsParse  =        localeMonthsParse;

    // Week
    prototype__proto.week = localeWeek;
    prototype__proto._week = defaultLocaleWeek;
    prototype__proto.firstDayOfYear = localeFirstDayOfYear;
    prototype__proto.firstDayOfWeek = localeFirstDayOfWeek;

    // Day of Week
    prototype__proto.weekdays       =        localeWeekdays;
    prototype__proto._weekdays      = defaultLocaleWeekdays;
    prototype__proto.weekdaysMin    =        localeWeekdaysMin;
    prototype__proto._weekdaysMin   = defaultLocaleWeekdaysMin;
    prototype__proto.weekdaysShort  =        localeWeekdaysShort;
    prototype__proto._weekdaysShort = defaultLocaleWeekdaysShort;
    prototype__proto.weekdaysParse  =        localeWeekdaysParse;

    // Hours
    prototype__proto.isPM = localeIsPM;
    prototype__proto._meridiemParse = defaultLocaleMeridiemParse;
    prototype__proto.meridiem = localeMeridiem;

    function lists__get (format, index, field, setter) {
        var locale = locale_locales__getLocale();
        var utc = create_utc__createUTC().set(setter, index);
        return locale[field](utc, format);
    }

    function list (format, index, field, count, setter) {
        if (typeof format === 'number') {
            index = format;
            format = undefined;
        }

        format = format || '';

        if (index != null) {
            return lists__get(format, index, field, setter);
        }

        var i;
        var out = [];
        for (i = 0; i < count; i++) {
            out[i] = lists__get(format, i, field, setter);
        }
        return out;
    }

    function lists__listMonths (format, index) {
        return list(format, index, 'months', 12, 'month');
    }

    function lists__listMonthsShort (format, index) {
        return list(format, index, 'monthsShort', 12, 'month');
    }

    function lists__listWeekdays (format, index) {
        return list(format, index, 'weekdays', 7, 'day');
    }

    function lists__listWeekdaysShort (format, index) {
        return list(format, index, 'weekdaysShort', 7, 'day');
    }

    function lists__listWeekdaysMin (format, index) {
        return list(format, index, 'weekdaysMin', 7, 'day');
    }

    locale_locales__getSetGlobalLocale('en', {
        ordinalParse: /\d{1,2}(th|st|nd|rd)/,
        ordinal : function (number) {
            var b = number % 10,
                output = (toInt(number % 100 / 10) === 1) ? 'th' :
                (b === 1) ? 'st' :
                (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
            return number + output;
        }
    });

    // Side effect imports
    utils_hooks__hooks.lang = deprecate('moment.lang is deprecated. Use moment.locale instead.', locale_locales__getSetGlobalLocale);
    utils_hooks__hooks.langData = deprecate('moment.langData is deprecated. Use moment.localeData instead.', locale_locales__getLocale);

    var mathAbs = Math.abs;

    function duration_abs__abs () {
        var data           = this._data;

        this._milliseconds = mathAbs(this._milliseconds);
        this._days         = mathAbs(this._days);
        this._months       = mathAbs(this._months);

        data.milliseconds  = mathAbs(data.milliseconds);
        data.seconds       = mathAbs(data.seconds);
        data.minutes       = mathAbs(data.minutes);
        data.hours         = mathAbs(data.hours);
        data.months        = mathAbs(data.months);
        data.years         = mathAbs(data.years);

        return this;
    }

    function duration_add_subtract__addSubtract (duration, input, value, direction) {
        var other = create__createDuration(input, value);

        duration._milliseconds += direction * other._milliseconds;
        duration._days         += direction * other._days;
        duration._months       += direction * other._months;

        return duration._bubble();
    }

    // supports only 2.0-style add(1, 's') or add(duration)
    function duration_add_subtract__add (input, value) {
        return duration_add_subtract__addSubtract(this, input, value, 1);
    }

    // supports only 2.0-style subtract(1, 's') or subtract(duration)
    function duration_add_subtract__subtract (input, value) {
        return duration_add_subtract__addSubtract(this, input, value, -1);
    }

    function absCeil (number) {
        if (number < 0) {
            return Math.floor(number);
        } else {
            return Math.ceil(number);
        }
    }

    function bubble () {
        var milliseconds = this._milliseconds;
        var days         = this._days;
        var months       = this._months;
        var data         = this._data;
        var seconds, minutes, hours, years, monthsFromDays;

        // if we have a mix of positive and negative values, bubble down first
        // check: https://github.com/moment/moment/issues/2166
        if (!((milliseconds >= 0 && days >= 0 && months >= 0) ||
                (milliseconds <= 0 && days <= 0 && months <= 0))) {
            milliseconds += absCeil(monthsToDays(months) + days) * 864e5;
            days = 0;
            months = 0;
        }

        // The following code bubbles up values, see the tests for
        // examples of what that means.
        data.milliseconds = milliseconds % 1000;

        seconds           = absFloor(milliseconds / 1000);
        data.seconds      = seconds % 60;

        minutes           = absFloor(seconds / 60);
        data.minutes      = minutes % 60;

        hours             = absFloor(minutes / 60);
        data.hours        = hours % 24;

        days += absFloor(hours / 24);

        // convert days to months
        monthsFromDays = absFloor(daysToMonths(days));
        months += monthsFromDays;
        days -= absCeil(monthsToDays(monthsFromDays));

        // 12 months -> 1 year
        years = absFloor(months / 12);
        months %= 12;

        data.days   = days;
        data.months = months;
        data.years  = years;

        return this;
    }

    function daysToMonths (days) {
        // 400 years have 146097 days (taking into account leap year rules)
        // 400 years have 12 months === 4800
        return days * 4800 / 146097;
    }

    function monthsToDays (months) {
        // the reverse of daysToMonths
        return months * 146097 / 4800;
    }

    function as (units) {
        var days;
        var months;
        var milliseconds = this._milliseconds;

        units = normalizeUnits(units);

        if (units === 'month' || units === 'year') {
            days   = this._days   + milliseconds / 864e5;
            months = this._months + daysToMonths(days);
            return units === 'month' ? months : months / 12;
        } else {
            // handle milliseconds separately because of floating point math errors (issue #1867)
            days = this._days + Math.round(monthsToDays(this._months));
            switch (units) {
                case 'week'   : return days / 7     + milliseconds / 6048e5;
                case 'day'    : return days         + milliseconds / 864e5;
                case 'hour'   : return days * 24    + milliseconds / 36e5;
                case 'minute' : return days * 1440  + milliseconds / 6e4;
                case 'second' : return days * 86400 + milliseconds / 1000;
                // Math.floor prevents floating point math errors here
                case 'millisecond': return Math.floor(days * 864e5) + milliseconds;
                default: throw new Error('Unknown unit ' + units);
            }
        }
    }

    // TODO: Use this.as('ms')?
    function duration_as__valueOf () {
        return (
            this._milliseconds +
            this._days * 864e5 +
            (this._months % 12) * 2592e6 +
            toInt(this._months / 12) * 31536e6
        );
    }

    function makeAs (alias) {
        return function () {
            return this.as(alias);
        };
    }

    var asMilliseconds = makeAs('ms');
    var asSeconds      = makeAs('s');
    var asMinutes      = makeAs('m');
    var asHours        = makeAs('h');
    var asDays         = makeAs('d');
    var asWeeks        = makeAs('w');
    var asMonths       = makeAs('M');
    var asYears        = makeAs('y');

    function duration_get__get (units) {
        units = normalizeUnits(units);
        return this[units + 's']();
    }

    function makeGetter(name) {
        return function () {
            return this._data[name];
        };
    }

    var milliseconds = makeGetter('milliseconds');
    var seconds      = makeGetter('seconds');
    var minutes      = makeGetter('minutes');
    var hours        = makeGetter('hours');
    var days         = makeGetter('days');
    var months       = makeGetter('months');
    var years        = makeGetter('years');

    function weeks () {
        return absFloor(this.days() / 7);
    }

    var round = Math.round;
    var thresholds = {
        s: 45,  // seconds to minute
        m: 45,  // minutes to hour
        h: 22,  // hours to day
        d: 26,  // days to month
        M: 11   // months to year
    };

    // helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
    function substituteTimeAgo(string, number, withoutSuffix, isFuture, locale) {
        return locale.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
    }

    function duration_humanize__relativeTime (posNegDuration, withoutSuffix, locale) {
        var duration = create__createDuration(posNegDuration).abs();
        var seconds  = round(duration.as('s'));
        var minutes  = round(duration.as('m'));
        var hours    = round(duration.as('h'));
        var days     = round(duration.as('d'));
        var months   = round(duration.as('M'));
        var years    = round(duration.as('y'));

        var a = seconds < thresholds.s && ['s', seconds]  ||
                minutes === 1          && ['m']           ||
                minutes < thresholds.m && ['mm', minutes] ||
                hours   === 1          && ['h']           ||
                hours   < thresholds.h && ['hh', hours]   ||
                days    === 1          && ['d']           ||
                days    < thresholds.d && ['dd', days]    ||
                months  === 1          && ['M']           ||
                months  < thresholds.M && ['MM', months]  ||
                years   === 1          && ['y']           || ['yy', years];

        a[2] = withoutSuffix;
        a[3] = +posNegDuration > 0;
        a[4] = locale;
        return substituteTimeAgo.apply(null, a);
    }

    // This function allows you to set a threshold for relative time strings
    function duration_humanize__getSetRelativeTimeThreshold (threshold, limit) {
        if (thresholds[threshold] === undefined) {
            return false;
        }
        if (limit === undefined) {
            return thresholds[threshold];
        }
        thresholds[threshold] = limit;
        return true;
    }

    function humanize (withSuffix) {
        var locale = this.localeData();
        var output = duration_humanize__relativeTime(this, !withSuffix, locale);

        if (withSuffix) {
            output = locale.pastFuture(+this, output);
        }

        return locale.postformat(output);
    }

    var iso_string__abs = Math.abs;

    function iso_string__toISOString() {
        // for ISO strings we do not use the normal bubbling rules:
        //  * milliseconds bubble up until they become hours
        //  * days do not bubble at all
        //  * months bubble up until they become years
        // This is because there is no context-free conversion between hours and days
        // (think of clock changes)
        // and also not between days and months (28-31 days per month)
        var seconds = iso_string__abs(this._milliseconds) / 1000;
        var days         = iso_string__abs(this._days);
        var months       = iso_string__abs(this._months);
        var minutes, hours, years;

        // 3600 seconds -> 60 minutes -> 1 hour
        minutes           = absFloor(seconds / 60);
        hours             = absFloor(minutes / 60);
        seconds %= 60;
        minutes %= 60;

        // 12 months -> 1 year
        years  = absFloor(months / 12);
        months %= 12;


        // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
        var Y = years;
        var M = months;
        var D = days;
        var h = hours;
        var m = minutes;
        var s = seconds;
        var total = this.asSeconds();

        if (!total) {
            // this is the same as C#'s (Noda) and python (isodate)...
            // but not other JS (goog.date)
            return 'P0D';
        }

        return (total < 0 ? '-' : '') +
            'P' +
            (Y ? Y + 'Y' : '') +
            (M ? M + 'M' : '') +
            (D ? D + 'D' : '') +
            ((h || m || s) ? 'T' : '') +
            (h ? h + 'H' : '') +
            (m ? m + 'M' : '') +
            (s ? s + 'S' : '');
    }

    var duration_prototype__proto = Duration.prototype;

    duration_prototype__proto.abs            = duration_abs__abs;
    duration_prototype__proto.add            = duration_add_subtract__add;
    duration_prototype__proto.subtract       = duration_add_subtract__subtract;
    duration_prototype__proto.as             = as;
    duration_prototype__proto.asMilliseconds = asMilliseconds;
    duration_prototype__proto.asSeconds      = asSeconds;
    duration_prototype__proto.asMinutes      = asMinutes;
    duration_prototype__proto.asHours        = asHours;
    duration_prototype__proto.asDays         = asDays;
    duration_prototype__proto.asWeeks        = asWeeks;
    duration_prototype__proto.asMonths       = asMonths;
    duration_prototype__proto.asYears        = asYears;
    duration_prototype__proto.valueOf        = duration_as__valueOf;
    duration_prototype__proto._bubble        = bubble;
    duration_prototype__proto.get            = duration_get__get;
    duration_prototype__proto.milliseconds   = milliseconds;
    duration_prototype__proto.seconds        = seconds;
    duration_prototype__proto.minutes        = minutes;
    duration_prototype__proto.hours          = hours;
    duration_prototype__proto.days           = days;
    duration_prototype__proto.weeks          = weeks;
    duration_prototype__proto.months         = months;
    duration_prototype__proto.years          = years;
    duration_prototype__proto.humanize       = humanize;
    duration_prototype__proto.toISOString    = iso_string__toISOString;
    duration_prototype__proto.toString       = iso_string__toISOString;
    duration_prototype__proto.toJSON         = iso_string__toISOString;
    duration_prototype__proto.locale         = locale;
    duration_prototype__proto.localeData     = localeData;

    // Deprecations
    duration_prototype__proto.toIsoString = deprecate('toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)', iso_string__toISOString);
    duration_prototype__proto.lang = lang;

    // Side effect imports

    addFormatToken('X', 0, 0, 'unix');
    addFormatToken('x', 0, 0, 'valueOf');

    // PARSING

    addRegexToken('x', matchSigned);
    addRegexToken('X', matchTimestamp);
    addParseToken('X', function (input, array, config) {
        config._d = new Date(parseFloat(input, 10) * 1000);
    });
    addParseToken('x', function (input, array, config) {
        config._d = new Date(toInt(input));
    });

    // Side effect imports


    utils_hooks__hooks.version = '2.10.6';

    setHookCallback(local__createLocal);

    utils_hooks__hooks.fn                    = momentPrototype;
    utils_hooks__hooks.min                   = min;
    utils_hooks__hooks.max                   = max;
    utils_hooks__hooks.utc                   = create_utc__createUTC;
    utils_hooks__hooks.unix                  = moment__createUnix;
    utils_hooks__hooks.months                = lists__listMonths;
    utils_hooks__hooks.isDate                = isDate;
    utils_hooks__hooks.locale                = locale_locales__getSetGlobalLocale;
    utils_hooks__hooks.invalid               = valid__createInvalid;
    utils_hooks__hooks.duration              = create__createDuration;
    utils_hooks__hooks.isMoment              = isMoment;
    utils_hooks__hooks.weekdays              = lists__listWeekdays;
    utils_hooks__hooks.parseZone             = moment__createInZone;
    utils_hooks__hooks.localeData            = locale_locales__getLocale;
    utils_hooks__hooks.isDuration            = isDuration;
    utils_hooks__hooks.monthsShort           = lists__listMonthsShort;
    utils_hooks__hooks.weekdaysMin           = lists__listWeekdaysMin;
    utils_hooks__hooks.defineLocale          = defineLocale;
    utils_hooks__hooks.weekdaysShort         = lists__listWeekdaysShort;
    utils_hooks__hooks.normalizeUnits        = normalizeUnits;
    utils_hooks__hooks.relativeTimeThreshold = duration_humanize__getSetRelativeTimeThreshold;

    var _moment = utils_hooks__hooks;

    return _moment;

}));
},{}],5:[function(require,module,exports){
// ModelJS v0.2.1
//
// https://github.com/curran/model
// 
// Last updated by Curran Kelleher March 2015
//
// Includes contributions from
//
//  * github.com/mathiasrw
//  * github.com/bollwyvl
//  * github.com/adle29
//  * github.com/Hypercubed
//
// The module is defined inside an immediately invoked function
// so it does not pullute the global namespace.
(function(){

  // Returns a debounced version of the given function.
  // See http://underscorejs.org/#debounce
  function debounce(callback){
    var queued = false;
    return function () {
      if(!queued){
        queued = true;
        setTimeout(function () {
          queued = false;
          callback();
        }, 0);
      }
    };
  }

  // Returns true if all elements of the given array are defined, false otherwise.
  function allAreDefined(arr){
    return !arr.some(function (d) {
      return typeof d === 'undefined' || d === null;
    });
  }

  // The constructor function, accepting default values.
  function Model(defaults){

    // Make sure "new" is always used,
    // so we can use "instanceof" to check if something is a Model.
    if (!(this instanceof Model)) {
      return new Model(defaults);
    }

    // `model` is the public API object returned from invoking `new Model()`.
    var model = this,

        // The internal stored values for tracked properties. { property -> value }
        values = {},

        // The callback functions for each tracked property. { property -> [callback] }
        listeners = {},

        // The set of tracked properties. { property -> true }
        trackedProperties = {};

    // The functional reactive "when" operator.
    //
    //  * `properties` An array of property names (can also be a single property string).
    //  * `callback` A callback function that is called:
    //    * with property values as arguments, ordered corresponding to the properties array,
    //    * only if all specified properties have values,
    //    * once for initialization,
    //    * whenever one or more specified properties change,
    //    * on the next tick of the JavaScript event loop after properties change,
    //    * only once as a result of one or more synchronous changes to dependency properties.
    function when(properties, callback, thisArg){
      
      // Make sure the default `this` becomes 
      // the object you called `.on` on.
      thisArg = thisArg || this;

      // Handle either an array or a single string.
      properties = (properties instanceof Array) ? properties : [properties];

      // This function will trigger the callback to be invoked.
      var listener = debounce(function (){
        var args = properties.map(function(property){
          return values[property];
        });
        if(allAreDefined(args)){
          callback.apply(thisArg, args);
        }
      });

      // Trigger the callback once for initialization.
      listener();
      
      // Trigger the callback whenever specified properties change.
      properties.forEach(function(property){
        on(property, listener);
      });

      // Return this function so it can be removed later with `model.cancel(listener)`.
      return listener;
    }

    // Adds a change listener for a given property with Backbone-like behavior.
    // Similar to http://backbonejs.org/#Events-on
    function on(property, callback, thisArg){
      thisArg = thisArg || this;
      getListeners(property).push(callback);
      track(property, thisArg);
    }
    
    // Gets or creates the array of listener functions for a given property.
    function getListeners(property){
      return listeners[property] || (listeners[property] = []);
    }

    // Tracks a property if it is not already tracked.
    function track(property, thisArg){
      if(!(property in trackedProperties)){
        trackedProperties[property] = true;
        values[property] = model[property];
        Object.defineProperty(model, property, {
          get: function () { return values[property]; },
          set: function(newValue) {
            var oldValue = values[property];
            values[property] = newValue;
            getListeners(property).forEach(function(callback){
              callback.call(thisArg, newValue, oldValue);
            });
          }
        });
      }
    }

    // Cancels a listener returned by a call to `model.when(...)`.
    function cancel(listener){
      for(var property in listeners){
        off(property, listener);
      }
    }

    // Removes a change listener added using `on`.
    function off(property, callback){
      listeners[property] = listeners[property].filter(function (listener) {
        return listener !== callback;
      });
    }

    // Sets all of the given values on the model.
    // `newValues` is an object { property -> value }.
    function set(newValues){
      for(var property in newValues){
        model[property] = newValues[property];
      }
    }

    // Transfer defaults passed into the constructor to the model.
    set(defaults);

    // Public API.
    model.when = when;
    model.cancel = cancel;
    model.on = on;
    model.off = off;
    model.set = set;
  }
  
  // Model.None is A representation for an optional Model property that is not specified.
  // Model property values of null or undefined are not propagated through
  // to when() listeners. If you want the when() listener to be invoked, but
  // some of the properties may or may not be defined, you can use Model.None.
  // This way, the when() listener is invoked even when the value is Model.None.
  // This allows the "when" approach to support optional properties.
  //
  // For example usage, see this scatter plot example with optional size and color fields:
  // http://bl.ocks.org/curran/9e04ccfebeb84bcdc76c
  //
  // Inspired by Scala's Option type.
  // See http://alvinalexander.com/scala/using-scala-option-some-none-idiom-function-java-null
  Model.None = "__NONE__";

  // Support AMD (RequireJS), CommonJS (Node), and browser globals.
  // Inspired by https://github.com/umdjs/umd
  if (typeof define === "function" && define.amd) {
    define([], function () { return Model; });
  } else if (typeof exports === "object") {
    module.exports = Model;
  } else {
    this.Model = Model;
  }
})();

},{}],6:[function(require,module,exports){
(function (global){
// This module encapsulates reusable reactive flows
// common to many D3-based visualizations.
//
// Curran Kelleher June 2015
var Model = require("model-js");
var d3 = (typeof window !== "undefined" ? window['d3'] : typeof global !== "undefined" ? global['d3'] : null);

// The returned public API object, containing functions that take as input
// a Model.js model, and as a side effect add reactive flows within that model.
var reactivis = {};

// This value is used for optionally defined public properties
var None = Model.None;

// Adds a public property to a model.
// This makes the property configurable via the Chiasm configuration.
function addPublicProperty(model, property, defaultValue){
  if(!model.publicProperties){
    model.publicProperties = [];
  }
  model.publicProperties.push(property);
  model[property] = defaultValue;
}

// Constructs an SVG element as a child of the `container` element.
// Makes the SVG size and location update with respect to the `box` property.
// Also adds a G element as a child of the SVG element, for visualizations.
reactivis.svg = function(model){

  // Create the SVG element from the container DOM element.
  model.when("container", function (container) {

    // Use CSS `position: relative` so that setting properties
    // `left` and `top` will position the SVG relative to the Chiasm container.
    model.svg = d3.select(container).append("svg")
      .style("position", "relative");
  });

  // Adjust the SVG based on the `box` property.
  model.when(["svg", "box"], function (svg, box) {

    // Set the CSS `left` and `top` properties to move the
    // SVG to `(box.x, box.y)` relative to its container.
    svg
      .style("left", box.x + "px")
      .style("top", box.y + "px")
      .attr("width", box.width)
      .attr("height", box.height);

    // Use negative margins to eliminate the SVG space taken up
    // in the layout flow. This is an ugly solution, but the alternatives
    // don't work - setting position:absolute doesn't work when the
    // Chiasm container is statically positioned.
    // http://stackoverflow.com/questions/13722095/how-to-remove-whitespace-that-appears-after-relative-positioning-an-element-with
    svg
      .style("margin-right", "-" + box.width + "px")
      .style("margin-bottom", "-" + box.height + "px");
  });

  // Create the SVG group that will contain the visualization.
  model.when("svg", function (svg) {
    model.g = svg.append("g");
  });
};

// Encapsulates conventional D3 margins.
// See http://bl.ocks.org/mbostock/3019563
reactivis.margin = function(model){

  // Set up the default margin.
  addPublicProperty(model, "margin",{
    "top": 32,
    "right": 2,
    "bottom": 40,
    "left": 47
  });

  // Compute the inner box from the outer box and margin.
  model.when(["box", "margin"], function (box, margin) {
    model.width = box.width - margin.left - margin.right;
    model.height = box.height - margin.top - margin.bottom;
  });

  // Adjust the translation of the group based on the margin.
  model.when(["g", "margin"], function (g, margin) {
    g.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  });

  // TODO change layout such that size is not added as a property.
  addPublicProperty(model, "size", 1);
};

// Adds a text title at the top of the visualization.
reactivis.title = function(model){

  addPublicProperty(model, "title", "");
  addPublicProperty(model, "titleOffset", -0.3);

  // Create the title text element.
  model.when("g", function (g){
    model.titleText = g.append("text").attr("class", "title-text");
  });

  // Center the title text when width changes.
  model.when(["titleText", "width"], function (titleText, width) {
    titleText.attr("x", width / 2);
  });

  // Update the title text based on the public `title` property.
  model.when(["titleText", "title"], function (titleText, title){
    titleText.text(title);
  });

  // Update the title text offset.
  model.titleOffset = 1;
  model.when(["titleText", "titleOffset"], function (titleText, titleOffset){
    titleText.attr("dy", titleOffset + "em");
  });
};

reactivis.color = function(model){

  addPublicProperty(model, "colorColumn", None);
  addPublicProperty(model, "colorDomain", None);
  addPublicProperty(model, "colorRange", None);
  addPublicProperty(model, "colorDefault", "black");

  // Set up the color scale.
  model.when(["colorDefault", "colorDomain", "colorRange"],
      function (colorDefault, colorDomain, colorRange){
    if(colorDomain !== None && colorRange !== None){
      model.colorScale = d3.scale.ordinal()
        .domain(colorDomain)
        .range(colorRange);
    } else {
      model.colorScale = None;
    }
  });

  // Set up the color evaluation function.
  model.when(["colorColumn", "colorScale", "colorDefault"],
      function(colorColumn, colorScale, colorDefault){
    if(colorColumn !== None && colorScale !== None){
      model.color = function(d){ return colorScale(d[colorColumn]); };
    }
    else {
      model.color = colorDefault;
    }
  });
};

// Generates a function for getting the X value.
reactivis.xAccessor = function(model){
  addPublicProperty(model, "xColumn", None);
  model.when(["xColumn"], function (xColumn) {
    if(xColumn !== None){
      model.xAccessor = function (d) { return d[xColumn]; };
    }
  });
};

// Generates a function for getting the Y value.
reactivis.yAccessor = function(model){
  addPublicProperty(model, "yColumn", None);
  model.when(["yColumn"], function (yColumn) {
    if(yColumn !== None){
      model.yAccessor = function (d) { return d[yColumn]; };
    }
  });
};

// A lookup table for scale constructors based on their type.
var scaleConstructors = {
  linear: d3.scale.linear,
  time: d3.time.scale,
  ordinalBands: d3.scale.ordinal
};

// A generalized function for computing the domain of scales, used for both X and Y scales.
function computeDomain(data, scaleType, accessor, domainMin, domainMax) {
  if(scaleType === "linear" || scaleType === "time"){
    if(domainMin === None && domainMax === None){
      return d3.extent(data, accessor);
    } else {
      if(domainMin === None){
        domainMin = d3.min(data, accessor);
      }
      if(domainMax === None){
        domainMax = d3.max(data, accessor);
      }
      return [domainMin, domainMax];
    }
  } else if (scaleType === "ordinalBands"){
    return data.map(accessor);
  }
}

// Sets up the X scale.
reactivis.xScale = function(model, scaleType){

  // Make the scale type a public property so it is configurable at runtime.
  // Example use case: dynamically switching between linear and log scales.
  addPublicProperty(model, "xScaleType", scaleType);

  // Allow the API client to optionally specify fixed min and max values.
  // Relevant only for quantitative scales (linear, time).
  addPublicProperty(model, "xDomainMin", None);
  addPublicProperty(model, "xDomainMax", None);

  // The padding between range bands (e.g. the space between bars in a bar chart).
  // Relevant only for ordinal scales.
  addPublicProperty(model, "xRangePadding", 0.1);

  // Compute the domain of the X column.
  model.when(["data", "xScaleType", "xAccessor", "xDomainMin", "xDomainMax"],
      function (data, xScaleType, xAccessor, xDomainMin, xDomainMax) {
    
    // TODO figure out a way to reduce duplication of property names in this code.
    model.xDomain = computeDomain(data, xScaleType, xAccessor, xDomainMin, xDomainMax);

  });

  // Compute the X scale.
  model.when(["xScaleType", "xDomain", "width", "xRangePadding"],
      function (xScaleType, xDomain, width, xRangePadding) {
    var scale = scaleConstructors[xScaleType]().domain(xDomain);
    if(xScaleType === "ordinalBands"){
      scale.rangeRoundBands([0, width], xRangePadding);
    } else {
      scale.range([0, width]);
    }
    model.xScale = scale;
  });

  // Generate a function for getting the scaled X value.
  model.when(["data", "xScale", "xAccessor"], function (data, xScale, xAccessor) {
    model.x = function (d) { return xScale(xAccessor(d)); };
  });
};

// Sets up the Y scale.
reactivis.yScale = function(model){

  // TODO unify code between X and Y scales.

  // Allow the API client to optionally specify fixed min and max values.
  addPublicProperty(model, "yDomainMin", None);
  addPublicProperty(model, "yDomainMax", None);
  addPublicProperty(model, "yScaleType", "linear");
  model.when(["data", "yScaleType", "yAccessor", "yDomainMin", "yDomainMax"],
      function (data, yScaleType, yAccessor, yDomainMin, yDomainMax) {

    // TODO figure out a way to reduce duplication of property names in this code.
    model.yDomain = computeDomain(data, yScaleType, yAccessor, yDomainMin, yDomainMax);
  });

  // Compute the Y scale.
  model.when(["yDomain", "height"], function (yDomain, height) {
    model.yScale = d3.scale.linear().domain(yDomain).range([height, 0]);
  });

  // Generate a function for getting the scaled Y value.
  model.when(["yScale", "yAccessor"], function (yScale, yAccessor) {
    model.y = function (d) { return yScale(yAccessor(d)); };
  });
};

// Adds the X axis and its label text.
reactivis.xAxis = function(model){

  addPublicProperty(model, "xAxisLabel", "");
  addPublicProperty(model, "xAxisLabelOffset", 1.9);

  // Set up the X axis.
  model.when("g", function (g) {
    model.xAxisG = g.append("g").attr("class", "x axis");
    model.xAxisText = model.xAxisG.append("text").style("text-anchor", "middle");
  });

  // Move the X axis label based on its specified offset.
  model.when(["xAxisText", "xAxisLabelOffset"], function (xAxisText, xAxisLabelOffset){
    xAxisText.attr("dy", xAxisLabelOffset + "em");
  });

  // Update the X axis transform when height changes.
  model.when(["xAxisG", "height"], function (xAxisG, height) {
    xAxisG.attr("transform", "translate(0," + height + ")");
  });

  // Center the X axis label when width changes.
  model.when(["xAxisText", "width"], function (xAxisText, width) {
    xAxisText.attr("x", width / 2);
  });

  // Update the X axis based on the X scale.
  model.when(["xAxisG", "xScale"], function (xAxisG, xScale) {
    xAxisG.call(d3.svg.axis().orient("bottom").scale(xScale));
  });

  // Update X axis label.
  model.when(["xAxisText", "xAxisLabel"], function (xAxisText, xAxisLabel) {
    xAxisText.text(xAxisLabel);
  });
};

// Adds the Y axis and its label text.
reactivis.yAxis = function(model){

  // The text shown as the axis label.
  addPublicProperty(model, "yAxisLabel", "");

  // The left-right offset of the axis label, unit is CSS "em"s.
  addPublicProperty(model, "yAxisLabelOffset", 1.4);

  // Set up the Y axis.
  model.when("g", function (g) {
    model.yAxisG = g.append("g").attr("class", "y axis");
    model.yAxisText = model.yAxisG.append("text")
      .style("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("y", 0);
  });
  
  // Move the Y axis label based on its specified offset.
  model.when(["yAxisText", "yAxisLabelOffset"], function (yAxisText, yAxisLabelOffset){
    yAxisText.attr("dy", "-" + yAxisLabelOffset + "em");
  });

  // Center the Y axis label when height changes.
  model.when(["yAxisText", "height"], function (yAxisText, height) {
    yAxisText.attr("x", -height / 2);
  });

  // Update Y axis label.
  model.when(["yAxisText", "yAxisLabel"], function (yAxisText, yAxisLabel) {
    yAxisText.text(yAxisLabel);
  });

  // Update the Y axis based on the Y scale.
  model.when(["yAxisG", "yScale"], function (yAxisG, yScale) {
    yAxisG.call(d3.svg.axis().orient("left").scale(yScale));
  });
};

// Expose the addPublicProperty function, as it is a useful utility
// function for visualizations that build on top of reactivis.
reactivis.addPublicProperty = addPublicProperty;

module.exports = reactivis;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"model-js":5}],7:[function(require,module,exports){
(function (global){
// This file contains the core implementation of Chiasm, which is a
// runtime environment and plugin architecture for interactive visualizations.
//
// The main purpose of this module is to maintain synchronization between a dynamic
// JSON configuration structure and a set of components instantiated by plugins.
// Dynamic configuration changes (diffs) are detected by Chiasm and executed as
// component lifecycle actions that
//
//  * create components (plugin instances)
//  * set component properties
//  * unset component properties (reset default values when a property is removed from the configuration)
//  * destroy components
//
// Draws from previous work found at
//
//  * https://github.com/curran/model-contrib/blob/gh-pages/modules/overseer.js
//  * https://github.com/curran/overseer/blob/master/src/overseer.js
//
// By Curran Kelleher June 2015
var Model = require("model-js");
var _ = (typeof window !== "undefined" ? window['_'] : typeof global !== "undefined" ? global['_'] : null);

// All error message strings are kept track of here.
var ErrorMessages = {

  // This error occurs when a property is set via the configuration
  // or is declared as a public property but does not have a default value.
  // Every property set via the configuration must be declared by
  // the corresponding plugin as a public property, and must have a default value.
  // Without this strict enforcement , the behavior of Chiasm is unstable in the case that
  // a property is set, then the property is later removed from the configuration (unset).
  // The default values tell Chiasm what value to use after a property is unset.
  // Without default values, unsetting a property would have no effect, which would
  // make the state of the components out of sync with the configuration after an unset.
  missingDefault: "Default value for public property '${ property }' " +
                  "not specified for component with alias '${ alias }'.",

  // This error occurs when a component is requested via `chiasm.getComponent()`,
  // but it fails to appear after a timeout elapses (`chiasm.timeout`).
  componentTimeout: "Component with alias '${ alias }' does not exist " +
                    "after timeout of ${ seconds } seconds exceeded."
};

// Creates a new Error object with a message derived from the
// error message template corresponding to the given type.
function createError(type, values){
  return Error(_.template(ErrorMessages[type])(values));
}

// Methods for creating and serializing Action objects.
// These are used to express differences between configurations.
//
// Actions encapsulate all lifecycle events required to create,
// manipulate, and tear down components.
//
// The primary purpose of Action objects is to support editing the
// JSON application configuration at runtime. To avoid reloading the
// entire configuration in response to each change, the difference between
// two subsequent configurations is computed and expressed as an array of
// Action objects, then the Action objects are applied to the runtime environment.
//
// Based on previous work found at:
// https://github.com/curran/overseer/blob/master/src/action.js
//
// This architecture lays the foundation for undo/redo and real-time synchronization.
//
// For synchronization, these Action objects should be directly translatable
// into ShareJS operations for JSON transformation, documented at
// https://github.com/ottypes/json0
var Action = {
  create: function (alias, plugin) {
    return { method: "create", alias: alias, plugin: plugin };
  },
  destroy: function (alias) {
    return { method: "destroy", alias: alias };
  },
  set: function (alias, property, value) {
    return { method: "set", alias: alias, property: property, value: value };
  },
  unset: function (alias, property) {
    return { method: "unset", alias: alias, property: property};
  },
  toString: function (action) {
    return [
      action.method + "(",
      action.alias,
      action.property !== undefined ? ", " + action.property : "",
      action.value !== undefined ? ", " + action.value : "",
      action.plugin !== undefined ? ", " + action.plugin : "",
      ")"
    ].join("");
  }
};

// This function computes the difference ("diff") between two configurations.
// The diff is returned as an array of Action objects.
//
// Based on pervious work found at
// https://github.com/curran/overseer/blob/master/src/configDiff.js
function configDiff(oldConfig, newConfig){
  var actions = [],
      newAliases = _.keys(newConfig),
      oldAliases = _.keys(oldConfig);

  // Handle removed aliases.
  _.difference(oldAliases, newAliases).forEach(function (alias) {
    actions.push(Action.destroy(alias));
  });

  // Handle updated aliases.
  newAliases.forEach(function (alias) {
    var oldModel = alias in oldConfig ? oldConfig[alias].state || {} : null,
        newModel = newConfig[alias].state || {},
        oldProperties = oldModel ? _.keys(oldModel) : [],
        newProperties = _.keys(newModel),
        oldPlugin = alias in oldConfig ? oldConfig[alias].plugin : null,
        newPlugin = newConfig[alias].plugin;

    // Handle changed plugin.
    if(oldModel && (oldPlugin !== newPlugin)){

      // Destroy the old component that used the old plugin.
      actions.push(Action.destroy(alias));

      // Create a new component that uses the new plugin.
      oldModel = null;

      // Set all properties on the newly created component.
      oldProperties = [];
    }

    // Handle added aliases.
    if(!oldModel){
      actions.push(Action.create(alias, newConfig[alias].plugin));
    }

    // Handle added properties.
    _.difference(newProperties, oldProperties).forEach(function (property) {
      actions.push(Action.set(alias, property, newModel[property]));
    });

    // Handle removed properties.
    _.difference(oldProperties, newProperties).forEach(function (property) {
      actions.push(Action.unset(alias, property));
    });

    // Handle updated properties.
    _.intersection(newProperties, oldProperties).forEach(function (property) {
      if(!_.isEqual(oldModel[property], newModel[property])){
        actions.push(Action.set(alias, property, newModel[property]));
      }
    });
  });
  return actions;
}

// An asynchronous batch queue for processing Actions using Promises.
// Draws from https://www.promisejs.org/patterns/#all
// The argument `process` is a function that takes as input
// an item to process, and returns a promise.
function Queue(process){

  // This promise is replaced as each item is processed.
  var ready = Promise.resolve(null);

  // This function queues a batch of items and returns a promise for that batch.
  return function(items){
    return new Promise(function(resolve, reject){
      items.forEach(function(item){
        ready = ready.then(function() {
          return process(item);
        });
      });
      ready = ready.then(resolve, reject);
    });
  };
}

// The Chiasm constructor function exposed by this AMD module.
//
// Accepts a single argument `container`, a DOM element, typically a div.
// Components created by plugins will append their own DOM elements to this container,
// and will remove them when they are destroyed.
function Chiasm(container){

  // This is the public API object returned by the constructor.
  var chiasm = Model({

    // `plugins` is An object for setting up plugins before loading a configuration.
    // Chiasm first looks here for plugins, then if a plugin is not found here
    // it is dynamically loaded at runtime using RequireJS where the plugin name
    // corresponds to an AMD module name or arbitrary URL.
    //
    // * Keys are plugin names.
    // * Values are plugin implementations, which are constructor functions for
    //   runtime components. A plugin constructor function takes as input a reference
    //   to the chiasm instance, and yields as output a ModelJS model with the following properties:
    //   * `publicProperties` An array of property names. This is the list of properties that
    //     are configurable via the JSON configuration structure. Each property listed here
    //     must have a default value present on the freshly constructed component.
    //   * `destroy` (optional) A function that frees all resources allocated by the component,
    //     e.g. removing any DOM elements added to the Chiasm container, and removing event listeners.
    //
    // See additional plugin documentation at https://github.com/curran/chiasm/wiki
    plugins: {},

    // The JSON configuration object encapsulating application state.
    //
    //   * Keys are component aliases.
    //   * Values are objects with the following properties:
    //     * `plugin` - The name of the plugin.
    //     * `state` - An object representing the state of a component, where
    //       * Keys are component property names
    //       * Values are component property values
    config: {},

    // The timeout (in milliseconds) used for plugin loading and getComponent().
    // The default timeout is 10 seconds.
    timeout: 10000,

    // Expose the container DOM element to plugins so they can
    // append their own DOM elements to it.
    container: container
  });

  // The runtime components created by plugins.
  //
  // * Keys are component aliases.
  // * Values are components constructed by plugins, which are ModelJS models.
  var components = {};

  // This object stores default values for public properties.
  // These are the values present when the component is constructed.
  // The default values are used when processing "unset" actions, which restore
  // default values to components when properties are removed from the configuration.
  //
  // * Keys are component aliases.
  // * Values are objects where
  //   * Keys are component property names from `component.publicProperties`
  //   * Values are default component property values
  var defaults = {};

  // These methods unpack Action objects and invoke corresponding
  // functions that execute them. Each method returns a promise.
  var methods = {
    create: function (action) {
      return create(action.alias, action.plugin);
    },
    destroy: function (action) {
      return destroy(action.alias);
    },
    set: function (action) {
      return set(action.alias, action.property, action.value);
    },
    unset: function (action) {
      return unset(action.alias, action.property);
    }
  };

  // An asynchronous FIFO queue for processing actions.
  // This is used as essentially a synchronization lock, so multiple synchronous calls
  // to setConfig() do not cause conflicting overlapping asynchronous action sequences.
  var queue = Queue(function (action){
    return methods[action.method](action);
  });

  // This object contains the callbacks that respond to changes in
  // public properties of components. These are stored so they
  // can be removed from components when the they are destroyed.
  var callbacks = {};

  // This flag is set to true when "set" actions are being processed,
  // so Chiasm can distinguish between changes originating from setConfig()
  // and changes originating from components, possibly via user interactions.
  var settingProperty = false;

  // This flag is set to true inside setConfig() while `chiasm.config` is being set.
  // This is so changes do not get counted twice when invoking setConfig(),
  // and it also works if API clients set `chiasm.config = ...`.
  var settingConfig = false;

  // Gets a component by alias, returns a promise.
  // This is asynchronous because the component may not be instantiated
  // when this is called, but may be in the process of loading. In this case the
  // function polls for existence of the component until the timeout has elapsed.
  function getComponent(alias){
    var startTime = Date.now();
    return new Promise(function(resolve, reject){
      (function poll(){
        if(alias === 'self') {
          resolve(chiasm);
        } else if(alias in components){
          resolve(components[alias]);
        } else if ((Date.now() - startTime) < chiasm.timeout){
          setTimeout(poll, 1);
        } else {
          reject(createError("componentTimeout", {
            alias: alias,
            seconds: chiasm.timeout / 1000
          }));
        }
      }());
    });
  }

  // Loads a plugin by name, returns a promise.
  function loadPlugin(plugin){
    return new Promise(function(resolve, reject){

      // If the plugin has been set up in `chiasm.plugins`, use it.
      if(plugin in chiasm.plugins){
        resolve(chiasm.plugins[plugin]);
      } else if (typeof System !== 'undefined' && typeof System.amdRequire !== 'undefined') {
        System.amdRequire([plugin], resolve, reject);
      }
    });
  }

  // Applies a "create" action.
  function create(alias, plugin){
    return new Promise(function(resolve, reject){
      loadPlugin(plugin).then(function (constructor) {

        try {

          // Construct the component using the plugin, passing the chiasm instance.
          var component = new constructor(chiasm);

          // Store a reference to the component.
          components[alias] = component;

          // Create a defaults object for population with values for each public property.
          defaults[alias] = {};

          // Handle public properties.
          if("publicProperties" in component){

            // Validate that all public properties have default values and store them.
            component.publicProperties.forEach(function(property){

              // Require that all declared public properties have a default value.
              if(component[property] === undefined){

                // Throw an exception in order to break out of the current control flow.
                throw createError("missingDefault", {
                  property: property,
                  alias: alias
                });
              }

              // Store default values for public properties.
              defaults[alias][property] = component[property];
            });

            // Propagate changes originating from components into the configuration.
            callbacks[alias] = component.publicProperties.map(function(property){

              var callback = function(newValue){

                // If this change did not originate from setConfig(),
                // but rather originated from the component, possibly via user interaction,
                // then propagate it into the configuration.
                if(!settingProperty){

                  // If no state is tracked, create the state object.
                  if(!("state" in chiasm.config[alias])){
                    chiasm.config[alias].state = {};
                  }

                  // Surgically change `chiasm.config` so that the diff computation will yield
                  // no actions. Without this step, the update would propagate from the
                  // component to the config and then back again unnecessarily.
                  chiasm.config[alias].state[property] = newValue;

                  // This assignment will notify any callbacks that the config has changed,
                  // (e.g. the config editor), but the config diff will yield no actions to execute.
                  chiasm.config = chiasm.config;
                }
              };

              // Listen for property changes on the component model.
              component.on(property, callback);

              // Store the callbacks for each property so they can be removed later,
              // when the component is destroyed.
              return {
                property: property,
                callback: callback
              };
            });
          }
          resolve();
        } catch (err) {

          // Catch the error for missing default values and
          // pass it to the Promise reject function.
          reject(err);
        }
      }, reject);
    });
  }

  // Applies a "destroy" action.
  function destroy(alias){
    return new Promise(function(resolve, reject){
      getComponent(alias).then(function(component){

        // Remove public property callbacks.
        if(alias in callbacks){
          callbacks[alias].forEach(function(cb){
            component.off(cb.property, cb.callback);
          });
          delete callbacks[alias];
        }

        // Invoke component.destroy(), which is part of the plugin API.
        if("destroy" in component){
          component.destroy();
        }

        // Remove the internal reference to the component.
        delete components[alias];

        // Remove stored default values that were stored.
        delete defaults[alias];

        resolve();
      }, reject);
    });
  }

  // Applies a "set" action.
  function set(alias, property, value) {
    return new Promise(function(resolve, reject){
      getComponent(alias).then(function(component){

        // Make sure that every property configured through "set" actions
        // is a public property and has a default value. Without this strict enforcement,
        // the behavior of Chiasm with "unset" actions is unstable.
        if( defaults[alias] && defaults[alias][property] !== undefined ){

          // Set this flag so Chiasm knows the change originated from setConfig().
          settingProperty = true;

          // Set the property on the component. Since the component is a ModelJS model,
          // simply setting the value like this will propagate the change through the
          // reactive data dependency graph of the component
          component[property] = value;

          settingProperty = false;
          resolve();
        } else {
          reject(createError("missingDefault", {
            property: property,
            alias: alias
          }));
        }
      }, reject);
    });
  }

  // Applies an "unset" action.
  function unset(alias, property, callback) {
    return new Promise(function(resolve, reject){
      getComponent(alias).then(function(component){

        // Set this flag so Chiasm knows the change originated from setConfig().
        settingProperty = true;

        component[property] = defaults[alias][property];

        settingProperty = false;
        resolve();
      }, reject);
    });
  }

  // Handle setting configuration via `chiasm.config = ...`.
  // This will work, but any errors that occur will be thrown as exceptions.
  chiasm.on("config", function(newConfig, oldConfig){
    if(!settingConfig){
      setConfig(newConfig, oldConfig);
    }
  });

  // Sets the Chiasm configuration, returns a promise.
  function setConfig(newConfig, oldConfig){

    // The second argument, oldConfig, is optional, and
    // defaults to the current value of `chiasm.config`.
    oldConfig = oldConfig || chiasm.config;

    // Compute the difference between the old and new configurations.
    var actions = configDiff(oldConfig, newConfig);

    // If there are any changes, execute them.
    if(actions.length > 0){

      // Store the new config.
      settingConfig = true;
      chiasm.config = newConfig;
      settingConfig = false;

      // Queue the actions from the diff to be executed in sequence,
      // and return the promise for this batch of actions.
      return queue(actions);

    } else {

      // If there are no actions to execute, return a resolved promise.
      return Promise.resolve(null);
    }
  }

  // Expose public methods.
  chiasm.getComponent = getComponent;
  chiasm.setConfig = setConfig;

  // This function checks if a component exists.
  // Necessary for code coverage in unit tests.
  chiasm.componentExists = function(alias){
    return alias in components;
  };

  return chiasm;
}

// Expose configDiff and Action for unit tests.
Chiasm.configDiff = configDiff;
Chiasm.Action = Action;

// Return the Chiasm constructor function as this AMD module.
module.exports = Chiasm;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"model-js":5}],8:[function(require,module,exports){
(function (global){
// A reusable bar chart module.
// Draws from D3 bar chart example http://bl.ocks.org/mbostock/3885304
// Curran Kelleher June 2015
var reactivis = require("reactivis");
var d3 = (typeof window !== "undefined" ? window['d3'] : typeof global !== "undefined" ? global['d3'] : null);
var Model = require("model-js");
var _ = (typeof window !== "undefined" ? window['_'] : typeof global !== "undefined" ? global['_'] : null);

var None = Model.None;

// The constructor function, accepting default values.
function BarChart(chiasm) {

  // Create a Model instance for the bar chart.
  // This will serve as the public API for the visualization.
  var model = Model();

  model.container = chiasm.container;

  reactivis.svg(model);
  reactivis.title(model);
  reactivis.margin(model);

  reactivis.xAccessor(model);
  reactivis.xScale(model, "ordinalBands");
  reactivis.xAxis(model);

  reactivis.yAccessor(model);
  reactivis.yScale(model);
  reactivis.yAxis(model);

  reactivis.color(model);

  // Add an SVG group to contain the line.
  model.when("g", function (g) {
    model.barsG = g.append("g");
  });

  // Draw the bars.
  model.when(["barsG", "data", "x", "y", "xScale", "height", "color", "xAccessor"],
      function (barsG, data, x, y, xScale, height, color, xAccessor){
    var bars = barsG.selectAll("rect").data(data, xAccessor);
    bars.enter().append("rect");
    bars
      .attr("x", x)
      .attr("y", y)
      .attr("width", xScale.rangeBand())
      .attr("height", function(d) { return height - y(d); })
      .attr("fill", color);
    bars.exit().remove();
  });

  model.destroy = function(){
    if(model.container && model.svg){
      model.svg.node().innerHTML = "";
      model.container.removeChild(model.svg.node());
    }
  };

  return model;
}

module.exports = BarChart;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"model-js":5,"reactivis":6}],9:[function(require,module,exports){
(function (global){
// This module implements CSV file loading.
// by Curran Kelleher April 2015
var d3 = (typeof window !== "undefined" ? window['d3'] : typeof global !== "undefined" ? global['d3'] : null);
var Model = require("model-js");

function csvLoader() {

  var model = Model({
    publicProperties: [ "csvPath", "numericColumns", "timeColumns" ],
    csvPath: Model.None,
    numericColumns: [],
    timeColumns: []
  });

  model.when(["csvPath", "numericColumns", "timeColumns"],
      function (csvPath, numericColumns, timeColumns){

    if(csvPath !== Model.None){

      d3.csv(csvPath, function(d){

        // Parse strings into numbers for numeric columns.
        numericColumns.forEach(function(column){
          d[column] = +d[column];
        });

        // Parse strings into dates for time columns.
        timeColumns.forEach(function(column){
          d[column] = new Date(d[column]);
        });

        return d;
      }, function(err, data){
        model.data = data;
      });
    }
  });

  return model;
}
module.exports = csvLoader;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"model-js":5}],10:[function(require,module,exports){
// This plugin exposes in-memory filtering and aggregation data transformations.

// Use the data reduction algorithms via the NPM package found at
// https://github.com/curran/data-reduction
var dataReduction = require("data-reduction");

var Model = require("model-js");

function DataReduction() {

  var model = Model({
    publicProperties: [ "filter", "aggregate" ],
    filter: Model.None,
    aggregate: Model.None
  });

  model.when(["filter", "aggregate", "dataIn"], function (filter, aggregate, dataIn) {
    var options = {};

    if(filter !== Model.None){
      options.filter = filter;
    }
    if(aggregate !== Model.None){
      options.aggregate = aggregate;
    }
    model.dataOut = dataReduction(dataIn, options).data;
  });

  return model;
}
module.exports = DataReduction;

},{"data-reduction":2,"model-js":5}],11:[function(require,module,exports){
// This plugin exposes schema-based automatic DSV data set parsing from
// https://github.com/curran/data-reduction
// Curran Kelleher July 2015
var dsvDataset = require("dsv-dataset");

var Model = require("model-js");

function dsvDatasetPlugin() {

  var model = Model({
    publicProperties: [ "metadata" ],
    metadata: Model.None
  });

  model.when(["dsvString", "metadata"], function (dsvString, metadata) {
    if(metadata !== Model.None){
      model.data = dsvDataset.parse({
        dsvString: dsvString,
        metadata: metadata
      }).data;
    }
  });

  return model;
}
module.exports = dsvDatasetPlugin;

},{"dsv-dataset":3,"model-js":5}],12:[function(require,module,exports){
(function (global){
// This module implements a dummy visualization
// for testing the visualization dashboard framework.
//
// Draws from previous work found at
// https://github.com/curran/phd/blob/gh-pages/prototype/src/dummyVis.js
// https://github.com/curran/model-contrib/blob/gh-pages/modules/dummyVis.js
//
// Created by Curran Kelleher Feb 2015

var d3 = (typeof window !== "undefined" ? window['d3'] : typeof global !== "undefined" ? global['d3'] : null);
var Model = require("model-js");

function DummyVis(chiasm) {

  var model = Model({
    publicProperties: [

      // The background color, a CSS color string.
      "color",

      // The string that gets displayed in the center of the box.
      "text",

      // The width in pixels of lines for the X.
      "lineWidth",

      // The relative size of this component, used by the layout plugin.
      "size"
    ],

    color: "white",
    text: "",
    lineWidth: 8,
    size: 1
  });

  // Append an SVG to the chiasm container.
  // Use CSS `position: absolute;` so setting `left` and `top` CSS
  // properties later will position the SVG relative to containing div.
  var svg = d3.select(chiasm.container).append("svg")
    .style("position", "absolute");

  // Add a background rectangle to the SVG.
  // The location of the rect will be fixed at (0, 0)
  // with respect to the containing SVG.
  var rect = svg.append("rect")
    .attr("x", 0)
    .attr("y", 0);

  // Add a text element to the SVG,
  // which will render the `text` model property.
  var text = svg.append("text")
    .attr("font-size", "7em")
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "middle");

  // Make the X lines draggable. This shows how to add
  // interaction to visualization modules.
  var lineDrag = (function () {
    var x1, x2;
    return d3.behavior.drag()
      .on("dragstart", function (d) {
        x1 = d3.event.sourceEvent.pageX;
      })
      .on("drag", function (d) {
        var x2 = d3.event.sourceEvent.pageX,
            newLineWidth = model.lineWidth + x2 - x1;
        newLineWidth = newLineWidth < 1 ? 1 : newLineWidth;

        // dragging updates the `lineWidth` model property,
        // which is visible to other visualizations in the chiasm.
        model.lineWidth = newLineWidth;
        x1 = x2;
      });
  }());

  // Update the color and text based on the model.
  model.when("color", function(color){
    rect.attr("fill", color);
  });

  // Update the text based on the model.
  model.when("text", text.text, text);

  // When the size of the visualization is set
  // by the chiasm layout engine,
  model.when("box", function (box) {

    // Set the CSS `left` and `top` properties to move the
    // SVG to `(box.x, box.y)` relative to its container.
    svg
      .style("left", box.x + "px")
      .style("top", box.y + "px");

    // Set the size of the SVG and background rect.
    svg
      .attr("width", box.width)
      .attr("height", box.height);
    rect
      .attr("width", box.width)
      .attr("height", box.height);

    // Update the text label to be centered.
    text
      .attr("x", box.width / 2)
      .attr("y", box.height / 2);

  });

  // Update the X lines whenever either
  // the `box` or `lineWidth` model properties change.
  model.when(["box", "lineWidth"], function (box, lineWidth) {
    var w = box.width,
        h = box.height,
        lines = svg.selectAll("line").data([
          {x1: 0, y1: 0, x2: w, y2: h},
          {x1: 0, y1: h, x2: w, y2: 0}
        ]);
    lines.enter().append("line");
    lines
      .attr("x1", function (d) { return d.x1; })
      .attr("y1", function (d) { return d.y1; })
      .attr("x2", function (d) { return d.x2; })
      .attr("y2", function (d) { return d.y2; })
      .style("stroke-width", lineWidth)
      .style("stroke-opacity", 0.2)
      .style("stroke", "black")
      .call(lineDrag);
  });

  // Clean up the DOM elements when the component is destroyed.
  model.destroy = function(){
    // TODO test this.
    chiasm.container.removeChild(svg.node());
  };

  return model;
}

module.exports = DummyVis;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"model-js":5}],13:[function(require,module,exports){
(function (global){
// This module provides a function that computes a nested box layout.
//
// Created by Curran Kelleher June 2015
var _ = (typeof window !== "undefined" ? window['_'] : typeof global !== "undefined" ? global['_'] : null);

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
//       either a leaf node or internal node.
//     * `size` The size of the internal node, with the same specifications
//       as values within `sizes` (see next bullet point).
// * `sizes` An object that specifies component size options, where
//   * Keys are component alias strings.
//   * Values are objects with the following properties:
//     * `size` the width (if the containing box is horizontal)
//       or height (if the containing box is vertical) of the component.
//       May be either:
//       * a number (like "1.5" or "1", expressed as a number or a string) that 
//       determines size relative to siblings within the containing box, or
//       * a count of pixels (like "50px" or "200px" expressed as a string 
//         with "px" suffix) that determines an absolute fixed size.
//         This is useful in cases where components have fixed-size UI widgets 
//         rather than flexibly resizable visualizations.
//       * If `size` is not specified, it is assigned a default value of 1.
//     * `hidden` A boolean for hiding components. If true, the component
//       is excluded from the layout, if false the component is included.
// * `box` An object describing the outermost box of the layout,
//   with the following properties:
//   * `width` The width of the box in pixels.
//   * `height` The height of the box in pixels.
//   * `x` The X offset of the box in pixels.
//     If not specified, this defaults to zero.
//   * `y` The Y offset of the box in pixels.
//     If not specified, this defaults to zero.
//
// Returns an object where
//
//  * Keys are component aliases.
//  * Values are objects representing the computed box for the component,
//    having the following integer properties:
//   * `x` The X offset of the box in pixels.
//   * `y` The Y offset of the box in pixels.
//   * `width` The width of the box in pixels.
//   * `height` The height of the box in pixels.
//   * These box dimensions are quantized from floats to ints such that there are no gaps.
function computeLayout(layout, sizes, box){
  var result = {},
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
    var result, alias;
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
        result[child] = childBox;
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

module.exports = computeLayout;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],14:[function(require,module,exports){
(function (global){
// This plugin uses the computeLayout module
// to assign sizes to visible components.
//
// Draws from previous work found at
// https://github.com/curran/model-contrib/blob/gh-pages/modules/boxes.js
//
// By Curran Kelleher June 2015
var computeLayout = require("./computeLayout");
var Model = require("model-js");
var _ = (typeof window !== "undefined" ? window['_'] : typeof global !== "undefined" ? global['_'] : null);

// The layout Chiasm plugin constructor function.
function Layout(chiasm){

  // The public API object returned by the constructor function.
  var model = Model({
    publicProperties: ["layout"],
    layout: {}
  });

  // Sets the `box` model property based on actual container size .
  function setBox(){
    model.box = {
      x: 0,
      y: 0,
      width: chiasm.container.clientWidth,
      height: chiasm.container.clientHeight
    };
  }

  // Initialize `model.box`.
  setBox();

  // Update `model.box` on resize
  window.addEventListener("resize", setBox);
  
  model.destroy = function(){
    window.removeEventListener("resize", setBox);
  };

  // Respond to changes is box and layout.
  model.when(["layout", "sizes", "box"], function(layout, sizes, box){

    // Compute the layout.
    var boxes = computeLayout(layout, sizes, box);

    // Apply the layout via the `box` property of components.
    Object.keys(boxes).forEach(function(alias){
      chiasm.getComponent(alias).then(function(component){
        component.box = boxes[alias];
      });
    });
  });

  // Compute `sizes` from chiasm components.
  model.when(["layout"], function(layout){

    // Extract the list of aliases referenced in the layout.
    var aliases = aliasesInLayout(layout);

    // Set sizes once initially.
    extractSizes(aliases);

    // Set sizes when the "size" property changes on any component.
    aliases.forEach(function(alias){
      chiasm.getComponent(alias).then(function(component){
        // TODO clean up listeners, test for leaks.
        // TODO bubble errors to UI
        component.when("size", function(size){
          extractSizes(aliases);
        });
      });
    });
  });

  // Sets `model.sizes` by extracting the "size" and "hidden"
  // properties component corresponding to each alias in `aliases`.
  function extractSizes(aliases){

    // Compute which component aliases are referenced.
    var sizes = {};
    

    // For each alias referenced in the layout,
    Promise.all(aliases.map(function(alias){
      return new Promise(function(resolve, reject){
        chiasm.getComponent(alias).then(function(component){

          // store its "size" and "hidden" properties.
          if(component.size || component.hidden){
            sizes[alias] = {};
            if(component.size){
              sizes[alias].size = component.size;
            }
            if(component.hidden){
              // TODO test this line
              sizes[alias].hidden = component.hidden;
            }
          }
          resolve();
        }, reject);
      });
    })).then(function(){
      // Set the stored "size" and "hidden" properties
      // on the model to trigger the layout computation.
      if(!_.isEqual(model.sizes, sizes)){
        model.sizes = sizes;
      }
    }, function(err){
      // Throw the error so it can be seen in a Node environment.
      throw err;
    });

  }

  // Computes which aliases are referenced in the given layout.
  function aliasesInLayout(layout){
    var aliases = [];
    if(isLeafNode(layout)){
      aliases.push(layout);
    } else {
      layout.children.forEach(function(child){
        aliases.push.apply(aliases, aliasesInLayout(child));
      });
    }
    return aliases;
  }

  // Determines whether the given node in the layout tree
  // is a leaf node or a non-leaf node.
  function isLeafNode(layout){

    // If it is a leaf node, then it is a string
    // that is interpreted as a component alias.
    return typeof layout === "string";
  }

  // Return the public API.
  return model;
}

module.exports = Layout;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./computeLayout":13,"model-js":5}],15:[function(require,module,exports){
(function (global){
// A reusable line chart module.
// Draws from D3 line chart example http://bl.ocks.org/mbostock/3883245
// Curran Kelleher June 2015
var reactivis = require("reactivis");
var d3 = (typeof window !== "undefined" ? window['d3'] : typeof global !== "undefined" ? global['d3'] : null);
var Model = require("model-js");
var _ = (typeof window !== "undefined" ? window['_'] : typeof global !== "undefined" ? global['_'] : null);

var None = Model.None;

// The constructor function, accepting default values.
function LineChart(chiasm) {

  // Create a Model instance for the line chart.
  // This will serve as the line chart's public API.
  var model = Model();

  // TODO move this logic into Chiasm,
  // TODO add to plugin docs.
  model.container = chiasm.container;

  reactivis.svg(model);
  reactivis.title(model);
  reactivis.margin(model);
  reactivis.color(model);

  reactivis.xAccessor(model);
  reactivis.xScale(model, "time");
  reactivis.xAxis(model);

  reactivis.yAccessor(model);
  reactivis.yScale(model);
  reactivis.yAxis(model);

  // Add an SVG group to contain the lines.
  model.when("g", function (g) {
    model.lineG = g.append("g");
  });

  // Draw the lines.
  model.lineColumn = None;
  model.when(["lineG", "data", "lineColumn", "x", "y", "color"],
      function (lineG, data, lineColumn, x, y, color){
    var linesData = d3.nest()
          .key(function(d){ 
            if(lineColumn !== None){
              return d[lineColumn]; // Have multiple lines.
            } else {
              return "X";// have only a single line.
            }
          })
          .entries(data),
        line = d3.svg.line().x(x).y(y),
        lines = lineG.selectAll(".line").data(linesData);

    lines.enter().append("path").attr("class", "line");
    lines
      .attr("d", function(d){ return line(d.values); })
      .style("stroke", color);
    lines.exit().remove();
  });

  model.destroy = function(){
    if(model.container && model.svg){
      model.svg.node().innerHTML = "";
      model.container.removeChild(model.svg.node());
    }
  };

  return model;
}
module.exports = LineChart;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"model-js":5,"reactivis":6}],16:[function(require,module,exports){
(function (global){
// This module implements data binding between components.
// by Curran Kelleher June 2015
var d3 = (typeof window !== "undefined" ? window['d3'] : typeof global !== "undefined" ? global['d3'] : null);
var Model = require("model-js");

function Links(chiasm) {

  var model = Model({
    publicProperties: [ "bindings" ],
    bindings: []
  });

  model.when("bindings", function (bindings){
    bindings.forEach(function(bindingExpr){

      // Parse the binding expression of the form
      // "sourceAlias.sourceProperty -> targetAlias.targetProperty"
      var parts = bindingExpr.split("->").map(function(str){ return str.trim(); }),
          source = parts[0].split("."),
          sourceAlias = source[0],
          sourceProperty = source[1],
          target = parts[1].split("."),
          targetAlias = target[0],
          targetProperty = target[1];

      // Retreive the source and target components.
      chiasm.getComponent(sourceAlias).then(function(sourceComponent){
        // TODO propagate errors to UI

        chiasm.getComponent(targetAlias).then(function(targetComponent){
          // TODO propagate errors to UI
          // TODO keep track of listeners and remove old ones when bindings change.
          // TODO add a test for this


          // Add a reactive function that binds the source to the target.
          sourceComponent.when(sourceProperty, function(value){
            targetComponent[targetProperty] = value;
          });
        });
      });
    });
  });

  return model;
}
module.exports = Links;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"model-js":5}],17:[function(require,module,exports){
(function (global){
// A reusable scatter plot module.

// Curran Kelleher June 2015
var reactivis = require("reactivis");
var d3 = (typeof window !== "undefined" ? window['d3'] : typeof global !== "undefined" ? global['d3'] : null);
var Model = require("model-js");

var None = Model.None;

var addPublicProperty = reactivis.addPublicProperty;

// The constructor function, accepting default values.
return function ScatterPlot(chiasm) {

  // Create a Model instance for the visualization.
  // This will serve as its public API.
  var model = Model();

  // TODO move this logic into Chiasm,
  // TODO add to plugin docs.
  model.container = chiasm.container;

  reactivis.svg(model);
  reactivis.title(model);
  reactivis.margin(model);

  reactivis.xAccessor(model);
  reactivis.xScale(model, "linear");
  reactivis.xAxis(model);

  reactivis.yAccessor(model);
  reactivis.yScale(model, "linear");
  reactivis.yAxis(model);

  reactivis.color(model);

  // Allow the API client to optionally specify a size column.
  addPublicProperty(model, "sizeColumn", None);
  
  // The default radius of circles in pixels.
  addPublicProperty(model, "sizeDefault", 3);

  // The min and max circle radius in pixels.
  addPublicProperty(model, "sizeMin", 0.5);
  addPublicProperty(model, "sizeMax", 6);

  // Set up the size scale.
  model.when(["sizeColumn", "data", "sizeDefault", "sizeMin", "sizeMax"],
      function (sizeColumn, data, sizeDefault, sizeMin, sizeMax){
    if(sizeColumn !== None){
      var getSize = function (d){ return d[sizeColumn]; },
          sizeScale = d3.scale.linear()
            .domain(d3.extent(data, getSize))
            .range([sizeMin, sizeMax]);
      model.getSizeScaled = function (d){ return sizeScale(getSize(d)); };
    } else {
      model.getSizeScaled = function (d){ return sizeDefault; };
    }
  });

  // Add an SVG group to contain the marks.
  model.when("g", function (g) {
    model.circlesG = g.append("g");
  });

  // Draw the circles of the scatter plot.
  model.when(["data", "circlesG", "x", "y", "getSizeScaled", "color"],
      function (data, circlesG, x, y, getSizeScaled, color){

    var circles = circlesG.selectAll("circle").data(data);
    circles.enter().append("circle");
    circles
      .transition().duration(500) // TODO make this a model property
      .attr("cx", x)
      .attr("cy", y)
      .attr("r", getSizeScaled)
      .attr("fill", color);
    circles.exit().remove();

  });

  model.destroy = function(){
    if(model.container && model.svg){
      model.svg.node().innerHTML = "";
      model.container.removeChild(model.svg.node());
    }
  };

  return model;
}
module.exports = ScatterPlot;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"model-js":5,"reactivis":6}]},{},[1])(1)
});