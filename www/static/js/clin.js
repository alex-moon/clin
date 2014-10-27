function Clin() {
    var observer = _.clone(Backbone.Events);

    function Backend() {
        var get_cards_url = '/cards/get/';
        var add_cards_url = '/cards/add/';
        var answer_cards_url = '/cards/answer/';

        function get_cards(success, failure, count) {
            var url = get_cards_url;
            if (!_.isUndefined(count)) {
                url += '?count=' + count;
            }
            $.get(url).success(success).fail(failure);
        }

        function add_cards(cards, success, failure) {
            data = {'cards': cards};
            $.post(add_cards_url, JSON.stringify(data)).success(success).fail(failure);
        }

        function answer_cards(cards, success, failure) {
            data = {'cards': cards};
            $.post(answer_cards_url, JSON.stringify(data)).success(success).fail(failure);
        }

        return {
            'get_cards': get_cards,
            'add_cards': add_cards,
            'answer_cards': answer_cards
        }
    }
    var backend = new Backend();

    function ConnectionManager() {
        // queue pushes until the server is available
        // @todo also poll for new cards when card count drops below 50?
        // @todo add listener triggers from backend

        var persist_queue = [];

        function trigger(keyword) {
            function handle(data) {
                if (data.error) {
                    helpers.show_error(data.error);
                } else {
                    observer.trigger(keyword, data);
                }
            }
            return handle;
        }

        function attempt_persist() {
            debug('connection.attempt_persist');
            var adds = _(persist_queue).filter(function(x){ return x.action == 'add'; });
            var answers = _(persist_queue).filter(function(x){ return x.action == 'answer'; });

            var adds_cards = _(adds).reduce(function(ac, x){ return ac.concat(x.cards); }, []);
            var answers_cards = _(answers).reduce(function(ac, x){ return ac.concat(x.cards); }, []);

            if (adds_cards.length) {
                backend.add_cards(adds_cards,
                    function(data){
                        persist_queue = _(persist_queue).difference(adds);
                        trigger('incoming-cards')(data);
                    },
                    function(){ _.delay(attempt_persist, 30000); }
                );
            }

            if (answers_cards.length) {
                backend.answer_cards(answers_cards,
                    function(){ persist_queue = _(persist_queue).difference(answers); },
                    function(){ _.delay(attempt_persist, 30000); }
                );
            }
        }

        function attempt_get() {
            debug('connection.attempt_get');
            backend.get_cards(
                trigger('incoming-cards'),
                function(){ _.delay(attempt_get, 30000); }
            );
        }

        function sync() {
            debug('connection.sync');
            attempt_persist();
            attempt_get();
        }

        function queue(data) {
            persist_queue.push(data);
            sync();
        }

        function answer_card(card_answer) {
            queue({'action': 'answer', 'cards': [card_answer]});
            trigger('card-answered')(card_answer);
        }

        function add_card(card_add) {
            queue({'action': 'add', 'cards': [card_add]});
            trigger('card-added')(card_add);
        }

        return {
            'sync': sync,
            'answer_card': answer_card,
            'add_card': add_card
        }
    }
    var connection = new ConnectionManager();

    function Controller() {
        var cards = [];
        var current_card_index = 0;

        function pop_card(pk) {
            card = _(cards).findWhere({'pk': Number(pk)});
            cards = _(cards).without(card);
        }

        function answer_card(card) {
            connection.answer_card(card);
            pop_card(card.pk);
        }

        function add_card(data) {
            if (! data['french'] || ! data['english']) {
                helpers.show_error('Please supply both French and English.')
            } else {
                connection.add_card(data);
            }
        }

        function incoming_cards(data) {
            cards_with_duplicates = cards.concat(data['cards']);
            cards = _(cards_with_duplicates).unique(function(card){ return card.pk });
        }

        function next_card() {
            current_card_index ++;
            if (current_card_index >= cards.length) {
                current_card_index = 0;
            }
            return cards[current_card_index];
        }

        // set up listeners
        observer.on('incoming-cards', incoming_cards);

        // and here we go!
        function start() {
            debug('controller.start');
            connection.sync();
        }

        return {
            'start': start,
            'answer_card': answer_card,
            'add_card': add_card,
            'next_card': next_card,
            'connection': connection
        }
    }
    controller = new Controller();

    // VIEWS

    function ViewHelpers () {
        // scrolls two elements in place so one replaces the other
        // @param direction 'up' or 'down'
        // @param e the parent element with at least two children
        // @param callback function to call after the first element is scrolled
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
                    // handy little focus-setter 'cos I said so:
                    $new_el.find('input[type=text]').first().focus();
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

        // shows an error message
        var error_msg = _.template($('#error-msg-template').text())
        function show_error(error) {
            $('.card-box').prepend(error_msg({'error': error}));
            $('button[type=submit]').button('reset');
        }

        return {
            'cycle_up': cycle_up,
            'cycle_down': cycle_down,
            'form_to_obj': form_to_obj,
            'show_error': show_error
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
                observer.off('incoming-cards', first_card);
                var next_card = data['cards'][0];
                var next_card_el = template({'card': next_card});
                $(el).append(next_card_el);
                helpers.cycle_up(el, function(){
                    $(el).find('.test-placeholder').remove();
                    bind_listeners();
                });
            }
        }
        
        function next_card(data) {
            // first show the answer
            var $question = $(el).find('.test-view-question');
            helpers.cycle_up($question, function(){
                _.delay(function(){
                    // then cycle to next card
                    var next_card = controller.next_card();
                    var $next_card_el = $(template({'card': next_card}));
                    var $old_card = $(el).find('.row');

                    $(el).append($next_card_el);
                    helpers.cycle_up(el, function(){
                        $old_card.remove();
                        bind_listeners();
                    });
                }, 1000);
            });
        }

        function answer_card(e) {
            e.preventDefault();
            var form = $(el).find('form');
            form.find('button[type=submit]').button('loading');
            data = helpers.form_to_obj(form);
            controller.answer_card(data);
        }

        function skip_card(e) {
            e.preventDefault();
            next_card();
        }

        function bind_listeners(data) {
            $(el).find('form').on('submit', answer_card);
            $(el).find('button.test-view-skip').on('click', skip_card);
        }

        observer.on('incoming-cards', first_card);
        observer.on('card-answered', next_card);
        observer.on('card-skipped', next_card);

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
                    bind_listeners();
                });
            } else {
                bind_listeners();
            }
        }

        function add_card(e) {
            debug('add_view.add_card');
            e.preventDefault();
            var form = $(el).find('form');
            form.find('button[type=submit]').button('loading');
            data = helpers.form_to_obj(form);
            debug('we have data: ' + JSON.stringify(data));
            controller.add_card(data);
            debug('add_card end');
        }

        function bind_listeners(data) {
            $(el).find('form').on('submit', add_card);
        }

        observer.on('card-added', reset_form);

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
