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

serve-example-server:
	cd example/server; make serve

serve-example-client:
	cd example/client; make serve

open-example:
	cd example/client; make open

.PHONY: test coverage open-coverage lint serve-example-server serve-example-client open-example

node_modules:
	yarn install
