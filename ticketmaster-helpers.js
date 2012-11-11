
// Adding your site object to the site_objs variable allows
// the event-adder to find and interpret your site
site_objs.ticketmaster = new Object();

/**
 * The event-adder calls this function in order to get the details of an event.
 * It must return a deferred object which, when resolved, should set an object
 * with fields matching those described here:
 * https://developers.google.com/google-apps/calendar/v3/reference/events/insert
 *
 * The state object is populated with the same fields as those
 * passed into getGoogleOauthURL() by the content script (meetup-content.js)
 * eg. getGoogleOauthURL({site:"meetup", id:event_id})
 */
site_objs.ticketmaster.getEventDetails = function (state) {
	
	var deferred = $.Deferred();
	
	// see link for more info:
	//	http://www.meetup.com/meetup_api/docs/2/event/#get
	eventinfo_request = $.ajax({
	  url: "http://www.ticketmaster.com/event/" + state.id,
	  type: "GET",
		//dataType: "json"
	});
	
	eventinfo_request.success(function(msg) {
		var eventObj = parseTicketMasterEvent(msg);
		//console.log(msg);
		deferred.resolve(eventObj);
	});
	
	eventinfo_request.error(function(jqXHR, textStatus) {
		console.log(jqXR);
	  deferred.reject( "Meetup request failed: " + jqXHR.statusText );
	});
	
	return deferred.promise();
}

/**
 * Parses the response from ticketmaster & returns
 * the object expected by Google's calendar API.
 * See http://www.meetup.com/meetup_api/docs/2/event/#get
 * and 
 * https://developers.google.com/google-apps/calendar/v3/reference/events/insert
 */
function parseTicketMasterEvent(msg) {
	var eventObj = new Object();

	var context = jQuery(msg);

	eventObj.start = new Object();
	eventObj.end = new Object();
	startString = context.find('meta[itemprop="startDate"]').attr("content");
	startString = startString.replace('T', ' ');
	eventObj.start.dateTime = new Date(startString);

	eventObj.end.dateTime  = new Date(eventObj.start.dateTime);
	eventObj.end.dateTime.setHours( eventObj.end.dateTime.getHours() + 3 );

	eventObj.summary = context.filter('meta[property="og:title"]').attr("content");

	eventObj.description = context.filter('meta[property="og:url"]').attr("content");

	var venue = context.find('#artist_venue_name').text();
	var location = context.find('#artist_location').text();
	
	eventObj.location = venue + " - " + location;
							
	return eventObj;
}