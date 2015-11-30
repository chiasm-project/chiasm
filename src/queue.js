// Use this ES6 Promise polyfill for browser compatibility.
var Promise = require("es6-promise").Promise;

// An asynchronous batch queue for processing Actions using Promises.
// Draws from https://www.promisejs.org/patterns/#all
//
// The argument `process` is an asynchronous function that takes as input
// an item to process, and returns a promise.
//
// The returned function can be passed arrays of values to add to the queue
// that will be sequentially passed into `process`.
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
module.exports = Queue;
