
// The objects defined here allow event-adder
// to interpret the events.
// See meetup-helpers.js for an example.
var site_objs = new Object();

function getSiteName() {
	var metas = document.getElementsByTagName('meta'); 
	for (i=0; i<metas.length; i++) { 
      if (metas[i].getAttribute("property") == "og:site_name") { 
         return metas[i].getAttribute("content"); 
      } 
   }
	return "";
}

function getButtonHTML(googleOauthURL) {
	return '<a href="' + googleOauthURL + '" target="_blank"><img src="//www.google.com/calendar/images/ext/gc_button6.gif" border=0></a>';
}

function serializeState(state) {
	var ret = "";
	// format:
	//  <key>:<value>,<key>:<value>,...
	for(key in state)  {
		ret += "," + key + ":" + state[key];
	}
	if(ret) {
		// remove first comma
		ret = ret.substring(1);
	} 
	
	return ret;
}

function deserializeState(stateString) {
	// format:
	//  <key>:<value>,<key>:<value>,...
	
	var ret = new Object();
	
	if(!stateString) {
		return ret;
	}
	
	var pairs = stateString.split(',');
	for(var i=0; i<pairs.length; i++) {
		var kvp = pairs[i].split(':');
		if(kvp.length != 2) {
			alert("Invalid state!  Expected format: <key>:<value>,<key>:<value>,...\n" + 
						"Received: " + stateString + "\n" +
						"Bad pair: " + kvp);
		}
		ret[kvp[0]] = kvp[1];
	}
	
	return ret;
}

function getGoogleOauthURL(state) {

	// See this page for more info:
	// https://developers.google.com/accounts/docs/OAuth2UserAgent

	var ext_id = 'eefhdiehfbcnbjfoljojfognanmndjml';
	var client_id = '466333991256-ukb1ug14k22npa3enuernt2ho132gctk.apps.googleusercontent.com';
	var scope = 'https://www.googleapis.com/auth/calendar';
	
	// The state is communicated to the event-adder.
	// This allows the event site's content-script to send some
	// info to the event-adder.  For example, the meetup
	// content-script sends the event id so the event-adder
	// knows what event to add to the calendar.
	var state_component = serializeState(state);
	
	/*
	 * Redirecting to google's robots.txt because it is
	 * a trusted site.  The event-adder executes on requests
	 * sent to google's robots.txt.
	 */
	var redirect_uri = "http://www.google.com/robots.txt";

	client_id = encodeURIComponent(client_id);
	redirect_uri = encodeURIComponent(redirect_uri);
	scope = encodeURIComponent(scope);
	state_component = encodeURIComponent(state_component);
	
	var url = 'https://accounts.google.com/o/oauth2/auth?response_type=token&approval_prompt=auto&client_id='
				+ client_id
				+ '&redirect_uri='
				+ redirect_uri
				+ '&scope='
				+ scope
			  + '&state='
				+ state_component;
				
	return url;
}

/**
 * Google calendar allows users to have multiple calendars.
 * In this function, we pick one to add the event to and return
 * its name.  The selection is a bit naive but works for me.
 * A more intelligent approach would be to allow users to configure
 * which calendar they want their events to be added to.  However,
 * this requires more development work.
 */
function getCalendarName(accessToken) {
	var deferred = $.Deferred();

	// See link for more info: 
	//   https://developers.google.com/google-apps/calendar/v3/reference/calendarList/list
	var url = "https://www.googleapis.com/calendar/v3/users/me/calendarList?access_token=" + accessToken;

	var getCalendarRequest = $.ajax({
	  url: url,
	  type: "GET",
	});
	getCalendarRequest.done(function(msg) {
		
		var calendar;
		
		// simple selection.  just choose the first calendar whose access role is 'owner'
		for(var i=0; i!= msg.items.length; i++) {
			if(msg.items[i].accessRole == 'owner') {
				calendar = msg.items[i].id;
				break;
				//deferred.resolve(msg.items[i].id);
			}
		}
		
		if(calendar) {
			deferred.resolve(calendar);
		} else {
			deferred.reject("Couldn't find valid calendar");
		}	
	});
	getCalendarRequest.fail(function(jqXHR, textStatus) {
		console.log(jqXHR);
	  deferred.reject( "Attempt to push to calendar failed: " + jqXHR.statusText);
	});

	return deferred.promise();
}

function goToCalendarEvent(url) {
	window.location.replace(url);
}

/**
 * Returns a deferred object which returns
 * the event object.
 */
function getEventDetails(state) {

	if(site_objs[state.site]) {
		
		return site_objs[state.site].getEventDetails(state);
		
	} else {
		// Unrecognized site
		var deferred = $.Deferred();
		deferred.reject("Unrecognized site: " + state.site);
		return deferred.promise();
	}
}

/**
 * Verifying the oauth token
 * is an important step in the oauth protocol.
 * See: https://developers.google.com/accounts/docs/OAuth2UserAgent
 */
function verifyGoogleToken(access_token) {

	var deferred = $.Deferred();

	var validation_request = $.ajax({
	  url: "https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=" + access_token,
	  type: "POST"
	});
	
	validation_request.success(function(msg) {
	  if(msg.audience != "466333991256-ukb1ug14k22npa3enuernt2ho132gctk.apps.googleusercontent.com") {
			deferred.reject("Google authentication failed: token mismatch");
		} else {
			deferred.resolve(access_token);
		}
	});
	validation_request.fail(function(jqXHR, textStatus) {
		console.log(jqXHR);
	  deferred.reject("Google authentication failed: " + jqXHR.statusText);
	});
	
	return deferred.promise();
		
}

function pushEvent(calendarName, eventObj, access_token) {

	var deferred = $.Deferred();

	// See link for more info:
	// 	https://developers.google.com/google-apps/calendar/v3/reference/events/insert
	var url = "https://www.googleapis.com/calendar/v3/calendars/" + calendarName + "/events?access_token=" + access_token;
	url = encodeURI(url);

	var newevent_request = $.ajax({
	  url: url,
	  type: "POST",
		data: JSON.stringify(eventObj),
		contentType: "application/json"
	});
	newevent_request.done(function(msg) {
		deferred.resolve(msg.htmlLink);
	});
	newevent_request.fail(function(jqXHR, textStatus) {
		console.log(jqXHR);
	  deferred.reject( "Attempt to push to calendar failed: " + jqXHR.statusText);
	});
	
	return deferred.promise();
}

/**
 * Returns an object with the components of the URL 
 * set as its fields.
 * As described here: https://gist.github.com/2428561
 */
function parseCurrURL() {
	var curr_url = window.location.href;
	var urlComponents = document.createElement('a');
	urlComponents.href = curr_url;
	return urlComponents;
}

/**
 * Parses a string with the form:
 * 	?key1=val1&key2=val2&...
 *
 * Returns object with the key value pairs set:
 *  obj.key1 = val1
 *  obj.key2 = val2
 *  ...
 */
function parseHashArgs(hash) {
	var pairs = hash.substring(1).split('&');
	var hashArgs = new Object();
	for(var i=0; i<pairs.length; i++) {
		var keyval = pairs[i].split('=');
		hashArgs[keyval[0]] = keyval[1];
	}
	return hashArgs;
}