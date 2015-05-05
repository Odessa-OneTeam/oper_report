"use strict"
// настройка обновления записи о создаваемом донесении
var creatingUpdate = {
	enabled: true,
	updateTime: (typeof CreatingValidTime != 'undefined') ? CreatingValidTime - 10 : 50,
	updateInterval: 0
};

$(document).ready(function(){

    // отключить звук
    $('.index .holder-operatop').each(function() {
        var $hold = $(this);
        if (!globalOptions.soundEnabled)
            $('#imageMuteSound').show();
        $hold.on('click', function(e) {
            if (!e.ctrlKey)
                return;
            $.post('/', 'mute=1', function(data) {
                if ('muted' == data) {
                    globalOptions.soundEnabled = false;
                    $('#imageMuteSound').fadeIn(300);
                } else {
                    globalOptions.soundEnabled = true;
                    $('#imageMuteSound').fadeOut(300);
                }
            }, 'text');
        });
    });



	$('#kindID').on('change', function(e) {
		var $select = $(this);
		var kindID = $select.val();
        var $typeSelect = $('#typeID');
        var optional = $typeSelect.hasClass('optional');
		// чтобы запрос не шел при выборе того же значения
		if ($select.data.prevVal && ($select.data.prevVal == kindID))
			return;
		$select.data.prevVal = kindID;
        var data = {kindID: kindID};
        if (optional)
            data.optional = true;
		$.post('/get/estypes/', data,
		function(data, status) {
			if (typeof data.error != 'undefined')
			{
				alert(data.error);
				return;
			}
			if (typeof data.types != 'undefined')
			{
				var $newSelect = $('<select/>').attr({id: 'typeID', name: 'typeID'}).addClass('customSelect');
                if (optional)
                {
                    $newSelect.addClass('optional');
                    $newSelect.append('<option value=""> - </option>');
                }

				$.each(data.types, function(key, val) {
					$newSelect.append('<option value="' + val.typeID + '" data-text="' + val.criterion + '">' + val.name + '</option>');
				});
				$typeSelect.parent().empty().append($newSelect);
				// reinit custom select
				$('form').each(function(){
					jQuery(this).customForm();
					$('.selectOptions.customSelect > div').customScrollV();
				});
			}
		},
		'json');
	});
	$('.registration').click(
		function() {
            $('.registration-popup-overlay').toggle();
            $('.registration-popup').toggle();

            return false;
        }
    );
	$('.close-modal').click(
		function() {
            $('.registration-popup-overlay').hide();
            $('.registration-popup').hide();

            return false;
        }
    );
    $('.disclaimer-rights').on('click', function() {
        $('.disclaimer-popup').show();

        return false;
    });
    $('.close-disclaimer').on('click', function() {
        $('.disclaimer-popup').hide();

        return false;
    });

    // captcha
    $('img.captcha-img').each(function () {
        var $hold = $(this);
        $hold.css('cursor', 'pointer');
        var src = $hold.attr('src');

        $hold.on('click', function() {
            $hold.attr('src', src + '?' +  Math.floor(Math.random() * (10000)));
        });
    });

	// целочисленные поля
	$('form').on('keyup input', 'input.numeric', function(e) {
		var $this = $(this);
		$this.val($this.val().replace(/[^0-9]/g, ''));
	});

        //русские буквы
        $('form').on('keyup input', 'input.russian', function(e) {
		var $this = $(this);
		$this.val($this.val().replace(/[^а-яёА-ЯЁ]/g, ''));
	});




	// Обработка форм
	if (typeof jQuery.fn.ajaxForm != 'undefined') {
        /* отправка формы статистика */
//        $('#FormFilterSubmit').on('click', function(){
//            $('.statistic-form-class-for-ajax').ajaxForm({
//               	dataType: 'JSON',
//                type: 'POST',
//                beforeSubmit: StatSubmit(),
//                success: StatResponseHandler()
//            });
//        });
//
//        $('#main').ajaxForm({
//			dataType: 'JSON',
//			type: 'POST',
//			beforeSubmit: StatsMainSubmit,
//			success: StatsMainResponseHandler
//		});

        $('#stat_form').ajaxForm({
//            processData: false,
//            contentType: false,
            beforeSubmit: function() {

            },
            success: function(data, jqHXR) {
//                console.log(data);
                if (data.error) {
                    $.jGrowl(data.error);
                    if (data.reload) {
                        window.setTimeout(function() {window.location.reload()}, 1000);
                    }

                    return;
                }
                if (data.data) {
                    if (Grid.initialized)
                        Grid.unload();
                    Grid.init({
                        object: '#grid',
                        pager: '#pager',
                        postData: $('#stat_form').serializeObject(),
                        datatype: 'local',
                        colNames: data.colNames,
                        colModel: data.colModel,
                        beforeRequest: function() {
                            return true;
                        }
                    });
                    Grid.addData(data.data);
                    // Switch grid online
                    Grid.setGridParam({datatype: 'json'});

                    $('#resultEsStatus').text($('select[name="status"] :selected').text());
                    var types = '';
                    var $cbs = $('#primaryCB,#subsequentCB,#finalCB').filter(':checked');
                    if ($cbs.length === 3) {
                        types = 'Все';
                    } else {
                        types = [];
                        $cbs.each(function() {
                            var $cb = $(this);
//                            console.log($cb.parent().find('label').text());
                            types.push($cb.parent().find('label').text())
                        });
                        types = types.join(', ');
                    }
                    $('#resultReportType').text(types);
                }
            },
            error: function() {
                alert('Ошибка отправки формы. Попробуйте позже');
            }

        });

        // reset stat form
        $('#stat_form .reset-filter a').on('click', function() {
            $('#stat_form').get(0).reset();
            $('#stat_form select').trigger('change');
            $('#stat_form').find('span.with-eye').empty().removeClass('with-eye').addClass('without-eye');

            return false;
        });

		$('#initial-form,#subsequent-form,#final-form,#multipane-form').ajaxForm({
			dataType: 'JSON',
			type: 'POST',
			beforeSubmit: ReportSubmit,
			success: ReportResponseHandler
		});

		$('#initial-form,#subsequent-form,#final-form').not('.add').on('change', 'input,select,textarea', function(e) {
			var name = $(this).attr('name');
			$('label[for="' + name + '"]').addClass('changes');
		});

		$('#initial-form,#subsequent-form,#final-form,#multipane-form').each(function() {
			var $form = $(this);
            var poll;

            $(window).on('beforeunload', function(e) {
                if (poll)
                    poll.stop(false);
            });

			$form.not('.add').on('change', function(e) {
				$(this).data.changed = true;
				$(window).on('beforeunload', PageLeave);
			});

			// обновление блокировки
			if (!$form.hasClass('add') && !$form.hasClass('locked') && !$form.hasClass('disabled'))
			{
				var updateTime = (typeof LockValidTime != 'undefined') ? LockValidTime - 5 : 20;
				var lockInterval = window.setInterval(function(){
					$.ajax('./updatelock/', {
						method: 'GET',
						dataType: 'JSON'
					});
				}, updateTime * 1000);

                // разблокировать донесение при закрытии страницы
                $(window).on('beforeunload', function (e) {
                    $.ajax('./releaselock/', {
                        async: false,
                        timeout: 1000
                    });
                });
			}

            // форма только для чтнеия (неблокированная)
            if (!$form.hasClass('add') && !$form.hasClass('locked') && $form.hasClass('disabled')) {
                var updateTime = (typeof LockValidTime != 'undefined') ? LockValidTime / 2 : 10;
//                updateTime = 4;

                var checkLock = function () {
                    if (typeof checkLock.locked == 'undefined')
                        checkLock.locked = false;
                    $.ajax('./checklock/', {
						method: 'GET',
						dataType: 'JSON',
                        success: function(data) {

                            if (false === data) {
                                $('#lockedInfo').hide();
                                if (checkLock.locked) {
                                    checkLock.locked = false;
                                    if (confirm('Донесение разблокированно. Перезагрузить страницу?'))
                                        window.location.reload();
                                }
                            }
                            else if (data.user)
                            {
                                checkLock.locked = true;
                                $('#userLockCredentials').text(data.user.lastName + ' ' + data.user.firstName.substr(0, 1) + '.' + data.user.middleName.substr(0, 1) + '. (' + data.user.login + ')');
                                $('#lockedInfo').show();
                            }

                        }
                    });
                };

                checkLock();
                var checkInterval = window.setInterval(checkLock, updateTime * 1000);
            }

            if ($form.hasClass('locked'))
            {

//                var checkInterval = window.setInterval(function(){
//					$.ajax('./checklock/', {
//						method: 'GET',
//						dataType: 'JSON',
//                        success: function(data) {
//                            if (false === data) {
//                                window.clearInterval(checkInterval);
//                                checkInterval = undefined;
//                                $('#lockedInfo').hide();
//                                if (confirm('Донесение разблокированно. Перезагрузить страницу?'))
//                                    window.location.reload();
//                            }
//                        }
//					});
//				}, updateTime * 1000);

                poll = new Poll({
                    url: './checklock/',
                    data: {wait: false},
                    timeout: 35000,
                    autoStart: true,
                    receive: function(data) {
                        if (false === data) {
                            $('#lockedInfo').hide();
                            if (confirm('Донесение разблокированно. Перезагрузить страницу?'))
                                window.location.reload();
                        }

                        return false;
                    }
                });

            }

			if ($form.hasClass('add'))
			{
				creatingUpdate.updateInterval = window.setInterval(function(){
					if (creatingUpdate.enabled)
					{
						$.ajax('', {
							method: 'POST',
							dataType: 'JSON',
							data: {
								updateCreating: true
							}
						});
					}
				}, creatingUpdate.updateTime * 1000);
			}

			var $print = $form.find('a.print');
			$print.on('click', function(e) {
				if ($form.data.changed)
				{
					$form.data.goExport = true;
					$message = $('#message');
					$message.find('.link-cl').on('click', function(e) {$message.find('a.close').trigger('click'); return false;});

					$message.find('.save').on('click', function(e) {
						// Сабмит формы через эмуляцию клика
						$form.find('button[value=doSave]').trigger('click');

						// и закроем
						$message.find('a.close').trigger('click');
						return false;
					});
					//alert('changed');

					// показать сообщение
					$('a#save-message').trigger('click');
					return false;
				}
				else
				{
					return true;
				}
			});
            $form.find('#victimsTotal').on('change', function() {inStat()});
            $form.find('#victimsDeadTotal').on('change', function() {inStat()});

        });
	}

	// Вызвать обработчики для госпитализации
	RecalcHospitalized();

    // новый код валидации числовых полей
    var dependedFields = {
        'victimsChildren': '+victimsTotal' ,
        'victimsDeadTotal': '+victimsTotal',
        'victimsDeadChildren': '+victimsDeadTotal',

        'evacuatedTotal': '+victimsTotal, -victimsDeadTotal',
        'evacuatedChildren': '+victimsChildren, -victimsDeadChildren',
        'evacuatedByAirTotal': '+evacuatedTotal',
        'evacuatedByAirChildren': '+evacuatedChildren',

        'hospitalizedTotal': '+evacuatedTotal',
        'hospitalizedAdult': '+evacuatedTotal, -evacuatedChildren',
        'hospitalizedChildren': '+evacuatedChildren',

        'ambulatoryTotal': '+victimsTotal, -victimsDeadTotal, -hospitalizedTotal, -pendingHospitalizationTotal',
        'ambulatoryChildren': '+victimsChildren, -victimsDeadChildren, -hospitalizedChildren, -pendingHospitalizationChildren',
        'pendingHospitalizationTotal': '+victimsTotal, -victimsDeadTotal, -hospitalizedTotal',
        'pendingHospitalizationChildren': '+victimsChildren, -victimsDeadChildren, -hospitalizedChildren',

        'caretypeFirstaidTotal': '+victimsTotal',
        'caretypeFirstaidChildren': '+victimsChildren',
        'caretypeHealthCarePredoctorChildren': '+caretypeHealthCarePredoctorTotal',
        'caretypeHealthCareMedicalChildren': '+caretypeHealthCareMedicalTotal',
        'caretypeHealthCareSpecializedChildren': '+caretypeHealthCareSpecializedTotal',
        'caretypeSpecializedChildren': '+caretypeSpecializedTotal',
        'caretypeAmbulanceChildren': '+caretypeAmbulanceTotal'
    };


    var revalidateFlds = function(exclude)
    {
//        console.log(exclude);
        for (var fld in dependedFields)
        {
//            console.log(fld);
            if (fld == exclude)
                continue;

            $('#' + fld).trigger('validate');
        }
        //$('#victimsTotal').trigger('change');
    }
    $('#victimsTotal').on('change', function(e) {
//        var $hold = $(this);

        revalidateFlds();
    });

    for (var fldName in dependedFields)
    {
//        console.log(fldName);
        var depArray = dependedFields[fldName].split(',').map(function(el) {return el.trim()});
        var plusFlds = [];
        var minusFlds = [];

        var fldLength = depArray.length;
        for (var depFld = 0; depFld < fldLength; depFld++)
        {
            if ('-' == depArray[depFld][0])
                minusFlds.push(depArray[depFld].substr(1));
            else
                plusFlds.push(depArray[depFld].substr(1));
        }

        var $inp = $('#' + fldName);
        $inp.data('pFlds', plusFlds);
        $inp.data('mFlds', minusFlds);
        $inp.on('validate', function(e, noUpdateDep) {
            var $hold = $(this);
            var total = 0;
            var pFlds = $hold.data('pFlds');
            for (var fld in pFlds)
            {
                var $fld = $('#' + pFlds[fld]);
                total += parseInt($fld.val()) || 0;
            }
            var mFlds = $hold.data('mFlds');
            for (var fld in mFlds)
            {
                var $fld = $('#' + mFlds[fld]);
                total -= parseInt($fld.val()) || 0;
            }

            if ( (parseInt($hold.val()) || 0)  > total)
            {
                $hold.addClass('error validateError');
            }
            else
            {
                $hold.removeClass('error validateError');
            }
        });

        $inp.on('change', function(e) {
            var $hold = $(this);

//            revalidateFlds($hold.attr('id'));
            revalidateFlds();

            var $form = $(this.form);
            if ($form.find('.validateError').size())
            {
                DisableSubmit();
            }
            else
            {
                EnableSubmit();
            }

        });
    }

//    console.log(parseInt(NaN) || 0);


	// Валидация пстрадавших
    /*
	var victimFlds = '#victimsTotal,#victimsChildren,#victimsDeadTotal,#victimsDeadChildren'
	$(victimFlds).on('change', function(e) {
		$(victimFlds).removeClass('error');
		var $tot = $('#victimsTotal'), ntot = parseInt($tot.val());
		var $chld = $('#victimsChildren'), nchld = parseInt($chld.val());
		var $deadTot = $('#victimsDeadTotal'), ndeadTot = parseInt($deadTot.val());
		var $deadChld = $('#victimsDeadChildren'), ndeadChld = parseInt($deadChld.val());
		var hasErrors = false;

		var $form = $(this.form);

		if (nchld > ntot)
		{
			$chld.addClass('error');
			$chld.focus();
			hasErrors = true;
		}
		if (ndeadTot > ntot)
		{
			$deadTot.addClass('error');
			$deadTot.focus();
			hasErrors = true;
		}
		if ((ndeadChld > ndeadTot) || (ndeadChld > ntot))
		{
			$deadChld.addClass('error');
			hasErrors = true;
		}
		if (hasErrors )
		{
			DisableSubmit();
		}
		else
		{
			if (0 == $(victimFlds).find('.error').length)
				EnableSubmit();
		}
	});

	var evacuatedFlds = '#evacuatedTotal,#evacuatedChildren,#evacuatedByAirTotal,#evacuatedByAirChildren';
	$(evacuatedFlds).on('change', function(e) {
		$(evacuatedFlds).removeClass('error');
		var $tot = $('#evacuatedTotal'), ntot = parseInt($tot.val());
		var $chld = $('#evacuatedChildren'), nchld = parseInt($chld.val());
		var $airTot = $('#evacuatedByAirTotal'), nairTot = parseInt($airTot.val());
		var $airChld = $('#evacuatedByAirChildren'), nairChld = parseInt($airChld.val());
		var hasErrors = false;

		if (nchld > ntot)
		{
			$chld.addClass('error');
			$chld.focus();
			hasErrors = true;
		}
		if (nairTot > ntot)
		{
			$airTot.addClass('error');
			$airTot.focus();
			hasErrors = true;
		}
		if ((nairChld > nairTot) || (nairChld > ntot))
		{
			$airChld.addClass('error');
			$airChld.focus();
			hasErrors = true;
		}

		if (hasErrors )
		{
			DisableSubmit();
		}
		else
		{
			if (0 == $(evacuatedFlds).find('.error').length)
				EnableSubmit();
		}
	});

	var ambulatoryFlds = '#ambulatoryTotal,#ambulatoryChildren,#pendingHospitalizationTotal,#pendingHospitalizationChildren';
	$(ambulatoryFlds).on('change', function(e) {
		$(ambulatoryFlds).removeClass('error');
		var $tot = $('#ambulatoryTotal'), ntot = parseInt($tot.val());
		var $chld = $('#ambulatoryChildren'), nchld = parseInt($chld.val());
		var $pendTot = $('#pendingHospitalizationTotal'), npendTot = parseInt($pendTot.val());
		var $pendChld = $('#pendingHospitalizationChildren'), npendChld= parseInt($pendChld.val());
		var hasErrors = false;

		if (nchld > ntot)
		{
			$chld.addClass('error');
			$chld.focus();
			hasErrors = true;
		}
		if (npendChld > npendTot)
		{
			$pendChld.addClass('error');
			$pendChld.focus();
			hasErrors = true;
		}

		if (hasErrors )
		{
			DisableSubmit();
		}
		else
		{
			if (0 == $(ambulatoryFlds).find('.error').length)
				EnableSubmit();
		}
	});*/

	// обработка аналогична вышеописанной, но индивидуально для каждого поля заключительного донесения
	// обработка вешается на аттрибут data-atmost, в котором лежит id'шник поля, значение которого не должно превосходить
	// данное поле
	$('[data-atmost]').each(function() {
		var $hold = $(this);
        var $form = $(this.form);
		var $ref = $('#' + $hold.attr('data-atmost'));

		$hold.add($ref).on('change', function() {
			if (parseInt($hold.val()) > parseInt($ref.val()))
			{
				$hold.addClass('error validateError');
				$hold.focus();
			}
			else
			{
				$hold.removeClass('error validateError');
			}

            if ($form.find('.validateError').size())
            {
                DisableSubmit();
            }
            else
            {
                EnableSubmit();
            }

		});
	});

	if (typeof $.fn.timeEntry != 'undefined')
	{
		$.timeEntry.setDefaults({
			spinnerImage: ''
		});
		$('input.time').timeEntry({show24Hours: true, showSeconds: false});
	}

	// поля суммирования
	//console.log();
	$('[data-sumof]').each(function(idx, obj) {
		var $hold = $(this);
		var sumFldIds = $hold.attr('data-sumof').split(',').map(function(el) {return el.trim()});

		var summarize = function() {
			var sum = 0;
			$.each(sumFldIds, function() {
				var val = parseInt($('#' + this).val());
				if (isNaN(val))
					val = 0;
				sum += val;
			});
			$hold.val(sum);
			$hold.trigger('change');
		};

		$.each(sumFldIds, function() {$('#' + this).on('keyup change', function(e) {
			summarize();
		})});

//		console.log($(sumFldIds));
		//console.log($this.data('sumof'));
	});

    $('#deleteButton').on('click', function(e) {
        var esid = $(this).attr('data-esid');
        if(window.confirm('Внимание!\nВы уверены что ходите удалить информацию о ЧС? При удалении все связанные с этим ЧС донесения будут также удалены.'))
        {
            window.location.href = '/delete_es/' + esid + '/';
        }
    });

    // Date-Time pickers on map
    $('.dateTimePicker').datetimepicker();

    // find button - map-filters
    $('a.field-search').on('click', function() {
    	$('.drop.open').removeClass('open');
    	$('.drop .holder').animate({marginTop:-$('.drop .holder').innerHeight()},{queue: false, duration: 300});
        // Если у нас на фоне включена вкладка список, то оверлей мы не скрываем!
        if (!jQuery('ul.view li:eq(1)').hasClass('active')) {
            window.overlayTimmer = window.setTimeout(function ()
            {
            	$('.overlay').css('display', 'block');
            }, 600);
        }
        $('.spinner-wrap').show();
	        $('.spinner').universalLoader({
	        	loaderw : 72,
	        	timer : 100,
	        	framesX: 12,
				allFrames: 12,
	        });
        $('#map-search-form').trigger('submit');
        return false;
    });

    // print button
    $('a.print').on('click', function() {
        if (window.print)
            window.print();
        return false;
    });

    // use select2 jQuery plugin
    if (typeof $.fn.select2 != 'undefined')
    {
        var objs = $('.select2');
        objs.each(function() {
            var hold = $(this);
            hold.width(hold.width());
            hold.select2({
                minimumResultsForSearch: 10
            });
        });
    }


    // чекбокс статистики
    $('input#inStats').on('change', function() {
        var cb = $(this);
        if (!cb.prop('checked') && !confirm('ЧС (и все связанные донесения) не будет участвовать в формировании статистики. Вы действительно хотите отключить отображение в статистике?'))
            $(this).prop('checked', !$(this).prop('checked'));;
    });


    // кнопки количества панелей в донесении
    $('.one-strip,.two-strip,.three-strip').on('click', function() {
        var $hold = $(this);
        if ($hold.hasClass('active'))
            return;
        var newPanes = $hold.hasClass('three-strip') ? 3 : ($hold.hasClass('two-strip') ? 2 : 1);
//        console.log(PanesNum);
//        console.log(newPanes);

        $hold.parent().children().removeClass('active');
        $hold.addClass('active');

        window.location.search = '?panes=' + newPanes;
    });


    $('#stat_form').each(function() {
        $(this).on('change', 'select.kindSelect', function() {
            var $kindSelect = $(this);
            var $typeSelect = $kindSelect.parents('.with-icons:first').find('select.typeSelect');
            var kindID = $kindSelect.val()
            $.ajax({
                url: '/get/estypes/',
                type: 'post',
                dataType: 'json',
                data: {kindID: kindID, optional: true},
                success: function(data) {
                    if (data.types) {
                        $typeSelect.find('option').not(':eq(0)').remove();

                        $.each(data.types, function() {
                            $typeSelect.append('<option value="' + this.typeID + '">' + this.name + '</option>');
                            //console.log(this);
                        });
                        $typeSelect.prev().remove();
                        $typeSelect.removeClass('outtaHere').parents('form').customForm();
                        $('.selectOptions.customSelect > div').customScrollV();
                    }
//                    console.log(data);
                }
            });

//            console.log($kindSelect, $typeSelect);
        });
    });

    // stats export links
    $('.statistics-body a.export-stats').each(function() {
        var $hold = $(this);
        var type = $hold.attr('class').split(' ')[0];
        var $form = $('#stat_form');

        $hold.on('click', function() {
//            $.ajax({
//                url: '/stats/',
//                type: 'POST',
//                async: false,
//                data: data
//            });
            var data = $form.serializeObject();
            data.exportType = type;
            submitPost('/stats/','post',data);

            return false;
        });

    });

/********************************* Авторизация / регистрация ***********************************/
    if (typeof $.fn.ajaxForm != 'undefined')
	{
		$('#loginForm').ajaxForm({
            //beforeSubmit:showRequest,
            beforeSubmit: function(arr, $form) {

                $form.find('p').hide();
            },
            success: LoginResponseHandler,
            dataType: 'json'
        });

        $('#registrationForm').ajaxForm({
            beforeSubmit: function() {
                if (!$('#acceptRules').prop('checked')) {
                    $.jGrowl('Для продолжения необходимо подтвердить согласие с правилами использования системы');
                    return false;
                }
                return true;
            },
            success: function(data) {
                if (data.error) {
                    $.jGrowl(data.error);
                    $('#registrationForm').find('.captcha-img').trigger('click');
                    return;
                }
                else if (data.msg == "ok")
                {
                    //window.location.reload();
                    $('.registration-popup-overlay').hide();
                    $('.registration-popup').hide();
                    $.simplebox('#regMessage');
                    return;
                }
            },
            type: 'post',
            dataType: 'json'
        });
	}


});


