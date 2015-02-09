# See the README for installation instructions.

NODE_PATH ?= ./node_modules
JS_COMPILER = $(NODE_PATH)/uglify-js/bin/uglifyjs
JS_BEAUTIFIER = $(NODE_PATH)/uglify-js/bin/uglifyjs -b -i 2 -nm -ns
LESS_COMPILER = $(NODE_PATH)/less/bin/lessc
COFFEE_COMPILER = $(NODE_PATH)/coffee-script/bin/coffee -c
LOCALE ?= en_US

all: \
  thistle.js \
	inlet.js \
	inlet.min.js \
	less

# Modify this rule to build your own custom release.

thistle.js:
	$(COFFEE_COMPILER) src/thistle/thistle.coffee

.INTERMEDIATE inlet.js: \
	src/thistle/thistle.js \
	src/Color.Space.js \
	src/inlet.js 
	
%.min.js: %.js Makefile
	@rm -f $@
	$(JS_COMPILER) < $< > $@

inlet.js: Makefile
	@rm -f $@
	cat $(filter %.js,$^) | $(JS_BEAUTIFIER) > $@
	@chmod a-w $@

less: Makefile
	$(LESS_COMPILER)  src/style.less > inlet.css 


clean:
	rm -f inlet*.js
