/**
 * Content script for Ticketmaster events
 */

$(document).ready( function() {
	
	//if(getSiteName() == "Meetup") {
		
		// grab the event id from the url
		var match = /\/event\/(.+)/.exec(window.location.href);
		console.log("url: " + window.location.href);
		if(match) {

			var event_id = match[1];
		
			// set up the 'add event' button to the page.
			// the url ultimately redirects to a page that 
			// is picked up by event-adder.js
			var url = getGoogleOauthURL({site:"ticketmaster", id:event_id});
		
			$('#tw_bt').append(getButtonHTML(url));
		}
	//}
});


