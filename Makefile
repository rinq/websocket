.PHONY: test
test: node_modules
	node_modules/.bin/mocha test/suite

.PHONY: coverage
coverage: node_modules
	NODE_ENV=test node_modules/.bin/nyc mocha test/suite
	node_modules/.bin/nyc report --reporter=html
	node_modules/.bin/nyc report --reporter=lcov

.PHONY: open-coverage
open-coverage:
	open coverage/index.html

.PHONY: lint
lint: node_modules
	node_modules/.bin/standard --fix
	node_modules/.bin/eslint .

.PHONY: serve-example-server
serve-example-server:
	cd example/server; make serve

.PHONY: serve-example-client
serve-example-client:
	cd example/client; make serve

.PHONY: open-example
open-example:
	cd example/client; make open

node_modules: yarn.lock
	yarn install
	@touch $@

yarn.lock: package.json
	yarn upgrade
	@touch $@
