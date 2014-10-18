function Clin() {
    var observer = _.clone(Backbone.Events);

    var error_msg = _.template($('#error-msg-template').text())
    function show_error(error) {
        $('.card-box').prepend(error_msg({'error': error}));
    }

    function Backend() {
        var get_cards_url = '/card/get/';
        var add_card_url = '/card/add/';
        var answer_card_url = _.template('/card/answer/<%= pk %>/')

        function trigger(keyword) {
            function handle(data) {
                if (data.error) {
                    show_error(data.error);
                    $('button[type=submit]').button('reset');
                } else {
                    observer.trigger(keyword, data);
                }
            }
            return handle;
        }

        function get_cards(count) {
            var url = get_cards_url;
            if (!_.isUndefined(count)) {
                url += '?count=' + count;
            }
            $.get(url, trigger('incoming_cards'));
        }

        function add_card(french, english) {
            $.post(add_card_url, {
                'french': french,
                'english': english
            }, trigger('incoming_cards'));
        }

        function answer_card(pk, answer) {
            $.post(answer_card_url({'pk': pk}), {
                'answer': answer
            }, trigger('card_answered'));
        }

        return {
            'get_cards': get_cards,
            'add_card': add_card,
            'answer_card': answer_card
        }
    }
    var backend = new Backend();

    function Controller() {
        var cards = [];
        var current_card_index = 0;

        function answer_card(data) {
            backend.answer_card(data['pk'], data['answer']);
        }

        function add_card(data) {
            backend.add_card(data['french'], data['english']);
        }

        function incoming_cards(data) {
            cards = cards.concat(data['cards']);
        }

        function next_card() {
            current_card_index ++;
            if (current_card_index >= cards.length) {
                current_card_index = 0;
            }
            return cards[current_card_index];
        }

        // set up listeners
        observer.on('incoming_cards', incoming_cards);

        // and here we go!
        function start() {
            backend.get_cards();
        }

        return {
            'start': start,
            'answer_card': answer_card,
            'add_card': add_card,
            'next_card': next_card,
            'backend': backend,
        }
    }
    controller = new Controller();

    function ViewHelpers () {
        function cycle(direction, e, callback) {
            if (direction == 'up') {
                $old_el = $($(e).children()[0]);
                $new_el = $($(e).children()[1]);
            } else {
                $old_el = $($(e).children()[1]);
                $new_el = $($(e).children()[0]);
            }

            $new_el.css('display', 'none');
            $old_el.addClass('fade-out-' + direction);
            _.delay(function(){
                $old_el.css('display', 'none').removeClass('fade-out-' + direction);
                $new_el.css('display', 'block').addClass('fade-in-' + direction);
                _.delay(function(){
                    $new_el.removeClass('fade-in-' + direction);
                }, 300);

                if (!_.isUndefined(callback)) {
                    callback();
                }
            }, 300);
        }

        function cycle_up(e, callback) {
            cycle('up', e, callback);
        }

        function cycle_down(e, callback) {
            cycle('down', e, callback);
        }

        // gets form vals in an object we can JSONify ... :)
        function form_to_obj(form) {
            form_array = $(form).serializeArray();
            return _(form_array).reduce(function(acc, field) {
                acc[field.name] = field.value;
                return acc;
            }, {});
        }

        return {
            'cycle_up': cycle_up,
            'cycle_down': cycle_down,
            'form_to_obj': form_to_obj,
        }
    }
    helpers = new ViewHelpers();

    function HomeView () {
        var current_mode = 'test';
        var el = '#home-view';
        var card_box = $(el).find('.card-box');

        function switch_mode(mode) {
            if (current_mode == mode) {
                return;
            }

            if (current_mode == 'test') {
                helpers.cycle_up(card_box);
            } else {
                helpers.cycle_down(card_box);
            }

            current_mode = mode;
        }

        $(el).find('.mode-switcher input').change(function(e){
            switch_mode($(this).data('mode'));
        });
    }
    var home_view = new HomeView();

    function TestView () {
        var el = '#test-view';
        var template = _.template($('#test-view-template').text());

        function first_card(data) {
            var $current_card = $(el).find('.row');
            if (!$current_card.length && data['cards'] && data['cards'][0]) {
                var next_card = data['cards'][0];
                var next_card_el = template({'card': next_card});
                $(el).html(next_card_el);
                bind_listeners();
            }
        }
        
        function next_card(data) {
            var next_card = controller.next_card();
            var $next_card_el = $(template({'card': next_card}));
            var $old_card = $(el).find('.row');

            $(el).append($next_card_el);
            helpers.cycle_up(el, function(){
                $old_card.remove();
            });
            bind_listeners();
        }

        function answer_card(e) {
            e.preventDefault();
            var form = $(el).find('form');
            form.find('button[type=submit]').button('loading');
            data = helpers.form_to_obj(form);
            controller.answer_card(data);
        }

        function bind_listeners(data) {
            $(el).find('form').on('submit', answer_card);
        }

        observer.on('incoming_cards', first_card);
        observer.on('card_answered', next_card);

        return {
            'next_card': next_card
        }
    };
    test_view = new TestView();

    function AddView () {
        var el = '#add-view';
        var template = _.template($('#add-view-template').text());

        function reset_form() {
            var new_form_el = template();

            var $old_form = $(el).find('.row');
            $(el).append(new_form_el);
            if ($old_form.length) {
                helpers.cycle_up(el, function(){
                    $old_form.remove();
                });
            }

            bind_listeners();
        }

        function add_card(e) {
            e.preventDefault();
            var form = $(el).find('form');
            form.find('button[type=submit]').button('loading');
            data = helpers.form_to_obj(form);
            controller.add_card(data);
        }

        function bind_listeners(data) {
            $(el).find('form').on('submit', add_card);
        }

        observer.on('incoming_cards', reset_form);

        reset_form();
        return {
            'reset_form': reset_form
        }
    };
    add_view = new AddView();

    controller.start();
    return {
        'observer': observer,
        'controller': controller,
        'home_view': home_view,
        'test_view': test_view,
        'add_view': add_view
    }
}
window.clin = new Clin();
