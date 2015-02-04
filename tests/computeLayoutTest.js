// This file contains tests for the computeLayout module.
// Created by Curran Kelleher Feb 2015

// Use the "expect" assert style.
// See http://chaijs.com/guide/styles/
var expect = require("chai").expect;

var requirejs = require("./configureRequireJS.js");

var computeLayout = requirejs("computeLayout");

describe("computeLayout", function () {

  it("single component", function() {
    var layout = "foo"
        box = { width: 100, height: 100 },
        result = computeLayout(layout, null, box);

    expect(result.foo.width).to.equal(100);
    expect(result.foo.height).to.equal(100);
    expect(result.foo.x).to.equal(0);
    expect(result.foo.y).to.equal(0);
  });

  it("two components horizontal, unspeficied sizes", function() {
    var layout = {
          orientation: "horizontal",
          children: ["foo", "bar"]
        },
        box = { width: 100, height: 100 },
        result = computeLayout(layout, null, box);

    expect(result.foo.width).to.equal(50);
    expect(result.foo.height).to.equal(100);
    expect(result.foo.x).to.equal(0);
    expect(result.foo.y).to.equal(0);

    expect(result.bar.width).to.equal(50);
    expect(result.bar.height).to.equal(100);
    expect(result.bar.x).to.equal(50);
    expect(result.bar.y).to.equal(0);
  });

  it("two components vertical, unspeficied sizes", function() {
    var layout = {
          orientation: "vertical",
          children: ["foo", "bar"]
        },
        box = { width: 100, height: 100 },
        result = computeLayout(layout, null, box);

    expect(result.foo.width).to.equal(100);
    expect(result.foo.height).to.equal(50);
    expect(result.foo.x).to.equal(0);
    expect(result.foo.y).to.equal(0);

    expect(result.bar.width).to.equal(100);
    expect(result.bar.height).to.equal(50);
    expect(result.bar.x).to.equal(0);
    expect(result.bar.y).to.equal(50);
  });

  it("two components horizontal, relative size", function() {
    var layout = {
          orientation: "horizontal",
          children: ["foo", "bar"]
        },
        sizes = {
          foo: { size: 3 },
          // bar size defaults to 1
        },
        box = { width: 100, height: 100 },
        result = computeLayout(layout, sizes, box);

    expect(result.foo.width).to.equal(75);
    expect(result.foo.height).to.equal(100);
    expect(result.foo.x).to.equal(0);
    expect(result.foo.y).to.equal(0);

    expect(result.bar.width).to.equal(25);
    expect(result.bar.height).to.equal(100);
    expect(result.bar.x).to.equal(75);
    expect(result.bar.y).to.equal(0);
  });

  it("two components vertical, relative size", function() {
    var layout = {
          orientation: "vertical",
          children: ["foo", "bar"]
        },
        sizes = {
          foo: { size: 3 },
          // bar size defaults to 1
        },
        box = { width: 100, height: 100 },
        result = computeLayout(layout, sizes, box);

    expect(result.foo.width).to.equal(100);
    expect(result.foo.height).to.equal(75);
    expect(result.foo.x).to.equal(0);
    expect(result.foo.y).to.equal(0);

    expect(result.bar.width).to.equal(100);
    expect(result.bar.height).to.equal(25);
    expect(result.bar.x).to.equal(0);
    expect(result.bar.y).to.equal(75);
  });

  it("two components horizontal, absolute size", function() {
    var layout = {
          orientation: "horizontal",
          children: ["foo", "bar"]
        },
        sizes = {
          foo: { size: "60px" },
          // bar size defaults to 1
        },
        box = { width: 100, height: 100 },
        result = computeLayout(layout, sizes, box);

    expect(result.foo.width).to.equal(60);
    expect(result.foo.height).to.equal(100);
    expect(result.foo.x).to.equal(0);
    expect(result.foo.y).to.equal(0);

    expect(result.bar.width).to.equal(40);
    expect(result.bar.height).to.equal(100);
    expect(result.bar.x).to.equal(60);
    expect(result.bar.y).to.equal(0);
  });
});
