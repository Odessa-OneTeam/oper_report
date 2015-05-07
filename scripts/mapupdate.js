$(document).ready(function() {

	//mapUpdate.enable();
//	messagesUpdate.enable();

});


var mapUpdate = {
	enabled: false,
	interval: 20 * 1000,    // update time
	form: $('#map-search-form'),
	intervalID: 0,

	enable: function() {
		this.intervalID = window.setInterval(function() {
			this.form.trigger('submit');
			//console.log('update ticked');
		}, this.interval);
		this.enabled = true;
	},
	disable: function() {
		window.clearInterval(this.intervalID);
		this.enabled = false;
	}
};

//var messagesUpdate = {
//	enabled: false,
//	interval: messagesRequestInterval || 30,  // see EsModel::MessagesRequestInterval
//
//	enable: function() {
////		setTimeout(function(){
////			getMessages();
////		}, 1000);
//		ymaps.ready(function() {getMessages()});
//	},
//	disable: function() {
//
//	}
//};


