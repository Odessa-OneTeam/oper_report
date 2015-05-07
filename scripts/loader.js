(function($){
	$.fn.universalLoader = function(options)
	{
		if ((typeof options == 'string') && ('stop' == options))
		{
			if (this.data('intervalID'))
			{
				window.clearInterval(this.data('intervalID'));
			}
			return ;
		}

		var options = $.extend(
		{
			loaderw : 48,
			loaderh: 48,
			framesX: 2,
			allFrames: 2,
			timer : 300,
			infinite: true
		}, options);
		
		this.css({'position': 'relative',
				  'overflow': 'hidden',
				  'width': options.loaderw,
				  'height': options.loaderh
				  });
		
		this.find('img').css('position','absolute');
		
		var i = 0,
			ourImg = this.find('img'),
			yFrame = 0,
			xFrame = 0;
		this.data('intervalID', window.setInterval(function() {
			if (i >= options.allFrames)
			{
				if ( options.infinite )
				{
					xFrame = 0;
					yFrame = 0;
					i = 0;
				}
				else
				{
					window.clearInterval(this.data('intervalID'));
					return;
				}
			}
			// console.log(xFrame, yFrame);
			// console.log(-(xFrame * options.loaderw), (yFrame * options.loaderh));
			ourImg.css({
				left: -(xFrame * options.loaderw),
				top:  -(yFrame * options.loaderh)
			});
			
			if (xFrame == (options.framesX - 1))
			{
				yFrame++;
				xFrame = 0;
			}
			else
			{
				xFrame++;
			}
			
			i++;
		}, options.timer));
	};
})(jQuery);