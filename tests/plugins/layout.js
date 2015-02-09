// This file contains tests for the layout plugin.
// Created by Curran Kelleher Feb 2015

// Use the "expect" assert style.
// See http://chaijs.com/guide/styles/
var expect = require("chai").expect;

// Use JSDOM for DOM manipulation in Node.
// https://github.com/tmpvar/jsdom#creating-a-browser-like-window-object
// "var" omitted intentionally to induce global variables.
document = require("jsdom").jsdom();
window = document.parentWindow;

var requirejs = require("../configureRequireJS.js");

var Runtime = requirejs("runtime");
var Model = requirejs("model");

describe("plugins/layout", function () {
  it("should compute size for a single dummyVis", function(done) {
    var div = document.createElement("div");
    var runtime = Runtime(div);

    // Set the width and height that the layout will use.
    div.clientHeight = div.clientWidth = 100;
    
    runtime.config = {
      layout: {
        plugin: "layout",
        state: {
          layout: "a"
        }
      },
      a: {
        plugin: "dummyVis"
      }
    };

    runtime.getComponent("a", function(a){
      a.when("box", function(box){
        expect(box.x).to.equal(0);
        expect(box.y).to.equal(0);
        expect(box.width).to.equal(100);
        expect(box.height).to.equal(100);
        done();
      });
    });
  });
});
