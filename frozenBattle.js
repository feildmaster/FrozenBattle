// ---------------------------------------------------------------------------
// Global Variables
// ---------------------------------------------------------------------------
var IS_DEBUG = false;

var scriptElement = document.getElementById('frozenBattle');
var baseUrl = scriptElement !== null ? scriptElement.getAttribute('src')
		.replace(/\/frozenBattle\.js$/, '')
		: 'https://raw.github.com/Craiel/FrozenBattle/master';

if (IS_DEBUG) {
	baseUrl = 'extension';
}

FrozenBattle = {
	'baseUrl' : baseUrl,
	'branch' : 'M',
	'version' : 1.0
};

FrozenBattle.coreScripts = [
		'//ajax.googleapis.com/ajax/libs/jqueryui/1.10.4/jquery-ui.min.js',
		'//ajax.googleapis.com/ajax/libs/jqueryui/1.10.4/themes/smoothness/jquery-ui.css',
		'//cdn.jsdelivr.net/underscorejs/1.6.0/underscore-min.js',
		'//cdn.jsdelivr.net/jquery.jcanvas/13.04.26/jcanvas.min.js',
		FrozenBattle.baseUrl + '/jquery.noty.packaged.min.js',
		FrozenBattle.baseUrl + '/data.js', FrozenBattle.baseUrl + '/core.js' ];

FrozenUtils = {
	'loadedScripts' : [],
	'startTime' : Date.now(),
	'notyEnabled' : false,
}

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------
FrozenUtils.load = function(property, defaultValue) {
	loadedValue = localStorage[property];
	if (localStorage[property] == undefined) {
		return defaultValue;
	}

	return loadedValue;
}

FrozenUtils.loadBool = function(property, defaultValue) {
	loadedValue = localStorage[property];
	if (localStorage[property] == undefined) {
		return defaultValue;
	}

	return loadedValue == "true";
}

FrozenUtils.loadInt = function(property, defaultValue) {
	loadedValue = localStorage[property];
	if (localStorage[property] == undefined) {
		return defaultValue;
	}

	return parseInt(loadedValue);
}

FrozenUtils.loadFloat = function(property, defaultValue) {
	loadedValue = localStorage[property];
	if (localStorage[property] == undefined) {
		return defaultValue;
	}

	return parseFloat(loadedValue);
}

FrozenUtils.pad = function(n, width, z) {
	z = z || '0';
	n = n + '';
	return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

FrozenUtils.timeDisplay = function(seconds, highPrecision) {
	if (seconds === 0 || seconds == Number.POSITIVE_INFINITY) {
		return '~~';
	}
	var milliSeconds = Math.floor(seconds);
	var days, hours, minutes, seconds;

	days = Math.floor(milliSeconds / (24 * 60 * 60 * 1000));
	days = (days > 0) ? days + 'd ' : '';

	milliSeconds %= (24 * 60 * 60 * 1000);
	hours = Math.floor(milliSeconds / (60 * 60 * 1000));
	hours = (hours > 0) ? this.pad(hours, 2) + 'h ' : '';

	milliSeconds %= (60 * 60 * 1000);
	minutes = Math.floor(milliSeconds / (60 * 1000));
	minutes = (minutes > 0) ? this.pad(minutes, 2) + 'm ' : '';

	milliSeconds %= (60 * 1000);
	seconds = Math.floor(milliSeconds / 1000);
	seconds = (seconds > 0) ? this.pad(seconds, 2) + 's ' : '';

	if (highPrecision == true) {
		milliSeconds %= 1000;
		milliSeconds = (milliSeconds > 0) ? this.pad(milliSeconds, 3) + 'ms'
				: '';

		return (days + hours + minutes + seconds + milliSeconds).trim();
	}

	return (days + hours + minutes + seconds).trim();
}

FrozenUtils.getDayTimeInSeconds = function() {
	var now = new Date();
	then = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
	return now.getTime() - then.getTime();
}

FrozenUtils.logFormat = function(message) {
	var time = '[' + this.timeDisplay(Date.now() - this.startTime, true) + ']: ';
	return time + ' ' + message;
}

FrozenUtils.log = function(message, allowNoty) {
	if (this.notyEnabled && (allowNoty == undefined || allowNoty)) {
		noty({
			text : this.logFormat(message),
			type : 'alert'
		});
	} else {
		console.log(this.logFormat(message));
	}
}

FrozenUtils.stackTrace = function() {
	var err = new Error();
	return err.stack;
}

FrozenUtils.logError = function(message) {
	if (this.notyEnabled) {
		noty({
			text : this.logFormat(message),
			type : 'error'
		});
	} else {
		alert('Error: ' + this.logFormat(message));
	}
}

FrozenUtils.loadScripts = function(scripts, nextId, finish) {
	if (nextId >= scripts.length) {
		finish();
		return;
	}

	var script = scripts[nextId];
	var loaded = jQuery.inArray(script, this.loadedScripts);
	if (loaded >= 0) {
		this.log("Script is already loaded: " + nextId, false);
		FrozenUtils.loadScripts(scripts, nextId + 1, finish);
		return;
	}

	this.log("Loading " + script, false);
	this.loadedScripts.push(script);
	try {
		if (/\.js$/.exec(script)) {
			$.getScript(script).done(function(script, textStatus) {
				FrozenUtils.log("  -> DONE", false);
				FrozenUtils.loadScripts(scripts, nextId + 1, finish);
			}).fail(
					function(jqxhr, settings, exception) {
						FrozenUtils.logError("  -> FAIL: " + exception + "\n"
								+ exception.stack);
					})
		} else if (/\.css$/.exec(script)) {
			// Append the style
			$('<link>').attr({
				rel : 'stylesheet',
				type : 'text/css',
				href : script
			}).appendTo($('head'));
			FrozenUtils.log("  -> DONE", false);
			FrozenUtils.loadScripts(scripts, nextId + 1, finish);
		} else {
			this.logError("Unhandled script type!")
		}
	} catch (e) {
		this.logError(e +": "+ FrozenUtils.stackTrace());
	}
}

// ---------------------------------------------------------------------------
// Main loading and init
// ---------------------------------------------------------------------------
FrozenBattle.loadInterval = setInterval(function() {
	if (game) {
		clearInterval(FrozenBattle.loadInterval);
		FrozenBattle.loadInterval = 0;
		fbInit();
	}
}, 1000);

function fbInit() {
	FrozenUtils.log("FrozenBattle v" + FrozenBattle.version + " @branch '"
			+ FrozenBattle.branch + "'");

	var jquery = document.createElement('script');
	jquery.setAttribute('type', 'text/javascript');
	jquery.setAttribute('src',
			'//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js');
	jquery.onload = function() {
		FrozenUtils.loadScripts(FrozenBattle.coreScripts, 0, function() {
			FrozenCore.main();
		});
	};

	document.head.appendChild(jquery);
}