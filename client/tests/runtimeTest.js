// This file contains tests for the runtime environment module.
//
// Draws from previous work found at
// https://github.com/curran/reactivis/blob/gh-pages/tests/reactivisTest.js
// https://github.com/curran/overseer/blob/master/tests/overseerTests.js
//
// Created by Curran Kelleher Feb 2015

// Use the "expect" assert style.
// See http://chaijs.com/guide/styles/
var expect = require("chai").expect,

// Use JSDOM for DOM manipulation in Node.
// https://github.com/tmpvar/jsdom#creating-a-browser-like-window-object
    document = require("jsdom").jsdom(),
    requirejs = require("./configureRequireJS.js"),
    Runtime = requirejs("chiasm/runtime"),
    Model = requirejs("model");

// The simplest possible plugin just returns a ModelJS model.
function SimplestPlugin(){
  return Model();
}

// Defining "publicProperties" allows changes to be propagated from
// components (instances of the plugin) to the configuration.
function SimplePlugin(){
  return Model({
    publicProperties: ["message"],
    message: Model.None
  });
}

// This plugin is invalid because no default property values are provided.
// Default values must be explicit, because the runtime engine must know
// what values to use when the property is "unset" - when the property is
// removed from the component state configuration.
function InvalidPlugin(){
  return Model({
    publicProperties: ["message"]
  });
}

// Demonstrates having default values for public properties.
function SimplePluginWithDefaults(){
  return Model({
    publicProperties: ["x", "y"],
    x: 5,
    y: 10
  });
}

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
}

