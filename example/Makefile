build: node_modules
	node_modules/.bin/webpack --debug

serve: build open
	node_modules/.bin/webpack-dev-server

open:
	open http://localhost:8080/

.PHONY: build serve open

node_modules:
	npm install