/******************************************** Функции ****************************************/

function LoginResponseHandler(data, status)
{
//    $("#submit").attr("disabled", false);
    var msg = "";
    if (data.error)
    {
        var errMsgs = {
            100: "Возникла ошибка при отправлении письма.",
            101: "Введите корректный e-mail",
            102: "Пользователь с таким адресом не найден",
            1: "Указанный адрес не найден",
            2: "Пользователь не найден",
            5: "Некорректный логин",
            6: "Неправильно введен пароль",
            7: "Логин деактивирован",
            8: "У вас недостаточно прав"
        };
        if (typeof errMsgs[data.errno] != 'undefined')
            msg = errMsgs[data.errno];
        else
            msg = "Возникла ошибка";

        if (data.errno == 5) $('#username').parent().addClass('error').removeClass('success');
        if (data.errno == 6) $('#userpass').parent().addClass('error').removeClass('success');
//        $.jGrowl(msg);
        $('#loginForm p').text(msg).show();
        $.jGrowl(msg);
        //$('#message').hide().html(msg).addClass('error').removeClass('success').fadeIn();
    }
    else if (data.msg == "email")
    {
//        $('#insert_email').slideUp();;
//        $('#message').hide().html(data.text).addClass('success').removeClass('error').fadeIn();
//        $("#loginForm").slideToggle();
    }
    else if (data.msg == "ok")
    {
        window.location.reload();
        return;
    }
}

