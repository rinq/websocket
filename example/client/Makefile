.PHONY: build
build: node_modules
	node_modules/.bin/webpack --debug

.PHONY: serve
serve: build
	node_modules/.bin/webpack-dev-server --host 0.0.0.0

.PHONY: open
open:
	open http://localhost:8080/

node_modules: yarn.lock
	yarn install
	@touch $@

yarn.lock: package.json
	yarn upgrade
	@touch $@
