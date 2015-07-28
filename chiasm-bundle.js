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

//src/plugins/colorScale.js
//src/plugins/configEditor.js
//src/plugins/crossfilter.js
  return chiasm;
};

},{"./src/chiasm":5,"./src/plugins/barChart/barChart":6,"./src/plugins/csvLoader/csvLoader":7,"./src/plugins/dataReduction/dataReduction":8,"./src/plugins/dummyVis/dummyVis":9,"./src/plugins/layout/layout":11,"./src/plugins/lineChart/lineChart":12,"./src/plugins/links/links":13,"./src/plugins/scatterPlot/scatterPlot":14}],2:[function(require,module,exports){
'use strict';

function filter(data, predicates){
  predicates.forEach(function (predicate){
    if("min" in predicate){
      data = data.filter(function (d){
        return d[predicate.column] >= predicate.min;
      });
    }
    if("max" in predicate){
      data = data.filter(function (d){
        return d[predicate.column] <= predicate.max;
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
  data.metadata = metadata;
  return data;
}
;


var index = dataReduction;

module.exports = index;
},{}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
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
},{"model-js":3}],5:[function(require,module,exports){
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
},{"model-js":3}],6:[function(require,module,exports){
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
},{"model-js":3,"reactivis":4}],7:[function(require,module,exports){
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
},{"model-js":3}],8:[function(require,module,exports){
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

    model.dataOut = dataReduction(dataIn, options);
  });

  return model;
}
module.exports = DataReduction;

},{"data-reduction":2,"model-js":3}],9:[function(require,module,exports){
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
},{"model-js":3}],10:[function(require,module,exports){
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
},{}],11:[function(require,module,exports){
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
},{"./computeLayout":10,"model-js":3}],12:[function(require,module,exports){
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
},{"model-js":3,"reactivis":4}],13:[function(require,module,exports){
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
},{"model-js":3}],14:[function(require,module,exports){
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
},{"model-js":3,"reactivis":4}]},{},[1])(1)
});