// This file contains tests for the runtime environment module.
//
// Draws from previous work found at
// https://github.com/curran/reactivis/blob/gh-pages/tests/reactivisTest.js
// https://github.com/curran/overseer/blob/master/tests/overseerTests.js
//
// Created by Curran Kelleher Feb 2015

// Use the "expect" assert style.
// See http://chaijs.com/guide/styles/
var expect = require("chai").expect;

// Use JSDOM for DOM manipulation in Node.
// https://github.com/tmpvar/jsdom#creating-a-browser-like-window-object
var document = require("jsdom").jsdom();

var requirejs = require("./configureRequireJS.js");

var Runtime = requirejs("runtime");
var Model = requirejs("model");

// The simplest possible plugin just returns a ModelJS model.
function SimplestPlugin(){
  return Model();
}

// Defining "publicProperties" allows changes to be propagated from
// components (instances of the plugin) to the configuration.
function SimplePlugin(){
  return Model({
    publicProperties: ["message"]
  });
};

// This plugin demonstrates basic use of the DOM.
// Notice that the runtime is passed into the plugin,
// and the runtime has its own div that serves as the
// container for DOM elements of components.
function DOMPlugin(runtime){
  var model = Model({
        publicProperties: ["message"]
      }),
      div = document.createElement("div");
  
  runtime.div.appendChild(div);

  model.when("message", function(message){
    div.innerHTML = message;
  });

  model.destroy = function(){
    runtime.div.removeChild(div);
  };
  
  return model;
};

describe("runtime", function () {

  it("create a component", function(done) {
    var runtime = Runtime();

    // Assign the plugin here so the runtime does not
    // try to load it dynamically using RequireJS.
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

  it("propagate changes from components to config (using 'publicProperties')", function(done) {
    var runtime = Runtime();
    runtime.plugins.simplePlugin = SimplePlugin;
    
    runtime.config = {
      foo: {
        plugin: "simplePlugin",
        state: {
          message: "Hello"
        }
      }
    };

    runtime.getComponent("foo", function(foo){
      runtime.when("config", function(config) {
        if(foo.message === "Hello"){
          foo.message = "World";
        } else {
          expect(config.foo.state.message).to.equal("World");
          done();
        }
      });
    });
  });

  it("use a DOM node within the runtime", function(done) {
    var runtime = Runtime(document.createElement("div"));
    runtime.plugins.domPlugin = DOMPlugin;
    
    runtime.config = {
      foo: {
        plugin: "domPlugin",
        state: {
          message: "Hello"
        }
      }
    };

    runtime.getComponent("foo", function(foo){
      expect(runtime.div).to.exist();
      expect(runtime.div.children.length).to.equal(1);

      foo.when("message", function(message){
        expect(message).to.equal("Hello");
        expect(runtime.div.children[0].innerHTML).to.equal("Hello");
        done();
      });
    });
  });

  it("clean up DOM node when component destroyed", function(done) {
    var runtime = Runtime(document.createElement("div"));
    runtime.plugins.domPlugin = DOMPlugin;
    
    runtime.config = {
      foo: {
        plugin: "domPlugin",
        state: {
          message: "Hello"
        }
      }
    };

    runtime.when("config", function(config){
      if("foo" in config){
        runtime.getComponent("foo", function(foo){
          expect(runtime.div).to.exist();
          expect(runtime.div.children.length).to.equal(1);

          // Removing "foo" from the config should cause its
          // destroy() method to be invoked.
          runtime.config = {};
        });
      } else {

        // Use setTimeout here to queue the test to run AFTER
        // the config update has been processed. This is necessary because
        // config update processing is done on an async queue.
        setTimeout(function(){

          // Test that foo.destroy() removed foo's div.
          expect(runtime.div.children.length).to.equal(0);

          // Test that the component has been removed internally.
          expect(runtime.componentExists("foo")).to.equal(false);

          done();
        },0);
      }
    });
  });

  it("do not propagate from component to config after component destroyed", function(done) {
    var runtime = Runtime(document.createElement("div"));
    runtime.plugins.simplePlugin = SimplePlugin;
    
    runtime.config = {
      foo: {
        plugin: "simplePlugin",
        state: {
          message: "Hello"
        }
      }
    };

    runtime.getComponent("foo", function(foo){
      runtime.when("config", function(config){
        if("foo" in config){
          expect(config.foo.state.message).to.equal("Hello");
          runtime.config = {};
        } else {
          foo.message = "World";
          setTimeout(done, 0);
        }
      });
    });
  });
});
