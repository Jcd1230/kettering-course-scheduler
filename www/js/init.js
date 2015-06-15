// Global app state
var state = {};
var templates = {}
state.requirements = [];
state.terms = [];
var userid = null;
var username = "";
var userimg = "";
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

function subgroupTitle(credits) {
	if (credits < 0) {
		return "Required:";
	} else {
		return credits + " Credits from:";
	}
}

function googleSignIn() {
	var gauth = gapi.auth2.init({
		clientid: '549719962445-llq8g7bvndvf48igepa99ch5b8bul0gp.apps.googleusercontent.com',
		scope: 'profile',
	});
	gauth.signIn().then(function(a,b,c) {console.log(a,b,c);});

}

function onSignIn(googleUser) {
	var profile = googleUser.getBasicProfile();
	userid = profile.getId();
	username = profile.getName();
	userimg = profile.getImageUrl();

	$("#btnGoogleLogin").html(templates.AfterLogin({
		id: userid,
		name: username,
		imgurl: userimg
	}));
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
	if (state.terms[term_id]) {
		errorToast(termName(term_id)+" already exists");
		return;
	}
	$("#modalNewTerm").closeModal();
	var latestTerm = 0;
	for (var term in state.terms) {
		if (term > latestTerm && term_id > term) {
			latestTerm = term;
		}
	}
	state.terms[term_id] = [];
	if (latestTerm === 0) {
		$("#schedule").prepend(templates.Term(term_id));
		$("#sidenav .table-of-contents").prepend(templates.TermTOCItem(term_id));
	} else {
		$("#term"+latestTerm).after(templates.Term(term_id));
		$("#sidenav .table-of-contents li[data-term-id="+latestTerm+"]")
			.after(templates.TermTOCItem(term_id));
	}

	// Add onclick for selection
	$("#term"+term_id).on('click', onTermClick);

	$('.scrollspy').scrollSpy();
}

function removeTerm(term_id) {
	var term = $("#term"+term_id);
	term.find("tbody > tr").each(function() {
		var course = $(this).attr('data-course-id');
		removeCourse(course);
	});
	term.remove();
	//Remove sidenav link
	$("#sidenav .table-of-contents li[data-term-id="+term_id+"]").remove();
	state.terms[term_id] = null;
}

function addCourse(id) {
	if (!state.terms[state.selectedterm]) {
		warningToast("You must have a term selected");
	}
	addCourseToTerm(state.selectedterm, id);
}

function confirmRemove(term_id) {
	$("#modalRemovalMsg .modal-content span").html(termName(term_id));
	$("#modalRemovalMsg .modal-footer .btn").attr('data-term-id', term_id);
	$("#modalRemovalMsg").openModal();
}

function errorToast(msg) {
	Materialize.toast("<i class='small mdi-alert-error red-text'></i>&nbsp;&nbsp;"+msg, 4000);
}

function warningToast(msg) {
	Materialize.toast("<i class='small mdi-alert-warning yellow-text'></i>&nbsp;&nbsp;"+msg, 4000);
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

function onTermClick() {
	$(this).siblings().removeClass("selected");
	$(this).addClass("selected");
	state.selectedterm = $(this).attr('data-term-id');
}

(function($){
	$(function(){

		var loading = false;

		$("select").material_select();

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

		$("#newTermQuarterPicker > a").on('click', function() {
			$(this).siblings().removeClass("selected teal");
			$(this).addClass("selected teal");
		});

		$("#btnGoogleLogin a").on('click', googleSignIn);

	}); // end of document ready
})(jQuery); // end of jQuery name space
