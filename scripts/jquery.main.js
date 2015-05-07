var messagesRequestInterval = 30;
if (typeof globalOptions != "undefined")
    messagesRequestInterval = globalOptions.messagesRequestInterval;

jQuery(document).ready(function(){
	pageInit.init();
});

if(typeof ymaps == 'object') ymaps.ready(init);

function init(){
	if($('body').hasClass('index')){
		var form = $('form.search');
		var list = $('ul.list-situation');
		var view = 10;
		var activePage = 0;
		var nowOpenBalloon = [];
		var myMap = new ymaps.Map ("map", {
			center: [65.639419,103.054514],
			type: 'yandex#hybrid',
			zoom: 4,
            controls: [],
			behaviors:['default', 'scrollZoom']
		}, {
			minZoom: 1,
			maxZoom: 20
		});
		myMap.behaviors.disable(['multiTouch']);
		var arr = [], lastArr = [];
		var navMap = $('#nav .view-map');
		var navList = $('#nav .view-list');
		var wrap = $('.holder-situation');
		var overlay = $('.overlay');
		var pagination = $('ul.pagination');

        var customClusterIcons = {
            'yellow': [{
                href: 'uploaded/mapicons/cluster_yellow.png',
                size: [74, 74],
                offset: [-37, -37]
            }],
            'orange': [{
                href: 'uploaded/mapicons/cluster_orange.png',
                size: [74, 74],
                offset: [-37, -37]
            }],
            'red': [{
                href: 'uploaded/mapicons/cluster_red.png',
                size: [74, 74],
                offset: [-37, -37]
            }]
        };

		var clusterer = new ymaps.Clusterer({
			preset: 'twirl#redClusterIcons',
            clusterNumbers: [10000],
			clusterHideIconOnBalloonOpen: false,
			geoObjectHideIconOnBalloonOpen: false,
            gridSize: 150,
            zoomMargin: [170,80,30,80],
            maxZoom: 17
		});

		navList.click(function(){
			navMap.parent().removeClass('active');
			navList.parent().addClass('active');
			overlay.fadeIn(300, function(){
				wrap.fadeIn(300);
			});
			return false;
		});

		navMap.click(function(){
			navMap.parent().addClass('active');
			navList.parent().removeClass('active');
			wrap.fadeOut(300, function(){
				overlay.fadeOut(300);
			});
			return false;
		});

		myMap.controls.add(new ymaps.control.TypeSelector(['yandex#map', 'yandex#satellite', 'yandex#hybrid'])).add('zoomControl', {left: '20px', top: '160px'});

		myMap.action.setCorrection(function (tick) {
	        var projection = myMap.options.get('projection');
	        var mapSize = myMap.container.getSize();
	        var tickCenter = projection.fromGlobalPixels(tick.globalPixelCenter, tick.zoom);
	        var top = [tick.globalPixelCenter[0] + mapSize[0] / 2, tick.globalPixelCenter[1] - mapSize[1] / 2];
	        var bot = [tick.globalPixelCenter[0] - mapSize[0] / 2, tick.globalPixelCenter[1] + mapSize[1] / 2];
	        var tickTop = projection.fromGlobalPixels(top, tick.zoom);
	        var tickBot = projection.fromGlobalPixels(bot, tick.zoom);

	        if (tickTop[0] > 85) {
	            tick.globalPixelCenter = projection.toGlobalPixels(
	                [85, tickCenter[1]],
	                tick.zoom
	            );
	            tick.globalPixelCenter = [tick.globalPixelCenter[0], tick.globalPixelCenter[1] + mapSize[1] / 2];
	            tick.duration = 500;
	        }
	        if (tickBot[0] < -85) {
	            tick.globalPixelCenter = projection.toGlobalPixels(
	                [-85, tickCenter[1]],
	                tick.zoom
	            );
	            tick.globalPixelCenter = [tick.globalPixelCenter[0], tick.globalPixelCenter[1] - mapSize[1] / 2];
	            tick.duration = 500;
	        }
	        return tick;
	    });

		function changeView(){
			list.find('> li').css({display: 'none'})
			for (var i = activePage * view; i < activePage * view + view; i++){
				list.find('> li').eq(i).css({display: 'block'});
			};
		}

        // создает паджинацию с точкми (...)
        function createPagination() {
            var size = list.find('> li').length;
            var pages = Math.ceil(size/view);
            var pageDelta = 3;
            var current = activePage + 1;

            if (current < pageDelta)
                pageDelta = pageDelta * 2  - current;
            if ((pages - current) < pageDelta)
                pageDelta = pageDelta * 2 - pages + current


            var temp = '';

            if(size > view) {
                for (var j = 1; j <= pages; j++) {
                    if ((j > (current - pageDelta)) && (j < (current + pageDelta))) {
                        temp += '<li class="page" data-index="'+j+'"><a href="#">'+j+'</a></li>';
                    }
                    else if (j == (current - pageDelta)) {
                        if (current > pageDelta) {
                            temp += '<li class="page" data-index="1"><a href="#">1</a></li>';

                            if (current > pageDelta +1) {
                                temp += '<li class="page" data-index="1"><a href="#">2</a></li>';
                            }

                            if (current > pageDelta + 2) {
                                temp += '<li class="nopage">...</li>';
                            }
                        }

                    }
                    else if (j == (current + pageDelta)) {
                        if (pages - current - 1 > pageDelta) {
                            temp += '<li class="nopage">...</li>';
                        }
                        if (current < pages - pageDelta) {
                            temp += '<li class="page" data-index="'+(pages-1)+'"><a href="#">'+(pages-1)+'</a></li>';
                        }
                        if (current <= pages) {
                            temp += '<li class="page" data-index="'+(pages)+'"><a href="#">'+(pages)+'</a></li>';
                        }
                    }
                };

            }
            pagination.each(function() {
                $(this).css({display: 'none'}).find('li').not('.prev, .next').remove();
                $(this).find('li.next').before(temp);
                if (pages > 1)
                    $(this).css({display: 'block'});
			});

            if(pages - 1 < activePage) activePage = 0;
				pagination.find('li.page').removeClass('active');
            pagination.find('li[data-index=' + (activePage + 1) + ']').addClass('active');

            startPagination();
        }

		function startPagination(){
			pagination.each(function(){
//				var li = $(this).find('> li').not('.prev, .next');
                var li = $(this).find('> li.page');
				var next = $(this).find('> li.next');
				var prev = $(this).find('> li.prev');
                var pages = parseInt(li.last().attr('data-index'));

                var changeCurrentPage = function() {
					pagination.each(function() {
						li.removeClass('active');
                        pagination.find('li[data-index=' + (activePage + 1) + ']').addClass('active');
					});
					changeView();
                    createPagination();
                };

				li.unbind('click').click(function(){
                    if (li.index(this) == activePage) {
                        return;
                    }
//					activePage = li.index(this);
                    activePage = parseInt($(this).attr('data-index')) - 1;
					changeCurrentPage();
					return false;
				});
				next.unbind('click').click(function(){
					activePage++;
					if(activePage > pages-1) activePage = 0;
					changeCurrentPage();
					return false;
				});
				prev.unbind('click').click(function(){
					activePage--;
					if(activePage < 0) activePage = pages-1;
					changeCurrentPage();
					return false;
				});
			});
		}

        // Обновляет попап с ссылками на загрузку pdf,doc
        function UpdateDownloadPopup() {
            var dump = $(this).data('dump');
            var $popup = $('#download-popup');
            if (!dump.dumpRegional) {
                $popup.find('.regional-download-btns').hide();
            } else {
                $popup.find('.regional-download-btns').show();
                if (dump.dumpRegional.docx)
                    $popup.find('.regional-download-btns .doc-download').attr('href', dump.dumpRegional.docx).show();
                else
                    $popup.find('.regional-download-btns .doc-download').hide();

                if (dump.dumpRegional.pdf)
                    $popup.find('.regional-download-btns .pdf-download').attr('href', dump.dumpRegional.pdf).show();
                else
                    $popup.find('.regional-download-btns .pdf-download').hide();
            }

            if (!dump.dumpFederal) {
                $popup.find('.local-download-btns').hide();
            } else {
                $popup.find('.local-download-btns').show();
                if (dump.dumpFederal.docx)
                    $popup.find('.local-download-btns .doc-download').attr('href', dump.dumpFederal.docx).show();
                else
                    $popup.find('.local-download-btns .doc-download').hide();

                if (dump.dumpFederal.pdf)
                    $popup.find('.local-download-btns .pdf-download').attr('href', dump.dumpFederal.pdf).show();
                else
                    $popup.find('.local-download-btns .pdf-download').hide();
            }
        }

		function createIcons(){
			list.empty();
			clusterer.removeAll();
			//activePage = 0;
			jQuery.each(mapBalloons, function(i, obj){
				if(obj.type == 'all' || obj.type == 'list') {
					var el = 	'<li id="list'+obj.id+'" class="'+(obj.post == "new" ? "bg-new" : "")+'"><a href="'+ obj.link +'"><span class="bg-transition"></span>'+
							'	<span class="top">'+
							'		<span class="left">'+
							'			<span class="figure"><img width="72" height="60" alt="image" src="'+ obj.img +'"></span>'+
							'			<span class="date">'+ obj.subInfo.date +'</span>'+
							'		</span>'+
							'		<span class="right">'+
							'			<strong class="title">'+ obj.info.title +'</strong>'+
							'			<span class="text">'+ obj.info.location +'</span>'+
							'		</span>'+
							'	</span>'+
							'	<span class="bottom">'+
							'		<span class="left"><strong class="title '+ obj.subInfo.state +'">'+ obj.subInfo.title +'</strong></span>'+
							'		<span class="right">'+
							'			<span class="dl"><span class="dt">Масштаб ЧС</span><span class="dd">'+ obj.info.description.scale +'</span></span>'+
							'			<span class="dl"><span class="dt">Вид ЧС</span><span class="dd">'+ obj.info.description.kind +'</span></span>'+
							'			<span class="dl"><span class="dt">Тип ЧС</span><span class="dd">'+ obj.info.description.type +'</span></span>'+
							'		</span>'+
							'	</span>'+
							'</a>'+
							'<a href="#download-popup" class="download-btn-md simplebox" data-dump=' + JSON.stringify(obj.dump) + '></a>'+
							'</li>';
					list.append(el);
				}

				if(obj.type == 'all' || obj.type == 'map'){
					var ball = 	'<div id="b'+obj.id+'" class="holder-bull open">'+
								'	<div class="info-date">'+
								'		<strong class="title '+obj.subInfo.state+'">'+ obj.subInfo.title +'</strong>'+
								'		<strong class="date">'+ obj.subInfo.date +'</strong>'+
								'	</div>'+
								'	<div class="info">'+
								'		<a href="#" class="close-new">close</a>'+
								'		<a href="'+ obj.link +'"><div class="top">'+
								'			<strong class="title">'+ obj.info.title +'</strong>'+
								'			<span>'+ obj.info.location +'</span></a>'+
								'		</div>'+
								'		<div class="bottom">'+
								'			<ul>'+
								'				<li>'+ obj.info.description.scale +'</li>'+
								'				<li>'+ obj.info.description.kind +'</li>'+
								'				<li>'+ obj.info.description.type +'</li>'+
								'			</ul>'+
								'		</div>'+
								'	</div>'+
								'</div>';

					obj.center[0] = parseFloat(obj.center[0]);
					obj.center[1] = parseFloat(obj.center[1]);
					var myPlacemark = new ymaps.Placemark(obj.center, {
						balloonContent: ball,
						iconContent:"<div id='i"+obj.id+"' class='icon-content "+(obj.post == "new" ? "new-icon" : "")+"'>"+
										"<img src='"+obj.icon.src+"' alt=' ' />"+
										"<img src='"+obj.icon.srcHover+"' alt=' ' />"+
										"<img class='active' src='"+obj.icon.srcActive+"' alt=' ' />"+
										"<div>"+
											"<img src='"+obj.icon.newSrc+"' alt=' ' />"+
											"<img src='"+obj.icon.newSrcHover+"' alt=' ' />"+
											"<img class='active' src='"+obj.icon.newSrcActive+"' alt=' ' />"+
										"</div>"+
									"</div>"
					}, {
						hideIconOnBalloonOpen: false,
                        iconLayout: 'default#imageWithContent',
						iconImageHref: 'images/boll.png',
						iconImageSize: [74, 101],
						iconImageOffset: [-34, -87],
						balloonContentSize: [5, 5],
						balloonLayout: "default#imageWithContent",
						balloonImageHref: ' ',
						balloonImageOffset: [0, -93],
						//balloonImageSize: [506, 100],
						balloonShadow: false
					});
					myPlacemark.elementballoon = 'b'+obj.id;
					myPlacemark.elementIcon = 'i'+obj.id;
					myPlacemark.coords = obj.center;
					myPlacemark.scale = obj.info.description.scaleType;

					//myPlacemark.balloon.close();

					myPlacemark.events.add('balloonclose', function (e) {
						$('#'+myPlacemark.elementIcon).removeClass('opened');
					});
					myPlacemark.events.add('click', function (e) {
						if(myPlacemark.balloon.isOpen()){
							nowOpenBalloon = [];
						}
					});
					arr.push(myPlacemark);
				}
			});

            list.find('.download-btn-md').on('click', UpdateDownloadPopup);

			createMessages(mapBalloons);

			$('.simplebox').simplebox();
			clusterer.add(arr);
			myMap.geoObjects.add(clusterer);

			changeView();

			createPagination();
		}

		clusterer.events
	        .add('balloonopen', function (e) {
	            var target = e.get('target'),
	                type = e.get('type');
	            if (typeof target.getGeoObjects != 'undefined') {

	            } else {
					$('#'+target.elementIcon).addClass('opened');
					setTimeout(function(){
						myMap.panTo(target.coords, {delay: 10});
					}, 50);
					jQuery('#map').off('click').on('click', '.holder-bull .close-new', function(){
						nowOpenBalloon = [];
						target.balloon.close();
                        console.log('click');
						return false;
					});
					nowOpenBalloon = target.coords;
	            }
	        });
		clusterer.events.add('objectsaddtomap', function (e) {
			setTimeout(function(){
	            for (var i = 0; i < arr.length; i++){
	            	if(nowOpenBalloon[0] == arr[i].coords[0] && nowOpenBalloon[1] == arr[i].coords[1]){
						//arr[i].balloon.close();
						var objectState = clusterer.getObjectState(arr[i]);
						if (!objectState.isClustered){
							$('#'+arr[i].elementIcon).addClass('opened');
							arr[i].balloon.open();
						}
					}
	            };

				$('div.new-icon').each(function(){
		        	if($('div.post[data-id='+$(this).attr('id').slice(1)+']').length == 0){
						$(this).removeClass('new-icon');
					}
		        });
			}, 30);

        });


		clusterer.createCluster = function (center, geoObjects) {
		    var clusterPlacemark = ymaps.Clusterer.prototype.createCluster.call(this, center, geoObjects),
		        geoObjectsAll = clusterPlacemark.getGeoObjects();
			var type = '';
            for (var i = 0; i < geoObjectsAll.length; i++){
                if(type != 'red'){
                    if(type != 'orange'){
                        type = geoObjectsAll[i].scale;
                    }
                    else
                    {
                        if (geoObjectsAll[i].scale == 'red')
                            type = 'red';
                    }
                }
            };
//            clusterPlacemark.options.set('preset', 'islands#'+type+'ClusterIcons');
            clusterPlacemark.options.set('clusterIconIcons', customClusterIcons[type]);
		    return clusterPlacemark;
		};

		var sformXHR;
		var stopTime;
		function sleep(milliseconds) {
		  var start = new Date().getTime();
		  for (var i = 0; i < 1e7; i++) {
		    if ((new Date().getTime() - start) > milliseconds){
		      break;
		    }
		  }
		}
		form.submit(function(){
			if (stopTime)
            {
            	clearTimeout(stopTime);
				stopTime = null;
        	}
			if (sformXHR)
			{
				sformXHR.abort();
				sformXHR = null;
			}
			sformXHR = $.ajax({
				type: 'POST',
				data: form.serialize(),
				dataType: 'json',
				url: form.attr('action'),
				success: function(msg){
					setTimeout(function () {
					$.each(arr, function(i, obj){
							myMap.geoObjects.remove(obj);
						});
						arr = [];
						mapBalloons = msg;
						createIcons();
						if (window.overlayTimmer)
						{
							window.clearTimeout(window.overlayTimmer);
						}
						// Если у нас на фоне включена вкладка список, то оверлей мы не скрываем!
						if (!jQuery('ul.view li:eq(1)').hasClass('active')) {
							$('.overlay').hide();
						};
	       				$('.spinner').universalLoader('stop');
	       				$('.spinner-wrap').hide();
       				}, 400);
				},
				error: function(jqHXR, status,	errorThrown){
					if ('abort' != status)
						console.warn('Server is unavailable. Refresh the page within 15 seconds. ' + status + ' ' + errorThrown);
					 $('.overlay').hide();
			         $('.spinner').hide();
				}
			});
			return false;
		});

		if(stopTime) clearTimeout(stopTime);
		if (sformXHR)
			sformXHR.abort();
		sformXHR = $.ajax({
			type: 'POST',
			data: form.serialize(),
			dataType: 'json',
			url: form.attr('action'),
			success: function(msg){
				$.each(arr, function(i, obj){
					myMap.geoObjects.remove(obj);
				});
				arr = [];
				mapBalloons = msg;
				createIcons();
			},
			error: function(jqHXR, status,	errorThrown){
				if ('abort' != status)
					console.warn('Server is unavailable. Refresh the page within 15 seconds. ' + status + ' ' + errorThrown);
			}
		});

		setInterval(function(){
			if(stopTime) clearTimeout(stopTime);
			if (sformXHR)
				sformXHR.abort();
			sformXHR = $.ajax({
				type: 'POST',
				data: form.serialize(),
				dataType: 'json',
				url: form.attr('action'),
				success: function(msg){
					$.each(arr, function(i, obj){
						myMap.geoObjects.remove(obj);
					});
					arr = [];
					mapBalloons = msg;
					createIcons();
				},
				error: function(jqHXR, status,	errorThrown){
					if ('abort' != status)
						console.warn('Server is unavailable. Refresh the page within 15 seconds. ' + status + ' ' + errorThrown);
				}
			});
		}, messagesRequestInterval * 1000); // 30000

		form.find('input:checkbox').change(function(){
			if(stopTime) clearTimeout(stopTime);
			if (sformXHR)
				sformXHR.abort();
			sformXHR = $.ajax({
				type: 'POST',
				data: form.serialize(),
				dataType: 'json',
				url: form.attr('action'),
				success: function(msg){
					$.each(arr, function(i, obj){
						myMap.geoObjects.remove(obj);
					});
					arr = [];
					mapBalloons = msg;
					createIcons();
				},
				error: function(jqHXR, status,	errorThrown){
					if ('abort' != status)
						console.warn('Server is unavailable. Refresh the page within 15 seconds. ' + status + ' ' + errorThrown);
				}
			});
		});
		form.find('input:text').bind('keypress keyup keydown', function(event){
			if($(this).val().length > 2){
				if(stopTime) clearTimeout(stopTime);
				stopTime = setTimeout(function(){
					if (sformXHR)
						sformXHR.abort();
					sformXHR = $.ajax({
						type: 'POST',
						data: form.serialize(),
						dataType: 'json',
						url: form.attr('action'),
						success: function(msg){
							$.each(arr, function(i, obj){
								myMap.geoObjects.remove(obj);
							});
							arr = [];
							mapBalloons = msg;
							createIcons();
						},
						error: function(jqHXR, status,	errorThrown){
							if ('abort' != status)
								console.warn('Server is unavailable. Refresh the page within 15 seconds. ' + status + ' ' + errorThrown);
						}
					});
				}, 300);
			}
            if ((event.type === 'keyup') && (event.keyCode === 13))
            {
                $(this).blur();
            }
		});

		function createMessages(msg){
			var posts = $('.holder-post');
			var text = "";
			var h = 0;

			setTimeout(function(){
				$.each(msg, function(i, obj){
					if(posts.find('> div[data-id="'+obj.id+'"]').length == 0 && obj.post == "new"){
                        text += '<div data-id="'+obj.id+'" class="post">'+
                                '	<strong class="title-status">'+obj.subInfo.title+'</strong>'+
                                '	<div class="center">'+
                                '		<strong class="title">'+obj.info.title+'</strong>'+
                                '		<p>'+obj.info.location+'</p>'+
                                '	</div>'+
                                '	<div class="post-bottom">'+
                                '		<dl>'+
                                '			<dt>'+obj.subInfo.date+'</dt>'+
                                '		</dl>'+
                                '		<ul class="list">'+
                                '			<li><a href="'+obj.link+'" class="btn">донесение</a></li>'+
                                '			<li><a href="#download-popup" class="download-btn-sm simplebox" data-dump=' + JSON.stringify(obj.dump) + '></a></li>'+
                                '			<li>'+obj.info.description.scale+'</li>'+
                                '		</ul>'+
                                '	</div>'+
                                '</div>';
					}
				});
				text = $(text);
				posts.append(text);
				text.each(function(){
					h += $(this).outerHeight(true);
				});
				text.css({display: 'none'});

				posts.animate({bottom: h+59}, 500, function(){
					posts.css({overflowY:'scroll', bottom: 59});
					text.fadeIn(700);
				});
				posts.find('> div').find('strong, .center, dl').unbind('click').click(function(){
					var _this = $(this).closest('div.post');
					setTimeout(function(){
						$.ajax({
							type: 'GET',
							data: 'action=remove&id='+$(_this).data('id'),
							url: form.attr('action'),
							dataType: 'text',
							success: function(){},
							error: function(){alert('Server is unavailable. Refresh the page within 15 seconds.!');}
						});
						$(_this).hide(300, function(){
							$(_this).remove();
						});
						$('#list'+$(_this).data('id')).removeClass('bg-new');
						$('#i'+$(_this).data('id')).removeClass('new-icon');
					}, 100);
					if($(_this).parent().find('.post').length == 1){
						setTimeout(function(){
							posts.css({overflow: 'auto'});
						}, 100);
					}

				});

				$('.simplebox').simplebox();

                posts.find('.download-btn-sm').on('click', UpdateDownloadPopup);

				if(posts.find('> .post').length){
                    if (globalOptions.soundEnabled) {
                        player.jPlayer("play");
                        setTimeout(function(){
                            player.jPlayer("stop");
                        }, 3500);
                    }
				}
			}, 10);

		}
        if (globalOptions.alertSound){
            var player = $('<div />');
            player.jPlayer({
                ready: function (event) {
                    $(this).jPlayer("setMedia", {
                        mp3: "mp3/" + globalOptions.alertSound + ".mp3",
                        oga: "mp3/" + globalOptions.alertSound + ".ogg",
                        wav: "mp3/" + globalOptions.alertSound + ".wav"

                    });
                },
                swfPath: "scripts",
                supplied: "mp3,oga,wav",
                wmode: "window",
                solution: "html, flash",
                smoothPlayBar: true,
                keyEnabled: true,
                remainingDuration: true,
                toggleDuration: true
            });

            // for mobile browsers autoplay workaround
            if (/Android/i.test(navigator.userAgent) || /iPhone|iPad|iPod/i.test(navigator.userAgent))
            {
                $(document).one('click touchstart', function(e) {
                    player.jPlayer("play");
                    player.jPlayer("stop");
                });
            }
        }

		/*if (messagesRequestInterval){
			setTimeout(function(){
				getMessages();
			}, 1000);
		}*/


        // switch to list from hash
        if (document.location.hash && '#list' === document.location.hash ) {
            navList.trigger('click');
            if (typeof history.replaceState !== 'undefined')
            history.replaceState("", document.title, window.location.pathname);
        }
	}
	else{
        // фикс для отключенных кнопок карты на мультипейне
        $('.buttom-map.disabled').on('click', function() {
            return false;
        });

		$('.hold-map-box:not(.disabled)').each(function(){
			var hold = $(this);
			var link = hold.find('.buttom-map');
//			var input = $('input.location-search');
			var input = hold.find('> input:text');
			var pos = hold.find('> input:hidden');
//			var box = $('.modal-map .holder-list');
            var box = hold.find('> .holder-list');
            var locationInput = $('#locationName');
			var myPlacemark;
			var map2X = $('input.map2-x');
			var map2Y = $('input.map2-y');

            locationInput.on('input', function(e) {
                $(this).data('tainted', true).off('input');
            });

			input.bind('keyup', function(e){
				if (input.val().length > 1) {
					if(e.keyCode != 40 && e.keyCode != 38 && e.keyCode != 13) find();
				}
				else
					box.css({display: 'none'});
			});

			function find(){
				$.ajax({
					type: 'GET',
					dataType: 'jsonp',
					url: 'http://geocode-maps.yandex.ru/1.x/?format=json&geocode='+encodeURIComponent('Россия, '+input.val()),
					success: function(msg){
						var text = '';
						box.find('ul').empty();
						$.each(msg.response.GeoObjectCollection.featureMember, function(i, obj){
							if (obj.GeoObject.metaDataProperty.GeocoderMetaData.kind != 'country') {
								text += '<li><a href="'+obj.GeoObject.Point.pos.split(' ')[1]+', '+obj.GeoObject.Point.pos.split(' ')[0]+'">'+obj.GeoObject.metaDataProperty.GeocoderMetaData.text+'</a></li>';
							}
						});
						if(text.length){
							var active = -1;
							box.find('ul').append(text);
							box.css({display: 'block'});
							box.find('div.custom-scroll').css({height: box.find('ul').outerHeight(true)}).customScrollV();
							box.find('a').click(function(){
								input.val($(this).text());
								pos.val($(this).attr('href'));
								box.css({display: 'none'});
								map2X.val(pos.val().split(', ')[0]/1);
								map2Y.val(pos.val().split(', ')[1]/1);
								setPoint([pos.val().split(', ')[0]/1, pos.val().split(', ')[1]/1]);
//                                if (!locationInput.data('tainted'))
//                                    locationInput.val(input.val());
								return false;
							});
							$(document).unbind('keydown.map').bind('keydown.map', function(e){
								if(box.is(':visible')){
									if(e.keyCode == 40){
										active++;
										if(active > box.find('ul > li').length-1) active = 0;
										box.find('ul > li').removeClass('active').eq(active).addClass('active');
									}
									if(e.keyCode == 38){
										active--;
										if(active < 0) active = box.find('ul > li').length-1;
										box.find('ul > li').removeClass('active').eq(active).addClass('active');
									}
									if(e.keyCode == 13){
										input.val(box.find('ul > li.active a').text());
										pos.val(box.find('ul > li.active a').attr('href'));
										box.css({display: 'none'});
										map2X.val(pos.val().split(', ')[0]/1);
										map2Y.val(pos.val().split(', ')[1]/1);
										setPoint([pos.val().split(', ')[0]/1, pos.val().split(', ')[1]/1]);
                                        if (!locationInput.data('tainted'))
                                            locationInput.val(input.val());
										return false;
									}
								}
							});
						}
					},
					error: function(){alert('Server is unavailable. Refresh the page within 15 seconds!');}
				});
			}

			link.click(function(){
				if ($(this).hasClass('disabled'))
					return false;
				if(!link.hasClass('opened')){
					link.addClass('opened');
					$.simplebox(link.attr('href'), {
						positionFrom: '.'+link.data('class'),
						overlay: false
					});
				}
				return false;
			});

			$(document).bind('mousedown', function(e){
				if(!($(e.target).parents().index($(link.attr('href'))) != -1 || $(e.target).index($(link.attr('href'))) != -1)){
					link.removeClass('opened');
					if($.simplebox.modal && $.simplebox.modal.attr('id') == link.attr('href').replace('#', '')) $.simplebox.close();
				}
			});

			$(document).bind('mousedown', function(e){
				if(!($(e.target).parents().index(box) != -1 || $(e.target).index(box) != -1)){
					box.css({display: 'none'});
				}
			});

			var myMap = new ymaps.Map ("map2", {
				center: [65.639419,103.054514],
				type: 'yandex#hybrid',
				zoom: 2,
                controls: [],
				behaviors:['default', 'scrollZoom']
			}, {
				minZoom: 1,
				maxZoom: 20
			});
			myMap.behaviors.disable(['multiTouch']);

			myMap.controls.add(new ymaps.control.TypeSelector(['yandex#map', 'yandex#satellite', 'yandex#hybrid'])).add('zoomControl', {left: '20px', top: '20px'});

			myMap.action.setCorrection(function (tick) {
		        var projection = myMap.options.get('projection');
		        var mapSize = myMap.container.getSize();
		        var tickCenter = projection.fromGlobalPixels(tick.globalPixelCenter, tick.zoom);
		        var top = [tick.globalPixelCenter[0] + mapSize[0] / 2, tick.globalPixelCenter[1] - mapSize[1] / 2];
		        var bot = [tick.globalPixelCenter[0] - mapSize[0] / 2, tick.globalPixelCenter[1] + mapSize[1] / 2];
		        var tickTop = projection.fromGlobalPixels(top, tick.zoom);
		        var tickBot = projection.fromGlobalPixels(bot, tick.zoom);

		        if (tickTop[0] > 85) {
		            tick.globalPixelCenter = projection.toGlobalPixels(
		                [85, tickCenter[1]],
		                tick.zoom
		            );
		            tick.globalPixelCenter = [tick.globalPixelCenter[0], tick.globalPixelCenter[1] + mapSize[1] / 2];
		            tick.duration = 0;
		        }
		        if (tickBot[0] < -85) {
		            tick.globalPixelCenter = projection.toGlobalPixels(
		                [-85, tickCenter[1]],
		                tick.zoom
		            );
		            tick.globalPixelCenter = [tick.globalPixelCenter[0], tick.globalPixelCenter[1] - mapSize[1] / 2];
		            tick.duration = 0;
		        }
		        return tick;
		    });
			var time;
			map2X.add(map2Y).bind('keyup', function(){
				var x = map2X.val()/1;
				var y = map2Y.val()/1;
				if(x.toString().toLowerCase() == 'nan' || x > 85 || x < 5) x = 65;
				if(y.toString().toLowerCase() == 'nan' || y >= 180 || y <= -180) y = 95;
				var coords = [x, y];

		        // Если метка уже создана – просто передвигаем ее
		        if(myPlacemark) {
		            myPlacemark.geometry.setCoordinates(coords);

					if(time) clearTimeout(time);
					time = setTimeout(function(){
						myMap.panTo(coords, {delay: 10});
					}, 50);
		        }
		        // Если нет – создаем.
		        else {
		            myPlacemark = createPlacemark(coords);
		            myMap.geoObjects.add(myPlacemark);
		            // Слушаем событие окончания перетаскивания на метке.
		            myPlacemark.events.add('dragend', function () {
		                getAddress(myPlacemark.geometry.getCoordinates());
		            });
		        }
		        getAddress(coords);
			});
            /*
			map2Y.bind('keyup', function(){
				var x = map2X.val()/1;
				var y = map2Y.val()/1;
				if(x.toString().toLowerCase() == 'nan' || x > 85 || x < 5) x = 65;
				if(y.toString().toLowerCase() == 'nan' || y >= 180 || y <= -180) y = 95;
				var coords = [x, y];

		        // Если метка уже создана – просто передвигаем ее
		        if(myPlacemark) {
		            myPlacemark.geometry.setCoordinates(coords);

					if(time) clearTimeout(time);
					time = setTimeout(function(){
						myMap.panTo(coords, {delay: 10});
					}, 50);
		        }
		        // Если нет – создаем.
		        else {
		            myPlacemark = createPlacemark(coords);
		            myMap.geoObjects.add(myPlacemark);
		            // Слушаем событие окончания перетаскивания на метке.
		            myPlacemark.events.add('dragend', function () {
		                getAddress(myPlacemark.geometry.getCoordinates());
		            });
		        }
		        getAddress(coords);
			});*/
			function setPoint(coords){
				 // Если метка уже создана – просто передвигаем ее
		        if(myPlacemark) {
		            myPlacemark.geometry.setCoordinates(coords);
		        }
		        // Если нет – создаем.
		        else {
		            myPlacemark = createPlacemark(coords);
		            myMap.geoObjects.add(myPlacemark);
		            // Слушаем событие окончания перетаскивания на метке.
		            myPlacemark.events.add('dragend', function () {
		                getAddress(myPlacemark.geometry.getCoordinates());
		            });
		        }
                if(time) clearTimeout(time); time = 0;
                time = setTimeout(function(){
                    myMap.panTo(coords, {delay: 10});
                }, 50);
		        //getAddress(coords);
			}
			// Слушаем клик на карте
		    myMap.events.add('click', function (e) {
		        var coords = e.get('coords');

		        // Если метка уже создана – просто передвигаем ее
		        if(myPlacemark) {
		            myPlacemark.geometry.setCoordinates(coords);
					if(time) clearTimeout(time);
					time = setTimeout(function(){
						myMap.panTo(coords, {delay: 10});
					}, 50);
		        }
		        // Если нет – создаем.
		        else {
		            myPlacemark = createPlacemark(coords);
		            myMap.geoObjects.add(myPlacemark);
		            // Слушаем событие окончания перетаскивания на метке.
		            myPlacemark.events.add('dragend', function () {
		                getAddress(myPlacemark.geometry.getCoordinates(), function(){
							map2X.val(myPlacemark.geometry.getCoordinates()[0]);
							map2Y.val(myPlacemark.geometry.getCoordinates()[1]);
						});
		            });
					if(time) clearTimeout(time);
					time = setTimeout(function(){
						myMap.panTo(coords, {delay: 10});
					}, 50);
		        }
		        getAddress(coords, function(){
					map2X.val(coords[0]);
					map2Y.val(coords[1]);
				});
		    });

			// Показать точку, если координаты уже есть
			if (map2X.val())
				map2X.trigger('keyup');

		    // Создание метки
		    function createPlacemark(coords) {
		        return new ymaps.Placemark(coords, {
		            iconContent: ''
		        }, {
		            preset: 'twirl#violetStretchyIcon',
		            draggable: true
		        });
		    }

		    // Определяем адрес по координатам (обратное геокодирование)
		    function getAddress(coords, callback) {
		        myPlacemark.properties.set('iconContent', '');
		        ymaps.geocode(coords).then(function (res) {
		            var firstGeoObject = res.geoObjects.get(0);

		            myPlacemark.properties
		                .set({
		                    //iconContent: firstGeoObject.properties.get('name')
		                    //balloonContent: firstGeoObject.properties.get('text')
		                });
					if (firstGeoObject && !locationInput.data('tainted'))
                        locationInput.val(firstGeoObject.properties.get('text'));
//                        input.val(firstGeoObject.properties.get('text'));
					pos.val(coords[0]+', '+coords[1]);

					if(typeof callback == 'function') callback();
		        });
		    }
		});
	}
}


