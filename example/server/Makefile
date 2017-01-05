lint: node_modules
	node_modules/.bin/standard --fix '**/*.js'

serve: node_modules
	PORT=8081 node --harmony --require babel-register src/app

.PHONY: lint serve

node_modules:
	yarn install
