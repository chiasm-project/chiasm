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

describe("runtime", function () {

  it("create a component", function(done) {
    var runtime = Runtime();

    runtime.plugins.simplestPlugin = function(runtime){
      return Model();
    }
    
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

  it("create a component, set state single property", function(done) {
    var runtime = Runtime();

    runtime.plugins.simplePlugin = function(runtime){
      return Model({
      });
    }
    
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
        expect(message).to.equal("Hello");
        done();
      });
    });
  });
  // TODO
  // set multiple properties
  // config sequences
  // destroy
  // updates propataging from components to config

      //expect(foo.publicProperties).to.contain("message");
      //expect(foo.publicProperties.length).to.equal(1);
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
