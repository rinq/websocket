test: node_modules
	node_modules/.bin/mocha

coverage: node_modules
	NODE_ENV=test node_modules/.bin/nyc mocha
	node_modules/.bin/nyc report --reporter=html
	node_modules/.bin/nyc report --reporter=lcov

open-coverage:
	open coverage/index.html

lint: node_modules
	node_modules/.bin/standard --fix '**/*.js'
	node_modules/.bin/eslint .

example:
	cd example; make build

serve-example:
	cd example; make serve

.PHONY: test coverage open-coverage lint example serve-example

node_modules:
	yarn install
