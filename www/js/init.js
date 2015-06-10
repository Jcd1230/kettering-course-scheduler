// Global app state
var state = {};
state.current = {};
state.current.selected_title = "Pick a major . . .";

var ractive;

function updateRequirements()
{
	var i, j, k;
	for (i = 0; i < state.requirements.length; i++) {
		var cat = state.requirements[i];
		var cat_all_completed = true;
		for (j = 0; j < cat.subgroups.length; j++) {
			var grp = cat.subgroups[j];
			var grp_credits = 0;
			var grp_all_completed = true;
			for (k = 0; k < grp.courses.length; k++) {
				var crs = grp.courses[k];
				if (crs.completed) {

				} else {

				}
			}
			grp.credit_desc = (grp.min_credits < 0 ? "Required:" : grp.min_credits)
		}
	}
}

(function($){
	$(function(){

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
				});
			}
		});

		//Get courses and majors
		$.ajax("http://doga8155-2.kettering.edu/api/get/majors").done(function(data) {
			ractive.set('_majors', JSON.parse(data));
		});

		$.ajax("http://doga8155-2.kettering.edu/api/get/courses").done(function(data) {
			ractive.set('_courses',JSON.parse(data));
		});

	}); // end of document ready
})(jQuery); // end of jQuery name space
