.PHONY: build
build: 
	@echo "Building rmsk-soda..."
	rm -rf dist/
	cd src && npx tsc --build tsconfig-src.json
