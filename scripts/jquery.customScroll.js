(function($){
    $(window).load(function() {
    	$.mCustomScrollbar.defaults.scrollButtons.enable=true;
    	$(".wrap").mCustomScrollbar({
		    scrollInertia: 0,
		    alwaysShowScrollbar: 1,
		    theme: "oper-report"
		});

        $(".wrap").mCustomScrollbar();
    });
})(jQuery);