function RecalcHospitalized()
{
	$(".info.check-people .holder-small .block > div.tolltip").each(function() {
		$(this).find("ul.list-lin > li input:text:first").trigger('keyup');
	});
}

function PageLeave(e)
{
    if (poll)
        poll.stop();
	return 'Данные формы не сохранены';
}

function MainForm(arr, $form, options)
{

}

function ReportSubmit(arr, $form, options)
{
	$('label.error').removeClass('error').removeAttr('title');
	$('input.error').removeClass('error');
	if ($form.hasClass('disabled'))
		return true; // bypass validation
	var fields = [];
	if (!$('#locationName').val())
		fields.push('locationName');
	if (!$('#datetimeEs').val())
		fields.push('datetimeEs');
	if (!$('#esName').val())
		fields.push('esName');
	var tot = parseInt($('#victimsTotal').val()) || 0;
	if (parseInt($('#victimsChildren').val()) > tot)
		fields.push('victimsChildren');
	var deadTot = parseInt($('#victimsDeadTotal').val()) || 0;
	if (deadTot > tot)
		fields.push('victimsDeadTotal')
	if (parseInt($('#victimsDeadChildren').val()) > deadTot)
		fields.push('victimsDeadChildren');

	var fldNames = [];
	if (fields.length)
	{
		$.each(fields, function(key, name) {
			fldNames[key] =  $('label[for="' + name + '"]').addClass('error').text();
			$('#' + name).addClass('error');
		});

		$('html').animate({
			scrollTop: $('label.error:first').offset().top - 30
		}, 600);
		var errorText = 'Заполните обязательные поля:<br/><ul style="list-style: disc; padding-left: 20px;">';

		$.each(fldNames, function(key, name) {
			errorText += '<li><b>' + name + '</b></li>';
		});
		errorText += '</ul>';

		$.jGrowl(errorText);

		return false;
	}
	creatingUpdate.enabled = false;
	DisableSubmit();

	return true;
}