var pageInit = {
	init: function(){
		this.clearInputs();
		this.form();
		this.datepicker();
		this.initSearch();
		this.initElastic();
        this.autoCommentHeight();
		this.initOpen();
		this.checkPeople();
		this.simpleboxlink()
		//this.index();
		this.tooltip();
		this.time();
		this.scrollHeight();
	},
	scrollHeight: function(){
		$('#map > .holder-post').each(function(){
			var hold = $(this);
			var header = $('#header');
			var k = 50;

			function resize(){
				hold.css({maxHeight: $(window).height() - header.outerHeight(true) - k});
			}
			resize();
			$(window).resize(function(){
				resize();
			});
		});
	},
	time: function(){
		$('.holder-time,.inner-new .time-and-date').each(function(){
			var hold = $(this);
			var time = hold.find('.time');
			var date = hold.find('.date-new');

			function setTime(){
				var temp = new Date();

				time.text(	(temp.getHours().toString().length > 1 ? temp.getHours() : '0'+temp.getHours()) + ' : ' +
							(temp.getMinutes().toString().length > 1 ? temp.getMinutes() : '0'+temp.getMinutes()));
				date.text(	temp.getFullYear() + ' / ' +
							((temp.getMonth()+1).toString().length > 1 ? (temp.getMonth()+1) : '0'+(temp.getMonth()+1)) + ' / ' +
							(temp.getDate().toString().length > 1 ? temp.getDate() : '0'+temp.getDate()));
			}
			setTime();

			setTimeout(function(){
				setTime();
				setTimeout(arguments.callee, 60000);
			}, 60000);
		});
	},
	tooltip: function(){
		jQuery('body').each(function(){
			var hold = $(this);
			var speed = 400;
			var x,y,w,h;
			var link = hold.find('a[data-title], input[data-title], textarea[data-title], button[data-title], label[data-title], div[data-title], span[data-title]');

			if(link.length > 0){
				hold.append('<div id="tooltip"><span class="text"></span><span class="bottom"></span></div>');
				var tooltip = hold.find('#tooltip');
				link.each(function(){
					var link = $(this);

					var title = link.attr('data-title');
					tooltip.css({opacity:'0'})

						link.mouseenter(function(el){
							x = el.pageX+20;
							y =el.pageY-20;

							link.removeAttr('data-title');
							tooltip.find('.text').empty().append(title);

							tooltip.css({ top: y, left:(x)}).stop().animate({opacity:1},{queue: false, duration: speed});

						});
						link.mousemove(function(e){
							x = e.pageX+20;
							y =e.pageY-20;
							tooltip.css({top: y, left:x})
						});
						link.mouseleave(function(){
							link.removeClass('hover');
							tooltip.animate({opacity:0},{queue: false, duration: speed, complete: function(){
									tooltip.find('.text').empty();
									tooltip.css({top: 0, left:0});
								}
							});
						});


				});
			}
		});
	},
	simpleboxlink: function(){
		jQuery('.simplebox').simplebox();
	},
	checkPeople: function(){
		$('.info.check-people').each(function(){
			var hold = $(this);
			var overlay = hold.find('.overlay-small');
			var holderSmall = hold.find('.holder-small');
			var inputAll = hold.find('.new-small-inp');
			var inputAllTotal = hold.find('.all-total');

			overlay.css({display: 'none'});

			inputAllTotal.bind('allTotal', function(){
				var all = 0;
				holderSmall.not(':first').each(function(){
					var wrap = $('.main-in > input', this);
					if((wrap.data('sum')/1).toString().toLowerCase() != 'nan') all += wrap.data('sum')/1;
				});
				inputAllTotal.val(all);
			});

			inputAll.bind('checkAll', function(){
				var all = 0;
				holderSmall.not(':first').each(function(){
					var wrap = $('.main-in > input', this);
					if((wrap.val()/1).toString().toLowerCase() != 'nan') all += wrap.val()/1;
				});
				inputAll.val(all);
			});

			holderSmall.not(':first').each(function(){
				var hold = $(this);
				var first = hold.find('.block > input').filter(':first');
				var other = hold.find('.block > input').not(':first');
				var box = other.parent();
				var plus = box.find('> a.plus');
				var tooltip = box.find('> .tooltip');
				var index;

				function sum(){
					var total = 0;
					other.each(function(){
						if(($(this).val()/1).toString().toLowerCase() != 'nan'){
							total += $(this).val()/1;
						}
					});
					first.val(total);
					if(first.val() == 0) first.val('');//.prop('disabled', false);
					first.data('sum', first.val());
                    first.trigger('change');
					//if(first.val() == '') first.prop('disabled', false);
					inputAll.trigger('checkAll');
					inputAllTotal.trigger('allTotal');
				}

				other.bind('keyup keydown keypress input', function(){
					//first.prop('disabled', true);
					sum();
				});

				plus.click(function(){
					index = plus.index(this);
					//first.prop('disabled', true);
					//other.eq(index).prop('disabled', true);
					overlay.fadeIn(300);
					tooltip.eq(index).addClass('tooltip--open').css({display: 'none'}).fadeIn(300);
//					if(tooltip.eq(index).find('li').length == 1){
//						tooltip.eq(index).find('li input:first-child').val(other.eq(index).val());
//					}
					if(tooltip.eq(index).find('li').length == 0){
						tooltip.eq(index).trigger('append').trigger('addInput');
						tooltip.eq(index).find('li input:first-child').val(other.eq(index).val());
					}
					return false;
				});

				tooltip.each(function(i){
					var wrap = $(this);
					wrap.data('clone', wrap.find('ul.list-lin > li:first').clone());
                    wrap.data('clone').find('input').each(function() {$(this).val('')});

					wrap.css({display: 'none'});

					wrap.bind('append', function(){
						var newEl = wrap.data('clone').clone();
						newEl.find('select.outtaHere').removeClass('outtaHere').prev().remove();
						wrap.find('ul.list-lin').append(newEl);
						newEl.customForm();
						$('.selectOptions.customSelect > div').customScrollV();
						remove();
					});

					wrap.find('a.add-new').click(function(){
                        if ($(this).hasClass('disabled'))
                            return false;
						wrap.trigger('append');
						addInput();
						return false;
					});

					function addInput(){
						wrap.find('ul.list-lin > li input:first-child').unbind('keyup keypress keydown input').bind('keyup keypress keydown input', function(){
							calc();
							sum();
						});
					}
					addInput();
                    wrap.bind('addInput', function() {
                       addInput();
                    });
					function remove(){
						wrap.find('ul.list-lin > li a.close-n').unbind('click').click(function(){
							if ($(this).hasClass('disabled'))
                                return false;

                            $(this).parent().remove();
							if(wrap.find('ul.list-lin > li').length == 0){
								overlay.fadeOut(300);
								tooltip.fadeOut(300, function(){
									tooltip.removeClass('tooltip--open');
								});
								other.eq(i).val('');//.prop('disabled', false);
							}
							calc();
							sum();

							return false;
						});
					}
					remove();

					function calc(){
						var total = 0;
						wrap.find('ul.list-lin > li input:first-child').each(function(){
							if (($(this).val() / 1).toString().toLowerCase() != 'nan') {
								total += $(this).val() / 1;
							}
						});
						other.eq(i).val(total);
						if(other.eq(i).val() == 0) other.eq(i).val('');
					};

                    calc();

					$(document).bind('click touchstart mousedown', function(e){
						if(wrap.is(':visible')){
							if(!($(e.target).parents().index(wrap) != -1 || $(e.target).index(wrap) != -1)){
								overlay.fadeOut(300);
								wrap.fadeOut(300, function(){
									wrap.removeClass('tooltip--open');
									//if(other.eq(i).val() == '') other.eq(i).prop('disabled', false);
								});
							}
						}
					});
				});

                sum();
			});
		});
	},
    autoCommentHeight: function() {
//        return;
        $('div.double, div.hight-box').each(function(){
			var $hold = $(this);
            var $box = $hold.find('.box');
            var $area = $box.find('textarea');

            $area.each(function() {
                var $a = $(this);
                if (!$a.text())
                    return;
                var $d = $('<div/>').width($a.width()).text($a.text()).css({
                    'font-size': $a.css('font-size'),
                    'line-height': $a.css('line-height'),
                    'font-family': $a.css('font-family'),
                    'white-space': 'pre-wrap',
                    'padding-top': $a.css('padding-top'),
                    'padding-right': $a.css('padding-right'),
                    'padding-bottom': $a.css('padding-bottom'),
                    'padding-left': $a.css('padding-left'),
//                    'overflow': 'hidden',
                    'position': 'absolute',
                    'display': 'none'
                });
                var h = $d.appendTo('body').height();
                $d.remove();
//                console.log(h);
                $a.height(h);
            })


        });
    },
	initOpen: function(){
		$('div.double, div.hight-box').each(function(){
			var hold = $(this),
				button = hold.find('.link-description, a.title'),
				box = hold.find('.box'),
				heightBoxStart = box.outerHeight(),
				speed = 300

			if (hold.hasClass('additional-strength')) {
				hold.find('.medical').css({marginTop: -heightBoxStart - 8})
			} else {
				box.css({marginTop: -heightBoxStart})
			}

			button.on('click', function() {
				var heightBoxDynamic = box.outerHeight(),
					parentAddHeight = heightBoxDynamic - heightBoxStart;

				if(hold.hasClass('open')) {
					hold.removeClass('open');
					box.animate({marginTop: -heightBoxDynamic}, {queue: false, duration: speed});
				} else {
					hold.addClass('open');
					if (parentAddHeight > 0)
						hold.closest('.character').height('100%')

					box.animate({marginTop: 0}, {queue: false, duration: speed});
				}
				return false;
			});
		})
	},
	initElastic: function(){
		$('textarea').each(function(){
			var hold = $(this);
			var h = hold.innerHeight()-8;

			hold.elastic();
			hold.css({height: h});
		})
	},
	initSearch: function(){
		$('div.drop').each(function(){
			var hold = $(this);
			var button = hold.find('.sample');
			var box = hold.find('.holder');
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
//			$("body").click(function(){
//				if(!box.hasClass('hovering')){
//					hold.removeClass('open');
//					box.animate({marginTop:-heightBox},{queue: false, duration: speed});
//				}
//			});
		})
	},
	form: function(){
		$('form').customForm();
		$('.selectOptions.customSelect > div').customScrollV();
	},
	datepicker: function(){
		$('.hold-data').each(function(){
			var hold = $(this);
			var link = hold.find('.ui-datepicker-trigger');
            if (!link.length)
                return;
			var close = $(link.attr('href')).find('.close');
			var box = $(link.attr('href'));
			var time = box.find('input#time-input');
			var input = hold.find('input:text');
			var picker = $('#datepicker').datepicker({
				closeText:"Закрыть",prevText:"&#x3c;Пред",nextText:"След&#x3e;",currentText:"Сегодня",monthNames:["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"],monthNamesShort:["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"],dayNames:["воскресенье","понедельник","вторник","среда","четверг","пятница","суббота"],dayNamesShort:["вск","пнд","втр","срд","чтв","птн","сбт"],dayNamesMin:["Вс","Пн","Вт","Ср","Чт","Пт","Сб"],weekHeader:"Нед",dateFormat:"dd.mm.yy",firstDay:1,isRTL:!1,showMonthAfterYear:!1,yearSuffix:"",
				showOtherMonths: true,
				selectOtherMonths: true,
				changeMonth: true,
				changeYear: true,
				onSelect: function(dateText, inst){
					input.val(dateText+' / '+time.val());
				}
			});

			time.bind('keyup keypress keydown', function(){
				var text = '';
				var arr = picker.datepicker('getDate');
				if(arr.getDate().toString().length == 1) text += '0'+arr.getDate().toString()+'.';
				else text += arr.getDate().toString()+'.';
				if((arr.getMonth()+1).toString().length == 1) text += '0'+(arr.getMonth()+1).toString()+'.';
				else text += (arr.getMonth()+1)+'.';
				text += arr.getFullYear();
				input.val(text+' / '+time.val());
			});

			link.click(function(){
				if ($(this).hasClass('disabled'))
					return false;
				if(!$.simplebox.modal){
					$.simplebox(link.attr('href'), {
						positionFrom: '.'+link.data('class'),
						overlay: false
					});
				}
				return false;
			});

			input.focus(function(){
				if(!$.simplebox.modal){
					$.simplebox(link.attr('href'), {
						positionFrom: '.'+link.data('class'),
						overlay: false
					});
				}
			});
			close.click(function(){
				if($.simplebox.modal && $.simplebox.modal.attr('id') == link.attr('href').replace('#', '')) $.simplebox.close();
				return false;
			});
		});
	},
	clearInputs: function(){
		$('input:text, input:password, textarea').not('.no-clear').each(function(){
			var _el = $(this);
			var _val = _el.val();
			_el.attr('alt', _val);
			_el.bind('focus', function(){
				if (this.value == _val) {
					this.value = '';
					$(this).parent().addClass('ready');
				}
				$(this).parent().addClass('input-focus');
			}).bind('blur', function(){
				if(this.value == '') {
					this.value = _val;
					$(this).parent().removeClass('ready');
				}
				$(this).parent().removeClass('input-focus');
			});
		});
	}
}

