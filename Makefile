lint: node_modules
	node_modules/.bin/standard --fix '**/*.js'

example:
	cd example; make serve

.PHONY: lint example

node_modules:
	npm install