function ReportResponseHandler(data, status, jqXHR, $form)
{
//	$('#initial-form div.footer').addClass('error');

	if (typeof data.error != 'undefined')
	{
		creatingUpdate.enabled = true; // возобновляем обновление создающегося
		EnableSubmit();
		var errorText = data.error;
		if (typeof data.fields != 'undefined')
		{
			var fldNames = {};
			$.each(data.fields, function(name, msg) {
				fldNames[$('label[for="' + name + '"]').addClass('error').attr('title', msg).text()] = msg;
				$('#' + name).addClass('error');
			});

			$('html').animate({
				scrollTop: $('label.error:first').offset().top - 30
			}, 600);

			errorText += '<ul style="list-style: disc; padding-left: 20px;">';
			$.each(fldNames, function(name, msg){
				errorText += '<li><b>' + name + '</b>: ' + msg + '</li>';
			});
			errorText += '</ul>';

		}

		$.jGrowl(errorText);
	}
	else if (data.msg == 'reload')
	{
		window.location = data.link;
	}
	else
	{
		$form.data.changed = false;
		$(window).off('beforeunload');
		$('label.changes').removeClass('changes');
		if (!$form.data.goExport)
			$form.slideUp();
		if ('checked' == data.msg)
		{
			$.jGrowl('Донесение проверено', {beforeClose: function() {window.location.reload()} });
		}
        else if ('signed' == data.msg)
		{
			$.jGrowl('Донесение утверждено', {beforeClose: function() {window.location.reload()} });
		}
		else
		{
			if ($form.data.goExport)
			{
				$.jGrowl('Донесение сохранено');
				window.location = './export/';
			}
			else
				$.jGrowl('Донесение сохранено', {beforeClose: function() {window.location = '/'} });

			$form.data.goExport = false;
		}
	}

}

