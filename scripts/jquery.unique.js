/**
 * Created by maf on 25.12.2014.
 */
$(document).ready(function(){
    /* for open and close blocks */
    $('.toogle-title').on('click', function() {
        var cl = 'closed',
            time = 200

        $(this).hasClass(cl)
            ? $(this).removeClass(cl).next().slideDown(time)
            : $(this).addClass(cl).next().slideUp(time);
    });


    /* for time-interval blocks*/
    $('.time-interval').find('select').on("change", function() {
        $(this).find("option:selected").each(function() {
            $(this).closest('.input-block').next().css('display', $(this).hasClass('date-field-option') ? 'inline-block' : 'none');
        });
    });


    /* Object for adding icons on hover */
    var icons = {
        container: $('.statistics-form .with-icons'),
        containerClone: $('.cloned'),
        links: '.icon-scale',
        addLink: '.add-scale',
        delLink: '.remove-scale',
        classClonedObjects: 'cloned',

        init: function() {
            this.container.hover(this.add, this.remove);
            this.containerClone.hover(this.addClone, this.remove);
        },
        addClone: function() {
            if ($(this).find(icons.links).length) return;
            var adv_cl = ['remove-icon remove-scale'],
                def_cl = 'icon icon-scale ',
                self = $(this);

            $.each(adv_cl, function (i, value) {
                $('<a/>', {
                    href: '#',
                    class: def_cl + value
                }).appendTo(self);
            });
            $(this).find(icons.delLink).on('click', icons.delCloneClick);

            if ($(this).find('.with-eye').length) return;
            var eyeBlock = $(this).find('.without-eye')
                                        .removeClass('without-eye')
                                        .addClass('with-eye');
            var id = Math.round(new Date().getTime() + (Math.random() * 10));
            var fldName = $(this).find('input:first').attr('name');
            var name = "";
            if (typeof fldName !== undefined) {
                var reg = /^([a-z\d_\]\[]*)(from|to|\[[a-z]*\])$/i;
                var res = reg.exec(fldName);
                if (res && res[1])
                    name = "show[" + res[1] + "]";
            }

            $('<input/>', {
                type: 'checkbox',
                class: 'checkbox-eye',
                id: 'checkbox-' + id,
                name: name
            }).prependTo(eyeBlock);

            $('<label/>', {
                class: 'label-eye',
                for: 'checkbox-' + id
            }).appendTo(eyeBlock);
        },
        add: function() {
            if ($(this).find(icons.links).length||$(this).hasClass("eye")) return;
            if ($(this).hasClass("eye")) return;
            var adv_cl = ($(this).hasClass("sm-inputs-line")) ? ['remove-icon remove-scale'] : ['add-scale', 'remove-icon remove-scale'],
                def_cl = 'icon icon-scale ',
                self = $(this);

            $.each(adv_cl, function (i, value) {
                $('<a/>', {
                    href: '#',
                    class: def_cl + value
                }).appendTo(self);
            })
         
            $(this).find(icons.addLink).on('click', icons.addClick);

            $(this).find(icons.delLink).on('click', ($(this).hasClass("sm-inputs-line") ? icons.resetClick : icons.delClick));
        },
        remove: function() {
            $(this).find(icons.links).remove();
            if ($(this).find("input[type='checkbox']:checked").length) return;
            $(this).find('.with-eye')
                    .removeClass('with-eye')
                    .addClass('without-eye')
                    .children()
                    .remove();
        },
        addClick: function(e) {
            e.preventDefault();
            var obj = $(this).prev().clone(),
                parent = $(this).parent();

            icons.generate_obj(obj, parent);
        },
        generate_obj: function(obj, parent) {
            var clone_obj = parent.clone();

            if (clone_obj.attr("id") !== "kind-n-type") {
                clone_obj.find('label').remove()
            } else {
                clone_obj.removeAttr('id');
            }
            clone_obj
                .find('.selectArea')
                    .remove()
                .end()
                .find('.customSelect')
                    .removeClass('outtaHere')
                .end()
                .find(icons.links)
                    .remove()
                .end()
                .addClass(icons.classClonedObjects);             

            if (clone_obj.find('.w-large').hasClass('input-block'))
                clone_obj.find('input').val('');

            clone_obj.appendTo(parent.parent());
            $('.statistics-form').customForm();
            $('.selectOptions.customSelect > div').customScrollV();

                icons.containerClone = $('.cloned');     

                clone_obj.find('.with-eye')
                        .removeClass('with-eye')
                        .addClass('without-eye')
                        .children()
                        .remove();

                icons.init();

        },
        delClick: function(e) {
            e.preventDefault();
            $(this).closest('.clone-group').find(".cloned").last().remove();
            },
        delCloneClick: function(e) {
            e.preventDefault();
            $('.cloned:hover').remove();
        },
        resetClick: function(e) {
            e.preventDefault();
            $(this).parent().find("textarea").each(function() {
                $(this).val('');
            });
            $(this).parent().find("input[type='text']").each(function() {
                $(this).val('');
            })
        }
    };
    icons.init();


    var eyes = {
        container: $('.statistics-form .with-icons'),

        init: function() {
            this.container.hover(this.show, this.hide);  
        },
        show: function() {
            if ($(this).find('.with-eye').length) return;
            var eyeBlock = $(this).find('.without-eye')
                                        .removeClass('without-eye')
                                        .addClass('with-eye');
            var id = Math.round(new Date().getTime() + (Math.random() * 10));

            var fldName = $(this).find('input:first').attr('name');
            var name = "";
            if (typeof fldName !== undefined) {
                var reg = /^([a-z\d_\]\[]*)(from|to|\[[a-z]*\])$/i;
                var res = reg.exec(fldName);
                if (res && res[1])
                    name = "show[" + res[1] + "]";
            }

            $('<input/>', {
                type: 'checkbox',
                class: 'checkbox-eye',
                id: 'checkbox-' + id,
                name: name
            }).prependTo(eyeBlock);

            $('<label/>', {
                class: 'label-eye',
                for: 'checkbox-' + id
            }).appendTo(eyeBlock);
        },
        hide: function() {
            if ($(this).find("input[type='checkbox']:checked").length) return;
            $(this).find('.with-eye')
                .removeClass('with-eye')
                .addClass('without-eye')
                .children()
                    .remove();
        }
    }
    eyes.init();
})