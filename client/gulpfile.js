// This script uses Gulp to
//
//  * run unit tests
//  * lint the code using jsHint
//  * generate documentation using Docco
//  * copy client-side files into the Rails engine
//
// Draws from previous work found at
// https://github.com/curran/JSProjectTemplate/blob/master/gulpfile.js
// 
// Created by Curran Kelleher Feb 2015
// Last updated March 2015

// Gulp is a task automation tool.
// https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md
var gulp = require("gulp");

// JSHint is a code quality tool.
// http://jshint.com/
// https://github.com/spenceralger/gulp-jshint
var jshint = require("gulp-jshint");
var stylish = require("jshint-stylish");

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

// Del is for deleting files.
// https://github.com/gulpjs/gulp/blob/master/docs/recipes/delete-files-folder.md
var del = require("del");

// Source code glob expressions for /src and /test.
var srcCode = "js/**/*.js",
    testCode = "tests/**/*.js";

// Client side files are built into this directory.
var visEnginePublicDir = "../server/visEngine/public/vis_engine/js/";

// This task runs when the "gulp" command is executed with no arguments.
gulp.task("default", ["lint", "test", "docs", "copy-to-engine"]);

// Run JSHint.
gulp.task("lint", function () {
  return gulp.src([srcCode, testCode])
    .pipe(jshint())
    .pipe(jshint.reporter(stylish));
});

// Run unit tests.
gulp.task("test", ["lint"], function () {
  return gulp.src([testCode])
    .pipe(mocha({ reporter: "spec" }));
});

// Build documentation.
gulp.task("docs", ["docs-clean", "test"], function () {
  return gulp.src(srcCode)
    .pipe(docco())
    .pipe(gulp.dest("docs"));
});
gulp.task("docs-clean", function (cb) {
  del("docs", cb);
});

// Copy client-side files into the Rails Engine.
gulp.task("copy-to-engine", function (){
  return gulp.src(srcCode)
    .pipe(gulp.dest(visEnginePublicDir));
  
  // TODO implement this
  // TODO bundle and minify AMD modules
});