function DisableSubmit()
{
	$('#initial-form,#subsequent-form,#final-form,#multipane-form').find('button[type="submit"]').attr('disabled', true).addClass('disabled');
}

function EnableSubmit()
{
	$('#initial-form,#subsequent-form,#final-form,#multipane-form').find('button[type="submit"]').removeAttr('disabled').removeClass('disabled');
}


if(!String.prototype.trim){
    String.prototype.trim = function(){
      return this.replace(/^\s+|\s+$/g,'');
    };
}

// Reference: http://es5.github.com/#x15.4.4.19
if (!Array.prototype.map) {
    Array.prototype.map = function (callback, thisArg) {
        var T, A, k;
        if (this == null) {
          throw new TypeError(" this is null or not defined");
        }
        var O = Object(this);

        var len = O.length >>> 0;

        if (typeof callback !== "function") {
          throw new TypeError(callback + " is not a function");
        }

        if (thisArg) {
          T = thisArg;
        }
        A = new Array(len);
        k = 0;
        while (k < len) {
          var kValue, mappedValue;
          if (k in O) {
            var Pk = k.toString();
            kValue = O[Pk];
            mappedValue = callback.call(T, kValue, k, O);
            A[Pk] = mappedValue;
          }
          k++;
        }

        return A;
    };
}

