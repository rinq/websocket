lint: node_modules
	node_modules/.bin/standard --fix '**/*.js'

example:
	cd example; make build

serve-example:
	cd example; make serve

.PHONY: lint example serve-example

node_modules:
	npm install