describe("runtime", function () {

  it("create a component via setConfig(config)", function(done) {
    var runtime = Runtime();

    // Assign the plugin this way so the runtime does not
    // try to load it dynamically using RequireJS.
    runtime.plugins.simplestPlugin = SimplestPlugin;
    
    runtime.setConfig({
      foo: {
        plugin: "simplestPlugin"
      }
    });

    runtime.getComponent("foo", function(err, foo){
      expect(foo).to.exist();
      done();
    });
  });

  it("create a component via setConfig(config, callback)", function(done) {
    var runtime = Runtime();

    runtime.plugins.simplestPlugin = SimplestPlugin;
    
    runtime.setConfig({
      foo: {
        plugin: "simplestPlugin"
      }
    }, function(err){
      runtime.getComponent("foo", function(err, foo){
        expect(foo).to.exist();
        done();
      });
    });
  });

  it("create a component via runtime.config = config", function(done) {
    var runtime = Runtime();

    runtime.plugins.simplestPlugin = SimplestPlugin;
    
    runtime.config = {
      foo: {
        plugin: "simplestPlugin"
      }
    };

    runtime.getComponent("foo", function(err, foo){
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

    runtime.getComponent("foo", function(err, foo){
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

    runtime.getComponent("foo", function(err, foo){
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

    runtime.getComponent("foo", function(err, foo){
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

    runtime.getComponent("foo", function(err, foo){
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

    runtime.getComponent("foo", function(err, foo){
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
        runtime.getComponent("foo", function(err, foo){
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

    runtime.getComponent("foo", function(err, foo){
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

  it("do not propagate from component to config if structure matches", function(done) {
    // This tests that JSON.stringify is used to compare old and new values
    // when propagating changes from components to the config.
    var runtime = Runtime();
    runtime.plugins.simplePlugin = SimplePlugin;
    
    runtime.config = {
      foo: {
        plugin: "simplePlugin",
        state: {
          message: {foo: ["a", "b"]}
        }
      }
    };

    runtime.getComponent("foo", function(err, foo){
      var invocations = 0;
      runtime.when("config", function(config){
        invocations++;
        expect(invocations).to.equal(1);
        foo.message = {foo: ["a", "b"]};
        setTimeout(done, 0);
      });
    });
  });

  it("propagate from component to config when config state is undefined", function(done) {
    // This tests that the "state" property is automatically created in the config
    // before it is populated with the updated state property
    // when propagating changes from components to the config.
    var runtime = Runtime();
    runtime.plugins.simplePlugin = SimplePlugin;
    
    runtime.config = {
      foo: {
        plugin: "simplePlugin"
      }
    };

    runtime.getComponent("foo", function(err, foo){
      foo.message = "Hello";

      setTimeout(function(){
        expect(runtime.config.foo.state.message).to.equal("Hello");
        done();
      }, 0);
    });
  });

  it("should not propagate from component to config for defaults", function(done) {
    var runtime = Runtime();

    runtime.plugins.simplePluginWithDefaults = SimplePluginWithDefaults;
    
    runtime.config = {
      foo: {
        plugin: "simplePluginWithDefaults"
      }
    };

    var invocations = 0;
    runtime.when("config", function(config){
      invocations++;
      expect(invocations).to.equal(1);
      setTimeout(done, 0);
    });
  });

  it("should unset a property, restoring default value", function(done) {
    var runtime = Runtime();
    runtime.plugins.simplePluginWithDefaults = SimplePluginWithDefaults;
    
    runtime.config = {
      foo: {
        plugin: "simplePluginWithDefaults",
        state: {
          x: 50
        }
      }
    };

    runtime.getComponent("foo", function(err, foo){
      expect(foo).to.exist();
      foo.when("x", function(x){
        if(x == 50){
          runtime.config = {
            foo: {
              plugin: "simplePluginWithDefaults",
              state: { }
            }
          };
        } else {
          expect(x).to.equal(5);
          done();
        }
      });
    });
  });

  it("should unset a property, setting None if default is None", function(done) {
    var runtime = Runtime();
    runtime.plugins.simplePlugin = SimplePlugin;
    
    runtime.setConfig({
      foo: {
        plugin: "simplePlugin",
        state: {
          message: "Hello"
        }
      }
    }, function (err){
      runtime.getComponent("foo", function(err, foo){
        expect(foo).to.exist();
        expect(foo.message).to.equal("Hello");
        runtime.setConfig({
          foo: {
            plugin: "simplePlugin",
            state: { }
          }
        }, function(err){
          expect(foo.message).to.equal(Model.None);
          done();
        });
      });
    });

  });

  it("should throw an error when no public property default is provided", function(done) {
    var runtime = Runtime();
    runtime.plugins.invalidPlugin = InvalidPlugin;

    runtime.setConfig({
      foo: {
        plugin: "invalidPlugin",
        state: { }
      }
    }, function(err){
      expect(err.message).to.equal("Default value for public property 'message' not specified for component with alias 'foo'.");
      done();
    });

  });

  it("should change a plugin", function(done) {
    var runtime = Runtime();
    runtime.plugins.pluginA = function(){
      return Model({
        pluginName: "A"
      });
    };

    runtime.plugins.pluginB = function(){
      return Model({
        pluginName: "B"
      });
    };
    
    runtime.config = {
      foo: {
        plugin: "pluginA"
      }
    };

    runtime.getComponent("foo", function(err, foo){
      expect(foo.pluginName).to.equal("A");
      runtime.setConfig({
        foo: {
          plugin: "pluginB"
        }
      }, function(err){
        runtime.getComponent("foo", function(err, foo){
          expect(foo.pluginName).to.equal("B");
          done();
        });
      });
    });
  });

  it("should change a plugin and transfer properties", function(done) {
    var runtime = Runtime();

    var config1 = {
      chart: {
        plugin: "barChart",
        state: { markColumn: "browser", sizeColumn: "popularity" }
      }
    };

    var config2 = {
      chart: {
        plugin: "pieChart",
        state: { markColumn: "browser", sizeColumn: "popularity" }
      }
    };

    runtime.plugins.barChart = function(){
      return Model({ pluginName: "barChart" });
    };

    runtime.plugins.pieChart = function(){
      return Model({ pluginName: "pieChart" });
    };

    runtime.config = config1;
    
    runtime.getComponent("chart", function(err, chart1){

      expect(chart1.pluginName).to.equal("barChart");
      expect(chart1.markColumn).to.equal("browser");
      expect(chart1.sizeColumn).to.equal("popularity");

      runtime.setConfig(config2 , function(err){
        runtime.getComponent("chart", function(err, chart2){

          expect(chart2.pluginName).to.equal("pieChart");
          expect(chart2.markColumn).to.equal("browser");
          expect(chart2.sizeColumn).to.equal("popularity");
          done();
        });
      });
    });
  });

  it("should pass an async error when timeout exceeded in getComponent", function(done) {
    var runtime = Runtime();
    
    runtime.getComponent("chart", function(err, chart){
      expect(err).to.exist();
      expect(err.message).to.equal("Component with alias 'chart' does not exist after timeout of 0.1 seconds exceeded.");
      done();
    }, 100);
  });
});
