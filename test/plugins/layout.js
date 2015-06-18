// This file contains tests for the layout plugin.
// Created by Curran Kelleher Feb 2015

// Use the "expect" assert style.
// See http://chaijs.com/guide/styles/
var expect = require("chai").expect,
    Model = require("model-js"),
    Chiasm = require("../src/chiasm");

// Use JSDOM for DOM manipulation in Node.
// https://github.com/tmpvar/jsdom#creating-a-browser-like-window-object
// "var" omitted intentionally to induce global variables.
document = require("jsdom").jsdom();
window = document.parentWindow;

// A utility function for asserting a group of component property values.
function expectValues(chiasm, values, callback){
  var promises = Object.keys(values).map(function(key){
    return new Promise(function(resolve, reject){
      var path = key.split("."),
          alias = path[0],
          property = path[1],
          propertyPath = path.slice(2),
          expectedValue = values[key];

      chiasm.getComponent(alias).then(function(component){
        component.when(property, function(value){
          propertyPath.forEach(function(key){
            value = value[key];
          });
          expect(value).to.equal(expectedValue);
          resolve();
        });
      }, reject);
    });
  });
  
  Promise.all(promises).then(function(results){
    callback();
  }, function(err){
    console.log(err);
  });
}

describe("plugins/layout", function () {
  it("should compute size for a single dummyVis", function(done) {

    var div = document.createElement("div");
    var chiasm = Chiasm(div);

    // Set the width and height that the layout will use.
    div.clientHeight = div.clientWidth = 100;
    
    chiasm.setConfig({
      layout: {
        plugin: "layout",
        state: {
          layout: "a"
        }
      },
      a: {
        plugin: "dummyVis"
      }
    }).then(function(){
      chiasm.getComponent("a").then(function(a){
        a.when("box", function(box){
          expect(box.x).to.equal(0);
          expect(box.y).to.equal(0);
          expect(box.width).to.equal(100);
          expect(box.height).to.equal(100);
          done();
        });
      });

    }, function(err){
      console.log(err);
    });
  });

  it("should compute size for a 2 instances of dummyVis", function(done) {
    var div = document.createElement("div");
    var chiasm = Chiasm(div);

    // Set the width and height that the layout will use.
    div.clientHeight = div.clientWidth = 100;
    
    chiasm.config = {
      layout: {
        plugin: "layout",
        state: {
          layout: {
            orientation: "horizontal",
            children: ["a", "b"]
          }
        }
      },
      a: {
        plugin: "dummyVis"
      },
      b: {
        plugin: "dummyVis"
      }
    };

    expectValues(chiasm, {
      "a.box.x": 0,
      "a.box.y": 0,
      "a.box.width": 50,
      "a.box.height": 100,
      "b.box.x": 50,
      "b.box.y": 0,
      "b.box.width": 50,
      "b.box.height": 100
    }, done);
  });

  it("should compute from size specified in initial state", function(done) {
    var div = document.createElement("div");
    var chiasm = Chiasm(div);

    // Set the width and height that the layout will use.
    div.clientHeight = div.clientWidth = 100;
    
    chiasm.config = {
      layout: {
        plugin: "layout",
        state: {
          layout: {
            orientation: "horizontal",
            children: ["a", "b"]
          }
        }
      },
      a: {
        plugin: "dummyVis",
        state: {
          size: "40px"
        }
      },
      b: {
        plugin: "dummyVis"
      }
    };
    expectValues(chiasm, {
      "a.box.width": 40,
      "b.box.width": 60
    }, done);
  });

  it("should compute from size changed within component", function(done) {
    // This tests that the layout plugin is listening for changes
    // in the "size" property of each component in the layout.

    var div = document.createElement("div");
    var chiasm = Chiasm(div);

    // Set the width and height that the layout will use.
    div.clientHeight = div.clientWidth = 100;
    
    chiasm.config = {
      layout: {
        plugin: "layout",
        state: {
          layout: {
            orientation: "horizontal",
            children: ["a", "b"]
          }
        }
      },
      a: {
        plugin: "dummyVis",
        state: {
          size: "40px"
        }
      },
      b: {
        plugin: "dummyVis"
      }
    };

    chiasm.getComponent("a").then(function(a){
      chiasm.getComponent("b").then(function(b){
        a.when("box", function(box){
          if(a.size === "40px"){
            expect(box.width).to.equal(40);
            expect(b.box.width).to.equal(60);
            a.size = "55px";
          } else if(a.size === "55px"){
            expect(box.width).to.equal(55);
            expect(b.box.width).to.equal(45);
            a.size = "75px";
          } else if(a.size === "75px"){
            expect(box.width).to.equal(75);
            expect(b.box.width).to.equal(25);
            done();
          }
        });
      });
    });
  });
});
