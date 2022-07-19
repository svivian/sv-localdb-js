// load namespace
SV = window.SV || {};

SV.LocalDb = (function() {

	let localDb = {};
	let dbAjaxPath;
	let dbMinVersion;
	let erroredTables = [];

	let Constructor = function(ajaxPath, minVersion) {
		dbAjaxPath = ajaxPath;
		dbMinVersion = minVersion;

		localDb.versions = localStorage.versions ? JSON.parse(localStorage.versions) : {};
	};

	// PRIVATE METHODS

	// Fetch JSON from a URL.
	const ajaxRequest = function(url, successFn, failFn) {
		let request = new XMLHttpRequest();
		request.open('GET', url);

		request.onload = function() {
			if (this.status == 200) {
				// request was successful
				if (typeof successFn === 'function')
					successFn(this.response);
			}
			else {
				// some kind of server error
				failFn();
			}
		};

		request.onerror = failFn;

		request.send();
	}

	// Set the version number of the table.
	const updateTableVersion = function(tableKey) {
		localDb.versions[tableKey] = dbMinVersion;
		localStorage.versions = JSON.stringify(localDb.versions);
	};

	// Get version of table, or 0 if it doesn't yet exist.
	const getTableVersion = function(tableKey) {
		return localDb.versions[tableKey] || 0;
	};

	// Check response from server and save to localStorage.
	const saveResponse = function(response, tableKey) {
		let tableObj = {};
		try {
			tableObj = JSON.parse(response);
		}
		catch (e) {
			// bad response from server
			throw 'Server response was not JSON';
		}

		// save the parsed version of the JSON to memory, to avoid doing it again later
		localDb[tableKey] = tableObj;

		localStorage[tableKey] = response;
		updateTableVersion(tableKey);
	};

	// Gets the data via AJAX. Wrapped in a function to close over variables.
	const fetchData = function(tableKey) {
		let url = dbAjaxPath + tableKey;
		let successFn = function(response) {
			saveResponse(response, tableKey);
		};
		let failFn = function() {
			erroredTables.push(tableKey);
			throw 'Error fetching data from server ' + url;
		};

		ajaxRequest(url, successFn, failFn);
	};

	// Check if all tables are loaded yet and runs callback when they are.
	const checkLoaded = function(reqTables, callback) {
		let allLoaded = true;

		for (let tableKey of reqTables) {
			let json = localStorage[tableKey];

			if (erroredTables.includes(tableKey))
				continue;

			if (!json || getTableVersion(tableKey) < dbMinVersion) {
				allLoaded = false;
			} else if (!localDb[tableKey]) {
				localDb[tableKey] = JSON.parse(json);
			}
		}

		if (allLoaded) {
			setTimeout(callback, 10);
		} else {
			setTimeout(function() {
				checkLoaded(reqTables, callback);
			}, 500);
		}
	};


	// PUBLIC METHODS

	// Fetch data for tables if required and load into memory.
	Constructor.prototype.load = function(reqTables, callback) {
		// list of tables we need to load via AJAX
		let loadTables = [];

		for (let tableKey of reqTables) {
			// check if we need to refresh the data
			if (!localStorage.hasOwnProperty(tableKey) || getTableVersion(tableKey) < dbMinVersion) {
				loadTables.push(tableKey);
			}
		}

		for (let tableKey of loadTables) {
			fetchData(tableKey);
		}

		checkLoaded(reqTables, callback);
	};

	// Get JSON object for a table.
	Constructor.prototype.table = function(tableKey) {
		return localDb[tableKey];
	};

	// Check if there was an error loading table(s).
	Constructor.prototype.hasError = function(tableKey) {
		if (tableKey)
			return erroredTables.includes(tableKey);

		return erroredTables.length > 0;
	};

	return Constructor;

})();
