// This script uses Gulp to run unit tests.
// Created by Curran Kelleher Feb 2015

// https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md
var gulp = require('gulp');

// http://www.techtalkdc.com/which-javascript-test-library-should-you-use-qunit-vs-jasmine-vs-mocha/
// https://github.com/sindresorhus/gulp-mocha
// http://mochajs.org/
// http://chaijs.com/
var mocha = require('gulp-mocha');

// Run unit tests.
gulp.task('default', function() {
  gulp.src(['tests/**/*.js'])
    .pipe(mocha({ reporter: 'spec' }));
});
