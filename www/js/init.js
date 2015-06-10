// Global app state
var state = {};
state.current = {};
state.now_term = 20152;
state.current.selected_title = "Pick a major . . .";
state.current.selected_term = 20152;
var oldestterm = 20152
var latestterm = 20152;
state.current.terms = [{id:20152, courses:[153,312]}];
state.current.termindex = 0;
var ractive;

function updateRequirements()
{
/*	console.log("Updating requirements");
	var i, j, k;
	var total_credits = 0;
	var max_credits = 0;
	for (i = 0; i < state.requirements.length; i++) {
		var cat = state.requirements[i];
		var cat_all_completed = true;
		var cat_all_planned = true;
		for (j = 0; j < cat.subgroups.length; j++) {
			var grp = cat.subgroups[j];
			var grp_planned_credits = 0;
			var grp_credits = 0;
			var grp_all_planned = true;
			var grp_all_completed = true;
			grp.completed = false;
			grp.planned = false;
			if (grp.min_credits > 0) {
				max_credits += grp.min_credits;
			}
			for (k = 0; k < grp.courses.length; k++) {
				var crs = state._courses[grp.courses[k]];
				crs.completed = false;
				crs.planned = false;
				if (crs.term) {
					if (crs.term < state.now_term) {
						crs.completed = true;
						crs.color = "teal";
						crs.icon = "mdi-icon-remove";
						grp_credits += crs.credits;
						console.log("you broke it gabe");
					} else {
						crs.planned = true;
						crs.color = "yellow";
						crs.icon = "mdi-icon-remove";
						grp_planned_credits += crs.credits;
						grp_all_completed = false;
					}
				} else {
					crs.color = "red";
					crs.icon = "mdi-icon-add";
					grp_all_planned = false;
					grp_all_completed = false;
				}
			}
			if (grp.min_credits > 0) {
				if (grp_credits > grp.min_credits) {
					grp.completed = true;
				} else if ((grp_planned_credits + grp_credits) > grp.min_credits) {
					grp.planned = true;
				}
			} else {
				if (grp_all_completed) {
					grp.completed = true;
				} else if (grp_all_planned) {
					grp.planned = true;
				}
			}
			if (grp.completed) {
				console.log("WHAT THE HELL")
			}
			grp.credit_desc = (grp.completed ? "Completed" : (grp.planned ? "Planned" : (grp.min_credits < 0 ? "Required:" : ("Any " +grp.min_credits + " Credits Required:"))));
		}
	}
	ractive.set('state', state);
	console.log(ractive.get('state'));*/
}


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
		ractive = new Ractive({
			el: 'pagebody',
			template: $("#mainTemplate").html(),
			data: state,
			oninit: function() {
				$('.button-collapse').sideNav();
				$("#majorPicker").dropdown({
				  inDuration: 300,
				  outDuration: 225,
				  constrain_width: false, // Does not change width of dropdown to that of the activator
				  hover: false, // Activate on hover
				  gutter: 0, // Spacing from edge
				  belowOrigin: true // Displays dropdown below the button
				});

			},
			showMajorPicker: function() {
				console.log("clicked");
			},
			pickMajor: function(major) {
				console.log(major);
				this.set('current.selected_major', major);
				this.set('current.selected_title', state._majors[major].name);
				$.ajax("http://doga8155-2.kettering.edu/api/get/requirements?major="+major).done(function(data) {
					state.requirements = JSON.parse(data);
					ractive.set('requirements', state.requirements);
					$(".collapsible").collapsible();
					updateRequirements();
				});
			},
			newTerm: function(old) {
				if (old) {
					oldestterm = oldestterm - 1;
					oldestterm = (oldestterm%10==9 ? oldestterm - 6 : oldestterm);
					state.current.terms.unshift({id:oldestterm, courses: [350]});
				} else {
					latestterm = latestterm - 1;
					latestterm = (latestterm%10==4 ? latestterm + 6 : latestterm);
					state.current.terms.append({id:latestterm, courses: []});
				}
			},
			courseToggle: function(c) {
				console.log(c);
				if (state._courses[c].term) {
					state._courses[c].term = null;
				} else {

					state._courses[c].term = state.current.selected_term;
				}
				updateRequirements();
			}
		});

		//Get courses and majors
		$.ajax("http://doga8155-2.kettering.edu/api/get/majors").done(function(data) {
			state._majors = JSON.parse(data);
			ractive.set('_majors', state._majors);
			if (loading) {
				loadapp();
			}
			loading = true;
		});

		$.ajax("http://doga8155-2.kettering.edu/api/get/courses").done(function(data) {
			state._courses = JSON.parse(data);
			ractive.set('_courses', state._courses);
			if (loading) {
				loadapp();
			}
			loading= true;
		});

	}); // end of document ready
})(jQuery); // end of jQuery name space
