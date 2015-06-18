GENERATED_FILES = \
	chiasm-bundle.js

all: $(GENERATED_FILES)

.PHONY: clean all

clean:
	rm -f -- $(GENERATED_FILES)

chiasm-bundle.js: index.js
	node_modules/.bin/browserify $^ -o $@ -s Chiasm -g browserify-shim