/**
 * jQuery Custom Form min v1.0.3
 * Copyright (c) 2012 JetCoders
 * email: yuriy.shpak@jetcoders.com
 * www: JetCoders.com
 * Licensed under the MIT License:
 * http://www.opensource.org/licenses/mit-license.php
 **/

;jQuery.fn.customForm = jQuery.customForm = function(_options) {
	var _this = this;
	if(typeof _this == 'function') _this = $(document);
	var options = jQuery.extend(true, {
		select: {
			elements: 'select.customSelect',
			structure: '<div class="selectArea"><a href="#" class="selectButton"><span class="center"></span><span class="right">&nbsp;</span></a><div class="disabled"></div></div>',
			text: '.center',
			btn: '.selectButton',
			optStructure: '<div class="selectOptions"><div><ul></ul></div></div>',
			maxHeight: false,
			optList: 'ul'
		},
		radio: {
			elements: 'input.customRadio',
			structure: '<div></div>',
			defaultArea: 'radioArea',
			checked: 'radioAreaChecked'
		},
		checkbox: {
			elements: 'input.customCheckbox',
			structure: '<div></div>',
			defaultArea: 'checkboxArea',
			checked: 'checkboxAreaChecked'
		},
		disabled: 'disabled',
		hoverClass: 'hover'
	}, _options);

	return _this.each(function() {
		var hold = jQuery(this);
		var reset = jQuery();
		if(this !== document) reset = hold.find('input:reset, button[type=reset]');

		initSelect(hold.find(options.select.elements), hold, reset);
		initRadio(hold.find(options.radio.elements), hold, reset);
		initCheckbox(hold.find(options.checkbox.elements), hold, reset);
	});

	function initSelect(elements, form, reset){
		elements.not('.outtaHere').each(function(){
			var select = $(this);
			var replaced = jQuery(options.select.structure);
			var selectText = replaced.find(options.select.text);
			var selectBtn = replaced.find(options.select.btn);
			var selectDisabled = replaced.find('.'+options.disabled).hide();
			var optHolder = jQuery(options.select.optStructure);
			var optList = optHolder.find(options.select.optList);
			var html = '';
			var optTimer;

			if(select.prop('disabled')) selectDisabled.show();
			select.find('option').each(function() {
				var selOpt = jQuery(this);
				if (selOpt.val() == select.val()) {
					selectText.html(selOpt.html());
					if (!selOpt.data('text'))
						html += '<li data-value="' + selOpt.val() + '" class="selected"><a href="#">' + selOpt.html() + '</a></li>';
					else
						html += '<li data-value="' + selOpt.val() + '" class="selected"><a href="#">' + selOpt.html() + '</a><div class="tooltip-select">' + selOpt.data('text') + '</div></li>';
				}
				else {
					if(!selOpt.data('text')) html += '<li data-value="'+selOpt.val()+'"><a href="#">' + selOpt.html() + '</a></li>';
					else html += '<li data-value="' + selOpt.val() + '"><a href="#">' + selOpt.html() + '</a><div class="tooltip-select">' + selOpt.data('text') + '</div></li>';
				}
			});
			optList.append(html).find('a').click(function() {
				optList.find('li').removeClass('selected');
				jQuery(this).parent().addClass('selected');
				select.val(jQuery(this).parent().attr('data-value'));
				selectText.html(jQuery(this).html());
				select.change();
				replaced.removeClass(options.hoverClass);
				optHolder.css({left:-9999, top:-9999});
				return false;
			}).hover(function(){
				replaced.append($(this).parent().find('.tooltip-select'));
			}, function(){
				$(this).parent().append(replaced.find('.tooltip-select'));
			});
			replaced.width(select.outerWidth());
			replaced.insertBefore(select);
			replaced.addClass(select.attr('class'));
				optHolder.css({
					width: select.outerWidth(),
					position: 'absolute',
					left:-9999, top:-9999
				});
			optHolder.addClass(select.attr('class'));
			jQuery(document.body).append(optHolder);

			replaced.hover(function() {
				if(optTimer) clearTimeout(optTimer);
			}, function() {
				optTimer = setTimeout(function() {
					replaced.removeClass(options.hoverClass);
					optHolder.css({left:-9999, top:-9999});
				}, 200);
			});
			optHolder.hover(function(){
				if(optTimer) clearTimeout(optTimer);
			}, function() {
				optTimer = setTimeout(function() {
					replaced.removeClass(options.hoverClass);
					optHolder.css({left:-9999, top:-9999});
				}, 200);
			});
			selectBtn.click(function() {
				if(optHolder.offset().top > 0) {
					replaced.removeClass(options.hoverClass);
					optHolder.css({left:-9999, top:-9999});
				}
				else{
					replaced.addClass(options.hoverClass);
					optHolder.children('ul').css({height:'auto', overflow:'hidden'});
					select.removeClass('outtaHere');
					optHolder.css({
						width: select.outerWidth()
					});
					select.addClass('outtaHere');
					optHolder.css({
						top: replaced.offset().top + replaced.outerHeight(),
						left: replaced.offset().left,
						display: 'block'
					});
					replaced.focus();
					if(options.select.maxHeight && optHolder.children('ul').height() > options.select.maxHeight) optHolder.children('ul').css({height:options.select.maxHeight, overflow:'auto'});
				}
				return false;
			});
			reset.click(function(){
				setTimeout(function(){
					select.find('option').each(function(i) {
						var selOpt = jQuery(this);
						if(selOpt.val() == select.val()) {
							selectText.html(selOpt.html());
							optList.find('li').removeClass('selected');
							optList.find('li').eq(i).addClass('selected');
						}
					});
				}, 10);
			});
			select.change(function(){
				if(optHolder.offset().top < 0){
					select.find('option').each(function(i) {
						var selOpt = jQuery(this);
						if(selOpt.val() == select.val()) {
							selectText.html(selOpt.html());
							optList.find('li').removeClass('selected');
							optList.find('li').eq(i).addClass('selected');
						}
					});
				}
			});

			$(window).resize(function(){
				select.removeClass('outtaHere');
				replaced.width(Math.floor(select.outerWidth()));
				select.addClass('outtaHere');
			});
		}).addClass('outtaHere');
	}

	function initRadio(elements, form, reset){
		elements.each(function(){
			var radio = $(this);
			this._label = $('label[for='+radio.attr('id')+']').length ? $('label[for='+radio.attr('id')+']') : radio.parents('label');
			if(!radio.hasClass('outtaHere') && radio.is(':radio')){
				var replaced = jQuery(options.radio.structure);
				replaced.addClass(radio.attr('class'));
				this._replaced = replaced;
				if(radio.is(':disabled')) {
					replaced.addClass(options.disabled);
					if(radio.is(':checked')) replaced.addClass('disabledChecked');
				}
				else if (radio.is(':checked')) {
					replaced.addClass(options.radio.checked);
					this._label.addClass('checked');
				}
				else {
					replaced.addClass(options.radio.defaultArea);
					this._label.removeClass('checked');
				}
				replaced.click(function(){
					if(jQuery(this).hasClass(options.radio.defaultArea)){
						radio.change();
						radio.prop('checked', true);
						changeRadio(radio.get(0));
					}
				});
				reset.click(function(){
					setTimeout(function(){
						if(radio.is(':checked')) replaced.removeClass(options.radio.defaultArea+' '+options.radio.checked).addClass(options.radio.checked);
						else replaced.removeClass(options.radio.defaultArea+' '+options.radio.checked).addClass(options.radio.defaultArea);
					}, 10);
				});
				radio.click(function(){
					changeRadio(this);
				});
				replaced.insertBefore(radio);
				radio.addClass('outtaHere');
			}
		});

	}

	function changeRadio(_this){
		jQuery('input:radio[name="'+jQuery(_this).attr("name")+'"]').not(_this).each(function(){
			if (this._replaced && !jQuery(this).is(':disabled')) {
				this._replaced.removeClass(options.radio.defaultArea+' '+options.radio.checked).addClass(options.radio.defaultArea);
				this._label.removeClass('checked');
			}
		});
		_this._replaced.removeClass(options.radio.defaultArea+' '+options.radio.checked).addClass(options.radio.checked);
		_this._label.addClass('checked');
		jQuery(_this).trigger('change');
	}

	function initCheckbox(elements, form, reset){
		elements.each(function(){
			var checkbox = $(this);
			this._label = $('label[for='+checkbox.attr('id')+']').length ? $('label[for='+checkbox.attr('id')+']') : checkbox.parents('label');
			if(!checkbox.hasClass('outtaHere') && checkbox.is(':checkbox')){
				var replaced = jQuery(options.checkbox.structure);
				replaced.addClass(checkbox.attr('class'));
				this._replaced = replaced;
				if(checkbox.is(':disabled')) {
					replaced.addClass(options.disabled);
					if(checkbox.is(':checked')) replaced.addClass('disabledChecked');
				}
				else if(checkbox.is(':checked')) {
					replaced.addClass(options.checkbox.checked);
					this._label.addClass('checked');
				}
				else {
					replaced.addClass(options.checkbox.defaultArea);
					this._label.removeClass('checked');
				}

				replaced.click(function(){
					if(!replaced.hasClass('disabled') && !replaced.parents('label').length){
						if(checkbox.is(':checked')) checkbox.prop('checked', false);
						else checkbox.prop('checked', true);
						changeCheckbox(checkbox);
					}
				});
				reset.click(function(){
					setTimeout(function(){
						changeCheckbox(checkbox);
					}, 10);
				});
				checkbox.click(function(){
					changeCheckbox(checkbox);
				});
				replaced.insertBefore(checkbox);
				checkbox.addClass('outtaHere');
				replaced.parents('label').click(function(){
					if(!replaced.hasClass('disabled')){
						if(checkbox.is(':checked')) checkbox.prop('checked', false);
						else checkbox.prop('checked', true);
						changeCheckbox(checkbox);
					}
					return false;
				});
			}
		});
	}

	function changeCheckbox(_this){
		if (_this.is(':checked')) {
			_this.get(0)._replaced.removeClass(options.checkbox.defaultArea + ' ' + options.checkbox.checked).addClass(options.checkbox.checked);
			_this.get(0)._label.addClass('checked');
		}
		else {
			_this.get(0)._replaced.removeClass(options.checkbox.defaultArea+' '+options.checkbox.checked).addClass(options.checkbox.defaultArea);
			_this.get(0)._label.removeClass('checked');
		}
		_this.trigger('change');
	}
};

