/**
 * Content script for Ticketmaster pages with lists of events
 */

function getEventID(url) {
	var match = /\/event\/([^\?]+)/.exec(url);
	if(match) {
		return match[1];
	} else {
		return null;
	}
}

function addButtons() {

	// get links to events that have the text "Find Tickets"
	var a = $('a[href*="http://www.ticketmaster.com/event/"]:contains("Find Tickets")');


	for(var i=0; i!=a.length; i++) {
		var event_url = $(a[i]).attr("href");
		var event_id = getEventID(event_url);

		if(event_id) {
			// only add the button if it is not yet there
			var alreadyAdded = $(a[i]).next().hasClass('ca-button');
			if(!alreadyAdded) {

				// set up the 'add event' button to the page.
				// the url ultimately redirects to a page that 
				// is picked up by event-adder.js
				var url = getGoogleOauthURL({site:"ticketmaster", id:event_id});

				// add the button
				$(a[i]).after(getButtonHTML(url));
			}
		}
	}
}


$(document).ready( function() {

	addButtons()
	
	var timeout = 0;

	// listen for page changes.
	// this handles javascript/ajax based pagination, etc
	document.addEventListener("DOMSubtreeModified", function() {
	    if(timeout) {
	        clearTimeout(timeout);
	    }
	    // wait 500ms until firing the addButtons() call to avoid
	    // calling it too frequently
	    timeout = setTimeout(addButtons, 500);
	}, false);
		

});


