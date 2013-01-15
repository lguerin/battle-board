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

hbs.registerHelper('renderConfirmBox', function(id, linkId) {
	var html = "<div class='modal hide fade' id='" + id + "'>" +
			"<div class='modal-header'>" +
			"<button type='button' class='close' data-dismiss='modal' aria-hidden='true'>&times;</button>" +
			"<h3>Confirmation</h3>" +
			"</div>" +
			"<div class='modal-body'>" +
			"<p>" +
			"<img src='/img/battle-board-mini.png' alt='Battle Board' />" +
			"<h4>Êtes-vous sûr ?</h4>" +
			"</p>" +
			"</div>" +
			"<div class='modal-footer'>" +
			"<a href='#' class='confirm btn btn-primary' onclick='BattleBoard.Util.confirmModalBox(&apos;" + id + "&apos;, &apos;" + linkId + "&apos;)'>Oui</a>" +			
			"<a href='#' class='btn' data-dismiss='modal'>Non</a>" +
			"</div>" +
			"</div>";
	return new hbs.SafeString(html);
});