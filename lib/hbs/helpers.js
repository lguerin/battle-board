var hbs = require('express-hbs');

hbs.registerHelper('renderSelectOptions', function(list, selected) {	
	var html = "";
	for (var i = 0; i < list.length; i++) {
		var selectedVal = "";
		if(list[i]._id && (list[i]._id.toString() == selected)){
		   selectedVal = "selected";
		} 		
		html += "<option " + selectedVal + " value='" + list[i]._id + "'>" + list[i].label + "</option>";
	};
	return new hbs.SafeString(html);
});

hbs.registerHelper('renderConfirmBox', function(id) {
	var html = "<div class='modal hide fade' id='" + id + "'>" +
			"<div class='modal-header'>" +
			"<button type='button' class='close' data-dismiss='modal' aria-hidden='true'>&times;</button>" +
			"<h3>Confirmation</h3>" +
			"</div>" +
			"<div class='modal-body'>" +
			"<p>Êtes-vous sûr ?</p>" +
			"</div>" +
			"<div class='modal-footer'>" +
			"<a href='#' class='btn btn-primary'>Oui</a>" +			
			"<a href='#' class='btn'>Non</a>" +
			"</div>" +
			"</div>";
	return new hbs.SafeString(html);
});