/* Poll */
var Poll = function(options) {
    this.properties = {
        url: '.',
        timeout: 60 * 1000,
        reconnectTime: 1000,
        autoStart: false,
        data: {},
        open: function() {},
        receive: function(channel, data) {}
    };

    this.channels = [];
    if ($.isPlainObject(options))
    {
        $.extend(this.properties, options);
    }

    this.active = false;
    if (this.properties.autoStart)
    {
        this._connect();
    }
};

Poll.prototype._reconnect = function() {
    if (!this.active)
        return;
    var _this = this;
    window.setTimeout(function() {
        _this._connect();
    }, _this.properties.reconnectTime);
};

Poll.prototype._connect = function() {
    this.active = true;
    var _this = this;
    var _data = {'_': this.time};
    $.extend(_data, this.properties.data);
    this.xhr = $.ajax({
        url: _this.properties.url,
        async: true,
        data: _data,
        type: 'GET',
        dataType: 'JSON',
        cache: false,
        timeout: _this.properties.timeout,
        error: function() {
            _this._reconnect();
        },
        success: function(data, textStatus, xhr) {
            if (xhr.status !== 200)
            {
                _this.active = false;
                return;
            }
//            console.log(data);
            if (typeof data != 'undefined') {
                if ($.isFunction(_this.properties.receive))
                {
                    if (!_this.properties.receive.call(_this, data))
                        _this.active = false;
                }
            }
            _this._reconnect();
        }
    });

};