/**
 * jQuery Vertical Custom Scroll v1.0.0
 * Copyright (c) 2013 JetCoders
 * email: yuriy.shpak@jetcoders.com
 * www: JetCoders.com
 * Licensed under the MIT License:
 * http://www.opensource.org/licenses/mit-license.php
 **/

jQuery.uaMatch=function(ua){ua=ua.toLowerCase();var match=/(chrome)[ \/]([\w.]+)/.exec(ua)||/(webkit)[ \/]([\w.]+)/.exec(ua)||/(opera)(?:.*version|)[ \/]([\w.]+)/.exec(ua)||/(msie) ([\w.]+)/.exec(ua)||ua.indexOf("compatible")<0&&/(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua)||[];return{browser:match[1]||"",version:match[2]||"0"};};if(!jQuery.browser){matched=jQuery.uaMatch(navigator.userAgent);browser={};if(matched.browser){browser[matched.browser]=true;browser.version=matched.version;}if(browser.chrome){browser.webkit=true;}else if(browser.webkit){browser.safari=true;}jQuery.browser=browser;};
var types=['DOMMouseScroll','mousewheel'];if($.event.fixHooks){for(var i=types.length;i;){$.event.fixHooks[types[--i]]=$.event.mouseHooks;}}$.event.special.mousewheel={setup:function(){if(this.addEventListener){for(var i=types.length;i;){this.addEventListener(types[--i],handler,false);}}else{this.onmousewheel=handler;}},teardown:function(){if(this.removeEventListener){for(var i=types.length;i;){this.removeEventListener(types[--i],handler,false);}}else{this.onmousewheel=null;}}};$.fn.extend({mousewheel:function(fn){return fn?this.bind("mousewheel",fn):this.trigger("mousewheel");},unmousewheel:function(fn){return this.unbind("mousewheel",fn);}});
function handler(event){var orgEvent=event||window.event,args=[].slice.call(arguments,1),delta=0,returnValue=true,deltaX=0,deltaY=0;event=$.event.fix(orgEvent);event.type="mousewheel";if(orgEvent.wheelDelta){delta=orgEvent.wheelDelta/120;}if(orgEvent.detail){delta=-orgEvent.detail/3;}deltaY=delta;if(orgEvent.axis!==undefined&&orgEvent.axis===orgEvent.HORIZONTAL_AXIS){deltaY=0;deltaX=-1*delta;}if(orgEvent.wheelDeltaY!==undefined){deltaY=orgEvent.wheelDeltaY/120;}if(orgEvent.wheelDeltaX!==undefined){deltaX=-1*orgEvent.wheelDeltaX/120;}args.unshift(event,delta,deltaX,deltaY);return($.event.dispatch||$.event.handle).apply(this,args);}
jQuery.easing['jswing']=jQuery.easing['swing'];jQuery.extend(jQuery.easing,{def:'easeOutQuad',swing:function(x,t,b,c,d){return jQuery.easing[jQuery.easing.def](x,t,b,c,d);},easeOutQuad:function(x,t,b,c,d){return-c*(t/=d)*(t-2)+b;},easeOutCirc:function(x,t,b,c,d){return c*Math.sqrt(1-(t=t/d-1)*t)+b;}});
jQuery.fn.customScrollV = function(_options){
var _options = jQuery.extend({
	lineWidth: 24 /* this parameter sets the width of the scroll*/
}, _options);
return this.each(function(){
	var _box = jQuery(this);
	if(_box.is(':visible')){
		if(_box.children('.scroll-content').length == 0){
			var line_w = _options.lineWidth;
			/*--- init part ---*/
			var scrollBar = jQuery(	'<div class="vscroll-bar">'+
									'	<div class="scroll-up"></div>'+
									'	<div class="scroll-line">'+
									'		<div class="scroll-slider">'+
									'			<div class="scroll-slider-c"></div>'+
									'		</div>'+
									'	</div>'+
									'	<div class="scroll-down"></div>'+
									'</div>');
			_box.wrapInner('<div class="scroll-content"><div class="scroll-hold"></div></div>').append(scrollBar);
			var scrollContent = _box.children('.scroll-content');
			var scrollSlider = scrollBar.find('.scroll-slider');
			var scrollSliderH = scrollSlider.parent();
			var scrollUp = scrollBar.find('.scroll-up');
			var scrollDown = scrollBar.find('.scroll-down');
			/*--- different variables ---*/
			var box_h = _box.height();
			var slider_h = 0;
			var slider_f = 0;
			var cont_h = scrollContent.height();
			var _f = false;
			var _f1 = false;
			var _f2 = true;
			var _t1, _t2, _s1, _s2;
			/* for touch */
			var kkk = 0, start = 0, _time, flag = true;
			/*--- set styles ---*/
			_box.css({
				position: 'relative',
				overflow: 'hidden',
				height: box_h
			});
			scrollContent.css({
				position: 'absolute',
				top: 0,
				left: 0,
				zIndex: 1,
				height: 'auto'
			});
			scrollBar.css({
				position: 'absolute',
				top: 0,
				right: 0,
				zIndex:2,
				width: line_w,
				height: box_h,
				overflow: 'hidden'
			});
			scrollUp.css({
				width: line_w,
				height: line_w,
				overflow: 'hidden',
				cursor: 'pointer'
			});
			scrollDown.css({
				width: line_w,
				height: line_w,
				overflow: 'hidden',
				cursor: 'pointer'
			});
			slider_h = scrollBar.height();
			if(scrollUp.is(':visible')) slider_h -= scrollUp.height();
			if(scrollDown.is(':visible')) slider_h -= scrollDown.height();
			scrollSliderH.css({
				position: 'relative',
				width: line_w,
				height: slider_h,
				overflow: 'hidden'
			});
			slider_h = 0;
			scrollSlider.css({
				position: 'absolute',
				top: 0,
				left: 0,
				width: line_w,
				height: slider_h,
				overflow: 'hidden',
				cursor: 'pointer'
			});
			box_h = _box.height();
			cont_h = scrollContent.height();
			if(box_h < cont_h){
				_f = true;
				slider_h = Math.round(box_h/cont_h*scrollSliderH.height());
				if(slider_h < 5) slider_h = 5;
				scrollSlider.height(slider_h);
				slider_h = scrollSlider.outerHeight();
				slider_f = (cont_h - box_h)/(scrollSliderH.height() - slider_h);
				_s1 = (scrollSliderH.height() - slider_h)/15;
				_s2 = (scrollSliderH.height() - slider_h)/3;
				scrollContent.children('.scroll-hold').css('padding-right', scrollSliderH.width());
			}
			else{
				_f = false;
				scrollBar.hide();
				scrollContent.css({width: _box.width(), top: 0, left:0});
				scrollContent.children('.scroll-hold').css('padding-right', 0);
			};
			var _top = 0;
			/*--- element's events ---*/
			scrollUp.bind('mousedown', function(){
				_top -= _s1;
				scrollCont();
				_t1 = setTimeout(function(){
					_t2 = setInterval(function(){
						_top -= 4/slider_f;
						scrollCont();
					}, 20);
				}, 500);
				return false;
			}).mouseup(function(){
				if(_t1) clearTimeout(_t1);
				if(_t2) clearInterval(_t2);
			}).mouseleave(function(){
				if(_t1) clearTimeout(_t1);
				if(_t2) clearInterval(_t2);
			});
			scrollDown.bind('mousedown', function(){
				_top += _s1;
				scrollCont();
				_t1 = setTimeout(function(){
					_t2 = setInterval(function(){
						_top += 4/slider_f;
						scrollCont();
					}, 20);
				}, 500);
				return false;
			}).mouseup(function(){
				if(_t1) clearTimeout(_t1);
				if(_t2) clearInterval(_t2);
			}).mouseleave(function(){
				if(_t1) clearTimeout(_t1);
				if(_t2) clearInterval(_t2);
			});
			scrollSliderH.click(function(e){
				if(_f2){
					_top = e.pageY - scrollSliderH.offset().top - scrollSlider.outerHeight()/2;
					scrollCont();
				}
				else{
					_f2 = true;
				};
			});
			var t_y = 0;
			var tttt_f = (jQuery.browser.msie)?(true):(false);
			scrollSlider.mousedown(function(e){
				t_y = e.pageY - jQuery(this).position().top;
				_f1 = true;
				return false;
			}).mouseup(function(){
				_f1 = false;
			});
			jQuery('body').bind('mousemove', function(e){
				if(_f1){
					 _f2 = false;
					 _top = e.pageY - t_y;
					 if(tttt_f) document.selection.empty();
					 scrollCont();
				}
			}).mouseup(function(){
				_f1 = false;
			});

			/* touch event start */
			scrollSlider.bind('touchstart', function(e){
				if(_time) clearTimeout(_time);
				scrollSlider.stop();
				scrollContent.stop();
				kkk = e.originalEvent.pageY;
				e.preventDefault();
				e.stopPropagation();
				return false;
			}).bind('touchmove', function(e){
				if(_f){
					_f = false;
					if(kkk > e.originalEvent.pageY) _top -=1*Math.abs(e.originalEvent.pageY - kkk);
					else _top -=-1*Math.abs(e.originalEvent.pageY - kkk);
					scrollCont();
					kkk = e.originalEvent.pageY;
					_f = true;
					if ((_top > 0) && (_top + slider_h < scrollSliderH.height())) {
						return false;
					}
				}
				e.preventDefault();
				e.stopPropagation();
				return false;
			}).bind('touchend', function(e){
				e.preventDefault();
				e.stopPropagation();
				return false;
			});

			_box.bind('touchstart', function(e){
				if(_time) clearTimeout(_time);
				scrollSlider.stop();
				scrollContent.stop();
				kkk = e.originalEvent.pageY;
				start = kkk;
				flag = true;
			}).bind('touchmove', function(e){
				if(_f){
					_f = false;
					if(kkk > e.originalEvent.pageY) _top -=-1*Math.abs(e.originalEvent.pageY - kkk)/(cont_h/box_h);
					else _top -=1*Math.abs(e.originalEvent.pageY - kkk)/(cont_h/box_h);
					scrollCont();
					kkk = e.originalEvent.pageY;
					_f = true;
					_time = setTimeout(function(){
						flag = false;
					}, 200);
					if ((_top > 0) && (_top + slider_h < scrollSliderH.height())) {
						if(start+30 < start+Math.abs(e.originalEvent.pageY)) return false;
					}
				}

				if (start + 30 < start + Math.abs(e.originalEvent.pageY)) {
					e.preventDefault();
					e.stopPropagation();
					return false;
				}
			}).bind('touchend', function(e){
				if(flag && Math.abs(start - kkk) > 80){
					_top += (start - kkk)/3;
					if(_top < 0) _top = 0;
					else if(_top+slider_h > scrollSliderH.height()) _top = scrollSliderH.height() - slider_h;
					scrollSlider.animate({top: _top}, {queue:false, easing: 'easeOutCirc', duration: 300*Math.abs(start - kkk)/40});
					scrollContent.animate({top: -_top*slider_f}, {queue:false, easing: 'easeOutCirc', duration: 300*Math.abs(start - kkk)/40});
				}
				e.preventDefault();
				e.stopPropagation();
				return false;
			});
			scrollUp.bind('touchstart', function(){
				_top -= _s1;
				scrollCont();
				e.preventDefault();
				e.stopPropagation();
				return false;
			}).bind('touchend', function(e){
				e.preventDefault();
				e.stopPropagation();
				return false;
			}).bind('touchmove', function(e){
				e.preventDefault();
				e.stopPropagation();
				return false;
			});
			scrollDown.bind('touchstart', function(){
				_top += _s1;
				scrollCont();
				e.preventDefault();
				e.stopPropagation();
				return false;
			}).bind('touchend', function(e){
				e.preventDefault();
				e.stopPropagation();
				return false;
			}).bind('touchmove', function(e){
				e.preventDefault();
				e.stopPropagation();
				return false;
			});
			/* touch event end */

			document.body.onselectstart = function(){
				if(_f1) return false;
			};
			if(!_box.hasClass('not-scroll')){
				_box.bind('mousewheel', function(event, delta){
					if(_f){
						_top -=delta*_s1;
						scrollCont();
						//if((_top > 0) && (_top+slider_h < scrollSliderH.height())) return false;
						return false;
					}
				});
			};
			function scrollCont(){
				if(_top < 0) _top = 0;
				else if(_top+slider_h > scrollSliderH.height()) _top = scrollSliderH.height() - slider_h;
				scrollSlider.css('top', _top);
				scrollContent.css('top', -_top*slider_f);
			};
			this.scrollResize = function(){
				box_h = _box.height();
				cont_h = scrollContent.height();
				if(box_h < cont_h){
					_f = true;
					scrollBar.show();
					scrollBar.height(box_h);
					slider_h = scrollBar.height();

					if(scrollUp.is(':visible')) slider_h -= scrollUp.height();
					if(scrollDown.is(':visible')) slider_h -= scrollDown.height();
					scrollSliderH.height(slider_h);
					slider_h = Math.round(box_h/cont_h*scrollSliderH.height());
					if(slider_h < 5) slider_h = 5;
					scrollSlider.height(slider_h);
					slider_h = scrollSlider.outerHeight();
					slider_f = (cont_h - box_h)/(scrollSliderH.height() - slider_h);
					if(cont_h + scrollContent.position().top < box_h) scrollContent.css('top', -(cont_h - box_h));
					_top = - scrollContent.position().top/slider_f;
					scrollSlider.css('top', _top);
					_s1 = (scrollSliderH.height() - slider_h)/15;
					_s2 = (scrollSliderH.height() - slider_h)/3;
					scrollContent.children('.scroll-hold').css('padding-right', scrollSliderH.width());
				}
				else{
					_f = false;
					scrollBar.hide();
					scrollContent.css({top: 0, left:0});
					scrollContent.children('.scroll-hold').css('padding-right', 0);
				};
			};

			setInterval(function(){
				if(_box.is(':visible') && cont_h != scrollContent.height()) _box.get(0).scrollResize();
			}, 200);

		}
		else{
			this.scrollResize();
		};
	};
})};

