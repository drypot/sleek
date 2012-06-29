.PHONY: test

test:
	for var in test/*-test.js ; do mocha $$var ; if [ $$? -ne 0 ] ; then break ; fi done