
sv-localdb-js
=================================================

**sv-localdb-js** is a vanilla JavaScript library for managing database-like data in localStorage.

A "table" is requested, the JSON response from the server is cached in localStorage for fast lookup, and the parsed JSON (an object) is loaded into memory. The library handles versioning - increase the number passed into the constructor and the local cache will be updated automatically.

Simple example:

```js
// this could be set elsewhere, or something dynamic like date.getYear()+date.getMonth() to automatically refresh each month
let dbVersion = 1;
// the 'table' name is appended to the path, i.e. the below will fetch JSON from example.com/json/mytable
let db = new SV.LocalDb('/json/', dbVersion);

db.load(['mytable'], function() {
	// table has been loaded, fetch the data as an object
	let items = db.table('mytable');

	// do something with the data
	for (let item of items) {
		// ...
	}
});
```
