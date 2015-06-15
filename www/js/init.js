// Global app state
var state = {};
var templates = {}
state.requirements = [];
state.terms = [];

//state.terms[20152] = [155, 154, 153];

state.selectedterm = 20152;
state.courseplan = [];
var term_names = [
	"Spring ",
	"Summer ",
	"Fall ",
	"Winter "
];

function termName(term_id) {
	return (term_names[term_id%10] + Math.floor(term_id/10));
}

function nextTerm(term_id) {
	if (term_id % 10 == 3) {
		return (term_id + 7);
	} else {
		return term_id + 1;
	}
}

function prevTerm(term_id) {
	if (term_id % 10 == 0) {
		return term_id - 7;
	} else {
		return term_id - 1;
	}
}

function addTerm(term_id) {
	state.terms[term_id] = [];
	var latestTerm = 0;
	for (var term in state.terms) {
		if (term > latestTerm && term_id < term) {
			latestTerm = term;
		}
	}
	if (latestTerm === 0) {
		$("#schedule").prepend(templates.Term(term_id));
	} else {
		$("#term"+latestTerm).after(templates.Term(term_id));
	}

	$('.scrollspy').scrollSpy();
}

function removeTerm(term_id) {
	var term = $("#term"+term_id);
	term.find("tbody > tr").each(function() {
		var course = $(this).attr('data-course-id');
		removeCourse(course);
	});
	term.remove();
	state.terms[term_id] = null;
}

function addCourse(id) {
	addCourseToTerm(state.selectedterm, id);
}

function addCourseToTerm(term_id, course_id) {
	state.terms[state.selectedterm].push(course_id);
	state.courseplan[course_id] = term_id;
	$("#term"+term_id).find("tbody")
		.append(templates.TermItem(state.courses[course_id]));
	//Update course button (+ or - icon)
	var icon = $("#btncourse"+course_id).find("i");
	icon.removeClass("mdi-content-add");
	icon.addClass("mdi-content-remove");
}

function removeCourse(id) {
	var term_id = state.courseplan[id];
	var term = state.terms[term_id];
	var termCourseIndex = term.indexOf(id);
	term.splice(termCourseIndex, 1); // Remove course from term array
	//Update view; remove row from the term table
	$("#term"+term_id).find("tbody > tr[data-course-id="+id+"]").remove();
	//Update button icon
	var icon = $("#btncourse"+id).find("i");
	icon.removeClass("mdi-content-remove");
	icon.addClass("mdi-content-add");

	//Cleanup data
	state.courseplan[id] = null;
}

function populateMajorPicker() {
	var picker = $("#dropdownMajorPicker");
	picker.html(templates.DropdownMajorPickerItems(state.majors));
	picker.find("li a").on('click', function() {
		selectMajor($(this).attr("data-major-id"));
	});
}

function toggleCourse(id) {
	if (state.courseplan[id]) {
		removeCourse(id);
	} else {
		addCourse(id);
	}
}

function selectMajor(major_id) {
	console.log("Selected major "+major_id);
	state.selectedmajor = major_id;
	var requirements = $("#majorRequirements");
	$.ajax("/api/get/requirements?major="+major_id).done(function(data) {
		var reqs = JSON.parse(data);
		state.requirements[major_id] = reqs;
		requirements.html(templates.MajorRequirements(reqs));
		requirements.collapsible();
	});
}

(function($){
	$(function(){

		var loading = false;


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

				//Load terms
				var schedule = $("#schedule");
				for (term_id in state.terms) {
					addTerm(term_id);
					for (course_id in state.terms[term_id]) {
						addCourseToTerm(term_id, course_id);
					}
				}
			}
		);
	}); // end of document ready
})(jQuery); // end of jQuery name space
