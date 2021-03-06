
// Adding your site object to the site_objs variable allows
// the event-adder to find and interpret your site
site_objs.meetup = new Object();

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
site_objs.meetup.getEventDetails = function (state) {
	
	var deferred = $.Deferred();
	
	// key for a dummy meetup account.
	var meetup_key = "2c68791de71611323543552271f3c69";
	
	// see link for more info:
	//	http://www.meetup.com/meetup_api/docs/2/event/#get
	eventinfo_request = $.ajax({
	  url: "https://api.meetup.com/2/event/" + state.id + "?key=" + meetup_key + "&sign=true" ,
	  type: "GET",
		dataType: "json"
	});
	
	eventinfo_request.success(function(msg) {
		var eventObj = parseMeetupEvent(msg);
		deferred.resolve(eventObj);
	});
	
	eventinfo_request.error(function(jqXHR, textStatus) {
		console.log(jqXR);
	  deferred.reject( "Meetup request failed: " + jqXHR.statusText );
	});
	
	return deferred.promise();
}

/**
 * Parses the response from meetup & returns
 * the object expected by Google's calendar API.
 * See http://www.meetup.com/meetup_api/docs/2/event/#get
 * and 
 * https://developers.google.com/google-apps/calendar/v3/reference/events/insert
 */
function parseMeetupEvent(msg) {
	var eventObj = new Object();
	
	eventObj.start = new Object();
	eventObj.end = new Object();
	eventObj.start.dateTime = new Date(msg.time);
	var endTime = msg.time;
	if(msg.duration) {
		endTime += msg.duration;
	} else {
		endTime += 10800000; // default of 3 hours
	}
	eventObj.end.dateTime  = new Date(endTime);
	
	eventObj.summary = msg.name + " - " + msg.group.name;
	
	eventObj.description = "";
	if(msg.how_to_find_us) {
		eventObj.description += "How to find us: \n\t" + msg.how_to_find_us + "\n\n";
	}
	eventObj.description +=  "url: " + msg.event_url + "\n\n"
													+ jQuery(msg.description).text();
											
  if(msg.venue) {
		eventObj.location = "";
		if(msg.venue.name) {
			eventObj.location += msg.venue.name + " - ";
		}
		if(msg.venue.address_1) {
			eventObj.location += msg.venue.address_1 + " ";
		}
		if(msg.venue.address_2) {
			eventObj.location += msg.venue.address_2 + " ";
		}
		if(msg.venue.city) {
			eventObj.location += msg.venue.city;
		}
	}
											
	return eventObj;
}