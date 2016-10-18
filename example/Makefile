build: node_modules
	node_modules/.bin/webpack --debug

serve: build
	node_modules/.bin/webpack-dev-server --host 0.0.0.0

open:
	open http://localhost:8080/

.PHONY: build serve open

node_modules:
	yarn install
