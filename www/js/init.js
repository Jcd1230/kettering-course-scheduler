// Global app state
var state = {};

function loadapp()
{
	$("div.course_selection").each(function() {

	});
	$("div.course_button").each(function() {
		$(this).addClass("mdi-icon-add");
	});
	$("div.course_button").each(function() {
		$(this).on('click', function() {
			$(this).toggleClass("mdi-icon-add");
			$(this).toggleClass("mdi-icon-remove");
		});
	});
}

(function($){
	$(function(){

		var loading = false;

		$('.button-collapse').sideNav();
		$("#majorPicker").dropdown({
			inDuration: 300,
			outDuration: 225,
			constrain_width: false, // Does not change width of dropdown to that of the activator
			hover: false, // Activate on hover
			gutter: 0, // Spacing from edge
			belowOrigin: true // Displays dropdown below the button
		});

		//Get courses and majors
		$.ajax("/api/get/majors").done(function(data) {
			state.majors = JSON.parse(data);
		});

		$.ajax("/api/get/courses").done(function(data) {
			state.courses = JSON.parse(data);
		});

	}); // end of document ready
})(jQuery); // end of jQuery name space