Poll.prototype.start = function (url) {
//    console.log(this.properties.reconnectTime);return;
    if (url)
        this.properties.url = url;

    this.time = (Date.now) ? Date.now() :  (new Date()).getTime();
    this._connect();
    this.properties.open.call(this);
};

Poll.prototype.stop = function(graceful) {
    if (this.active) {
        this.active = false;
        graceful = graceful || false;
        if (!graceful)
            this.xhr.abort();
    }
};

function randomString(length) {
    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'.split('');

    if (! length) {
        length = Math.floor(Math.random() * chars.length);
    }

    var str = '';
    for (var i = 0; i < length; i++) {
        str += chars[Math.floor(Math.random() * chars.length)];
    }
    return str;
}

// datetime pciker
jQuery.fn.datetimepicker = function() {jQuery.each(this, function() {
    var curdate = new Date();
    var template = '\
<div class="modal" id="' + randomString(10) + '">\
    <a class="close" href="#">close</a>\
    <div class="holder-date">\
        <form action="#" class="form">\
            <fieldset>\
                <div class="text">\
                    <label>время:</label>\
                    <input type="time" class="time-input text-input no-clear time" value="' + curdate.getHours() + ':' + curdate.getMinutes() + '" />\
                </div>\
            </fieldset>\
        </form>\
    </div>\
    <div class="datepicker"></div>\
</div>\
    ';
    var $box = $(template);
    var $link = $(this);
    var $input = $($link.attr('data-for'));
    var $close = $box.find('.close');
    var $time = $box.find('input.time-input');
    $link.attr('href', '#' + $box.attr('id'));
    var picker = $box.find('.datepicker').datepicker({
        closeText:"Закрыть",prevText:"&#x3c;Пред",nextText:"След&#x3e;",currentText:"Сегодня",monthNames:["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"],monthNamesShort:["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"],dayNames:["воскресенье","понедельник","вторник","среда","четверг","пятница","суббота"],dayNamesShort:["вск","пнд","втр","срд","чтв","птн","сбт"],dayNamesMin:["Вс","Пн","Вт","Ср","Чт","Пт","Сб"],weekHeader:"Нед",dateFormat:"dd.mm.yy",firstDay:1,isRTL:!1,showMonthAfterYear:!1,yearSuffix:"",
        showOtherMonths: true,
        selectOtherMonths: true,
        changeMonth: true,
        changeYear: true,
        onSelect: function(dateText, inst){
            $input.val(dateText+' / '+$time.val());
        }
    });
    $box.find('input.time').timeEntry({show24Hours: true, showSeconds: false});
    $time.bind('keyup keypress keydown', function(){
        var text = '';
        var arr = picker.datepicker('getDate');
        if(arr.getDate().toString().length == 1) text += '0'+arr.getDate().toString()+'.';
        else text += arr.getDate().toString()+'.';
        if((arr.getMonth()+1).toString().length == 1) text += '0'+(arr.getMonth()+1).toString()+'.';
        else text += (arr.getMonth()+1)+'.';
        text += arr.getFullYear();
        $input.val(text+' / '+$time.val());
    });

    $link.on('click', function(){
//        console.log('#'+$box.attr('id'));
        if(!$.simplebox.modal){
            $.simplebox('#'+$box.attr('id'), {
                positionFrom: '#'+$input.attr('id') + " + a",
                left: 200,
                overlay: false
            });
        }
        return false;
    });

    $input.on('focus', function(){
        if(!$.simplebox.modal){

            $.simplebox('#'+$box.attr('id'), {
                positionFrom: '#'+$input.attr('id')  + " + a",
                overlay: false
            });
        }
    });
    $close.on('click', function(){
        if($.simplebox.modal && $.simplebox.modal.attr('id') == $box.attr('id').replace('#', '')) $.simplebox.close();
        return false;
    });

    $('body').append($box);
});};

