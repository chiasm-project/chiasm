// This file contains tests for the runtime environment module.
//
// Draws from previous work found at
// https://github.com/curran/reactivis/blob/gh-pages/tests/reactivisTest.js
//
// Created by Curran Kelleher Feb 2015

// Use the "expect" assert style.
// See http://chaijs.com/guide/styles/
var expect = require("chai").expect;

// Use JSDOM for DOM manipulation in Node.
// https://github.com/tmpvar/jsdom
var jsdom = require("jsdom").jsdom;
var requirejs = require("./configureRequireJS.js");

var Runtime = requirejs("runtime");
var Model = requirejs("model");

function SimplestPlugin(){
  return Model();
}

describe("runtime", function () {

  it("create a component", function(done) {
    var runtime = Runtime();
    runtime.plugins.simplestPlugin = SimplestPlugin;
    
    runtime.config = {
      foo: {
        plugin: "simplestPlugin"
      }
    };

    runtime.getComponent("foo", function(foo){
      expect(foo).to.exist();
      done();
    });
  });

  it("create a component, set state with a single property", function(done) {
    var runtime = Runtime();
    runtime.plugins.simplestPlugin = SimplestPlugin;
    
    runtime.config = {
      foo: {
        plugin: "simplestPlugin",
        state: {
          message: "Hello"
        }
      }
    };

    runtime.getComponent("foo", function(foo){
      expect(foo).to.exist();
      foo.when("message", function(message){
        expect(message).to.equal("Hello");
        done();
      });
    });
  });

  it("create a component, set state with two properties", function(done) {
    var runtime = Runtime();
    runtime.plugins.simplestPlugin = SimplestPlugin;
    
    runtime.config = {
      foo: {
        plugin: "simplestPlugin",
        state: {
          x: 5,
          y: 10
        }
      }
    };

    runtime.getComponent("foo", function(foo){
      expect(foo).to.exist();
      foo.when(["x", "y"], function(x, y){
        expect(x).to.equal(5);
        expect(y).to.equal(10);
        done();
      });
    });
  });

  it("propagate changes from config to components", function(done) {
    var runtime = Runtime();
    runtime.plugins.simplestPlugin = SimplestPlugin;
    
    runtime.config = {
      foo: {
        plugin: "simplestPlugin",
        state: {
          x: 5
        }
      }
    };

    runtime.getComponent("foo", function(foo){
      foo.when(["x"], function(x){
        expect(x).to.equal(5);
        runtime.config = {
          foo: {
            plugin: "simplestPlugin",
            state: {
              x: 5,
              y: 10
            }
          }
        };
        foo.when(["y"], function(y){
          expect(y).to.equal(10);
          done();
        });
      });
    });
  });

  it("propagate changes from components to config", function(done) {
    var runtime = Runtime();
    runtime.plugins.simplePlugin = function(){
      return Model({
        publicProperties: ["message"]
      });
    };
    
    runtime.config = {
      foo: {
        plugin: "simplePlugin",
        state: {
          message: "Hello"
        }
      }
    };

    runtime.getComponent("foo", function(foo){
      expect(foo).to.exist();
      foo.when("message", function(message){
        if(message === "Hello"){
          foo.message = "World";
        } else if(message === "World"){
          expect(runtime.config.foo.state.message).to.equal("World");
          done();
        }
      });
    });
  });
  // TODO
  // div interactions
  // destroy
});
//var runtime = Runtime(createDiv());
//function ExamplePlugin(runtime){
//  var model = Model(),
//      div = createDiv();
//  
//  // TODO test
//  runtime.div.appendChild(div);
//
//  // TODO test
//  model.publicProperties = ["message"];
//
//  model.when("message", function(message){
//    // TODO test
//    div.innerHTML = message;
//  });
//
//  model.destroy = function(){
//    // TODO test
//    runtime.div.removeChild(div);
//  };
//  
//  return model;
//}
