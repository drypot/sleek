for var in node/test/*-test.js node/test-api/*-test.js; do
	echo mocha $var
	mocha $var
	if [ $? -ne 0 ]; then
		break
	fi
done

