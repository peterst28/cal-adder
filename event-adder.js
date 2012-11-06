/**
 * When a user clicks on the 'add to calendar button',
 * they get redirected to this script which adds the event.
 */

// parse the URL.
var urlComponents = parseCurrURL();
var hashArgs = parseHashArgs(urlComponents.hash);
var state = deserializeState(hashArgs.state);

if(state.site) {

	// This script is executed when the user is redirected
	// to google's robots.txt
	// We don't want them to see the contents.
	// Hide them.
	$(document).ready( function() {
		$('body').css('visibility', 'hidden');
	});

	$.when(

		getEventDetails(state),
		verifyGoogleToken(hashArgs.access_token)

	).done( function(eventObj, accessToken) {
		$.when(
			getCalendarName(accessToken)
		).then( function (calendarName) {
			$.when(
				pushEvent(calendarName, eventObj, accessToken)
			).done( 
				goToCalendarEvent
			).fail( function(message) {
				alert(message);
			});

		}).fail( function(message) {
			alert(message);
		});
	}).fail( function(message) {
			alert(message);
	});
	
}

