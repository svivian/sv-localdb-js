
localDb - a jQuery localStorage plugin
=================================================

A simple plugin to handle fetching and updating of JSON objects from a server. Usage:

	// the 'table' name is appended to the path, i.e. the below will fetch JSON from http://example.com/json/mytable
	var db = $.localDb('/json/', 1);

	db.load(['mytable'], function() {
		// table has been loaded
		var mydata = db.table('mytable');
	});
