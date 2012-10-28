/**
 * Content script for meetup events
 */

// grab the event id from the url
var match = /\/events\/(\d+)\//.exec(window.location.href);
var event_id = match[1];

// set up the 'add event' button to the page.
// the url ultimately redirects to a page that 
// is picked up by event-adder.js
var url = getGoogleOauthURL({site:"meetup", id:event_id});
$(document).ready( function() {
	$('#rsvpBox').append('<center>' + getButtonHTML(url) + '</center>');
});


