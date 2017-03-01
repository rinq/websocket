.PHONY: serve
serve: node_modules
	PORT=8081 node --harmony --require babel-register src/app

node_modules: yarn.lock
	yarn install
	@touch $@

yarn.lock: package.json
	yarn upgrade
