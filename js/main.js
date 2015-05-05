jQuery(document).ready(function(){
	$(".test1").select2({ 
	placeholder: "Select a state",
	allowClear: true
});
	pageInit.init();
});
	var pageInit = {
		init: function(){
			this.initSearchTable();
		},
		initSearchTable: function(){
			$('div.drop_block').each(function(){
				var hold = $(this);
				var button = hold.find('#search-filter');
				var box = hold.find('.search_container');
				console.log (hold);
				var heightBox = box.innerHeight();
				var speed = 300;

				box.css({marginTop:-heightBox});

				button.click(function(){
					if(!hold.hasClass('open')){
						hold.addClass('open');
						box.animate({marginTop:0},{queue: false, duration: speed});
					}
					else{
						hold.removeClass('open');
						box.animate({marginTop:-heightBox},{queue: false, duration: speed});
					}
					return false;
				});
				box.hover(function(){
					box.addClass('hovering');
				}, function(){
					box.removeClass('hovering');
				});
			})
		}
	};
