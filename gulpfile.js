// This script uses Gulp to run unit tests.
//
// Draws from previous work found at
// https://github.com/curran/JSProjectTemplate/blob/master/gulpfile.js
// 
// Created by Curran Kelleher Feb 2015

// Gulp is a task automation tool.
// https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md
var gulp = require("gulp");

// Mocha is a unit test runner.
// http://www.techtalkdc.com/which-javascript-test-library-should-you-use-qunit-vs-jasmine-vs-mocha/
// https://github.com/sindresorhus/gulp-mocha
// http://mochajs.org/
// http://chaijs.com/
var mocha = require("gulp-mocha");

// Docco is a documentation generator.
// http://jashkenas.github.io/docco/
// https://www.npmjs.com/package/gulp-docco
var docco = require("gulp-docco");

// This task runs when the "gulp" command is executed with no arguments.
gulp.task("default", ["test", "docs"]);

// Run unit tests.
gulp.task("test", function () {
  gulp.src(["tests/*.js"])
    .pipe(mocha({ reporter: "spec" }));
});

// Build documentation.
gulp.task("docs", function () {
  gulp.src("js/*.js")
    .pipe(docco())
    .pipe(gulp.dest("docs"));
});