function inStat(){
    var type  = $('#typeID').val();
    var postr =$('#victimsTotal').val();
    var dead  =$('#victimsDeadTotal').val();
    if (postr=='')
        postr=0;
    if(dead=='')
        dead=0;
    $.ajax({
        url:'/instat/',
        method: 'GET',
        datatype: 'json',
        data: {dead: dead, postr: postr, type: type},
        success: function (data) {
            $('#inStats').prop('checked', !!data);
        }
    });
}

function StatSubmit(){


}


function StatResponseHandler(){
  alert('ответ');
}


// hongymagic/jQuery.serializeObject
// https://github.com/hongymagic/jQuery.serializeObject
$.fn.serializeObject=function(){"use strict";var a={},b=function(b,c){var d=a[c.name];"undefined"!=typeof d&&d!==null?$.isArray(d)?d.push(c.value):a[c.name]=[d,c.value]:a[c.name]=c.value};return $.each(this.serializeArray(),b),a};

// non-ajax post
function submitPost(action, method, values) {
    var form = $('<form/>', {
        action: action,
        method: method
    });
    $.each(values, function(key, val) {
        form.append($('<input/>', {
            type: 'hidden',
            name: key,
            value: val
        }));
    });
//    form.submit();
    form.appendTo('body').submit();
}