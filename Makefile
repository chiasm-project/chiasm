GENERATED_FILES = \
	chiasm-bundle.js

BIN = ./node_modules/.bin

all: $(GENERATED_FILES)

.PHONY: clean all test

test: clean all
	$(BIN)/mocha

clean:
	rm -f -- $(GENERATED_FILES)

chiasm-bundle.js: index.js
	$(BIN)/browserify $^ -o $@ -s Chiasm -g browserify-shim
