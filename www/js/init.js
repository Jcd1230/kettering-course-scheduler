// Global app state
var state = {};
var templates = {}
state.requirements = [];

function populateMajorPicker() {
	var picker = $("#dropdownMajorPicker");
	picker.html(templates.DropdownMajorPickerItems(state.majors));
	picker.find("li a").on('click', function() {
		selectMajor($(this).attr("data-major-id"));
	});
}

function selectMajor(major_id) {
	console.log("Selected major "+major_id);
	state.selectedmajor = major_id;
	var requirements = $("#majorRequirements");
	$.ajax("/api/get/requirements?major="+major_id).done(function(data) {
		var reqs = JSON.parse(data);
		state.requirements[major_id] = reqs;
		requirements.html(templates.MajorRequirements(reqs));
		var selections = requirements.find(".course-selection");
		selections.each(function () {
			var course = state.courses[$(this).attr("data-course-id")];
			$(this).children("h6").html(course.fullname);
			var icon = $(this).find("i");
			$(this).children("div.btn-floating").on('click', function() {
				icon.toggleClass("mdi-content-add");
				icon.toggleClass("mdi-content-remove");
			});
		});
		requirements.collapsible();
	});
}

(function($){
	$(function(){

		var loading = false;

		$('.scrollspy').scrollSpy();

		// Load templates, i.e.
		// templates.ModalPicker = "<div ..."
		$("template").each(function() {
			var id = $(this).attr('id');
			id = id.substring(8); // Trim leading 'template'
			templates[id] = doT.template($(this).html());
		});

		$('.button-collapse').sideNav();

		//Get courses and majors
		$.when($.ajax("/api/get/majors"), $.ajax("/api/get/courses")).done(
			function(majorJSON, courseJSON) {
				state.majors = JSON.parse(majorJSON[0]);
				state.courses = JSON.parse(courseJSON[0]);
				populateMajorPicker();
			}
		);

	}); // end of document ready
})(jQuery); // end of jQuery name space