/**
 * jQuery simplebox v2.0.0
 * Copyright (c) 2013 JetCoders
 * email: yuriy.shpak@jetcoders.com
 * www: JetCoders.com
 * Licensed under the MIT License:
 * http://www.opensource.org/licenses/mit-license.php
 **/

;(function(e){var t=function(t,n){if(e.simplebox.modal){var i=e.simplebox.modal.data("simplebox");i.onClose(e.simplebox.modal);e.simplebox.modal.fadeOut(i.duration,function(){e.simplebox.modal.css({left:"-9999px"}).show();i.afterClose(e.simplebox.modal);e.simplebox.modal.removeData("simplebox");e.simplebox.modal=false;r(t,n)})}else r(t,n)},n=function(){return e(document).width()>e("body").width()?e(document).width():jQuery("body").width()},r=function(t,r){e.simplebox.modal=e(t);e.simplebox.modal.data("simplebox",r);var o=e.simplebox.modal.data("simplebox");o.btnClose=e.simplebox.modal.find(o.linkClose);var u=e(window).scrollTop()+e(window).height()/2-e.simplebox.modal.outerHeight(true)/2;if(u<0)u=0;if(u+e.simplebox.modal.outerHeight(true)>e(document).height())u=e(document).height()-e.simplebox.modal.outerHeight(true);if(!o.positionFrom){e.simplebox.modal.css({zIndex:1e3,top:u,left:n()/2-e.simplebox.modal.outerWidth(true)/2}).hide()}else{e.simplebox.modal.css({zIndex:1e3,top:e(o.positionFrom).offset().top+e(o.positionFrom).outerHeight(true),left:e(o.positionFrom).offset().left}).hide()}i(o);s(o,o.btnClose);if(o.overlay.closeClick)s(o,e.simplebox.overlay)},i=function(t){t.onOpen(e.simplebox.modal);if(t.overlay){e.simplebox.overlay.css({background:t.overlay.color,opacity:t.overlay.opacity}).fadeIn(t.duration,function(){e.simplebox.modal.fadeIn(t.duration,function(){e.simplebox.busy=false;t.afterOpen(e.simplebox.modal)})})}else{e.simplebox.overlay.fadeOut(t.duration);e.simplebox.modal.fadeIn(t.duration,function(){e.simplebox.busy=false;t.afterOpen(e.simplebox.modal)})}},s=function(t,n){n.unbind("click.simplebox").bind("click.simplebox",function(){if(!e.simplebox.busy){e.simplebox.busy=true;t.onClose(e.simplebox.modal);e.simplebox.modal.fadeOut(t.duration,function(){e.simplebox.modal.css({left:"-9999px"}).show();e.simplebox.overlay.fadeOut(t.duration,function(){t.afterClose(e.simplebox.modal);e.simplebox.modal.removeData("simplebox");e.simplebox.modal=false;e.simplebox.busy=false})})}return false})},o={init:function(n){e(this).unbind("click.simplebox").bind("click.simplebox",function(){var r=e(this).data("simplebox");if(!e(this).hasClass(u.disableClass)&&!e.simplebox.busy){e.simplebox.busy=true;t(e(this).attr("href")?e(this).attr("href"):e(this).data("href"),jQuery.extend(true,{},u,n))}return false});return this},option:function(t,n){if(n){return this.each(function(){var r=e(this).data("simplebox");if(r)r[t]=n})}else{var r=[];this.each(function(){var n=e(this).data("simplebox");if(n)r.push(n[t])});if(r.length>1)return r;else return r[0]}}},u={duration:300,linkClose:".close, a.btn-close",disableClass:"disabled",overlay:{box:"simplebox-overlay",color:"black",closeClick:true,opacity:.3},positionFrom:false,onOpen:function(){},afterOpen:function(){},onClose:function(){},afterClose:function(){}};e.fn.simplebox=function(t){if(o[t]){return o[t].apply(this,Array.prototype.slice.call(arguments,1))}else{if(typeof t==="object"||!t){return o.init.apply(this,arguments)}else{e.error("Method "+t+" does not exist on jQuery.simplebox")}}};e.simplebox=function(n,r){if(!e.simplebox.busy){e.simplebox.busy=true;t(n,jQuery.extend(true,{},u,r))}};e.simplebox.init=function(){if(!e.simplebox.overlay){e.simplebox.overlay=jQuery('<div class="'+u.overlay.box+'"></div>');jQuery("body").append(e.simplebox.overlay);e.simplebox.overlay.css({position:"fixed",zIndex:999,left:0,top:0,width:"100%",height:"100%",background:u.overlay.color,opacity:u.overlay.opacity}).hide()}e(window).bind("resize.simplebox",function(){if(e.simplebox.modal&&e.simplebox.modal.is(":visible")){var t=e.simplebox.modal.data("simplebox");if(!t.positionFrom){e.simplebox.modal.animate({left:n()/2-e.simplebox.modal.outerWidth(true)/2},{queue:false,duration:e.simplebox.modal.data("simplebox").duration})}else{e.simplebox.modal.animate({top:e(t.positionFrom).offset().top+e(t.positionFrom).outerHeight(true),left:e(t.positionFrom).offset().left},{queue:false,duration:e.simplebox.modal.data("simplebox").duration})}}})};e.simplebox.close=function(){if(e.simplebox.modal&&!e.simplebox.busy){var t=e.simplebox.modal.data("simplebox");e.simplebox.busy=true;t.onClose(e.simplebox.modal);e.simplebox.modal.fadeOut(t.duration,function(){e.simplebox.modal.css({left:"-9999px"}).show();if(e.simplebox.overlay)e.simplebox.overlay.fadeOut(t.duration,function(){t.afterClose(e.simplebox.modal);e.simplebox.modal.removeData("simplebox");e.simplebox.modal=false;e.simplebox.busy=false});else{t.afterClose(e.simplebox.modal);e.simplebox.modal.removeData("simplebox");e.simplebox.modal=false;e.simplebox.busy=false}})}};e(document).ready(function(){e.simplebox.init()})})(jQuery);
