/*
	localDb v0.5 - jQuery localStorage plugin
*/
(function ($) {
	$.extend({

		// @dbAjaxPath:		URL path to which all AJAX requests are made
		// @dbVersion:		version of our localStorage objects to check against
		localDb: function (dbAjaxPath, dbVersion) {

			// the data from localStorage as an object
			var localDb = {};

			// global localStorage object for older browsers
			if ( !localStorage ) {
				localStorage = {};
			}

			/* Sets the version number of the table.
				@tableKey:	the table
			*/
			function updateTableVersion (tableKey) {
				var obj = JSON.parse(localStorage.versions);
				obj[tableKey] = dbVersion;
				localStorage.versions = JSON.stringify(obj);
			}

			/* Check response from server and save to localStorage
				@response:	the JSON output
				@tableKey:	table in which to save the data
			*/
			function saveResponse (response, tableKey) {
				var db = {};
				try {
					db = JSON.parse(response);
				}
				catch (e) {
					// bad response from server
					$.error('Server response was not JSON');
					return false;
				}

				// save the parsed version of the JSON to avoid doing it again later
				localDb[tableKey] = db;

				localStorage[tableKey] = response;
				updateTableVersion( tableKey );
			}

			/* Gets the data via AJAX. Wrapped in a function to close over variables.
				@tableKey:	table in which to save the data
			*/
			function fetchData (tableKey) {
				$.ajax({
					url: dbAjaxPath + tableKey,
					success: function( response ) {
						saveResponse( response, tableKey );
					},
					error: function() {
						$.error('Error fetching data from server');
					}
				});
			}

			/* Check if all tables are loaded yet and runs callback when they are.
				@reqTables:		array of required tables
				@callback:		function to run when loaded
			*/
			function checkLoaded (reqTables, callback) {
				var loaded = true;
				for ( var i in reqTables ) {
					var key = reqTables[i];
					// TODO: check table version
					var json = localStorage[key];
					if ( !json ) {
						loaded = false;
					}
					else if ( !localDb[key] ) {
						localDb[key] = JSON.parse(json);
					}
				}

				if ( loaded ) {
					setTimeout( callback, 10 );
				}
				else {
					setTimeout( function() {
						checkLoaded( reqTables, callback );
					}, 1000 );
				}
			}

			return {

				/* Fetch all data from localStorage and/or AJAX.
					@reqTables:		array of required tables
					@callback:		function to run when loaded
				*/
				load: function (reqTables, callback) {
					// list of tables we need to load via AJAX
					var loadTables = [];

					if ( localStorage.versions ) {
						// check if we need to refresh the data or not
						var tableVersions = JSON.parse( localStorage.versions );

						for ( var i in reqTables ) {
							var key = reqTables[i];
							// table doesn't exist yet or outdated version
							if ( !localStorage[key] || tableVersions[key] != dbVersion ) {
								loadTables.push(key);
							}
						}
					}
					else {
						// no versions stored, so fetch everything
						localStorage.versions = '{}';
						loadTables = reqTables;
					}

					for ( var i in loadTables ) {
						fetchData(loadTables[i]);
					}

					checkLoaded( reqTables, callback );
				},

				table: function (tableKey) {
					return localDb[tableKey];
				}

			}; // end public return

		} // end localDb function

	});
})(jQuery);
