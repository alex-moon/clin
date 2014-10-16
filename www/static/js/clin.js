function Clin() {
    var observer = _.clone(Backbone.Events);

    function Backend() {
        var get_cards_url = '/card/get/';
        var add_card_url = '/card/add/';
        var answer_card_url = _.template('/card/answer/<%= pk %>/')

        function trigger(keyword) {
            function handle(data) {
                observer.trigger(keyword, data);
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
            }, trigger('card_added'));
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

        function incoming_card(data) {
            incoming_cards({'cards': [data['card']]});
        }

        function next_card() {
            current_card_index ++;
            if (current_card_index > cards.length) {
                current_card_index = 0;
            }
            return cards[current_card_index];
        }

        // set up listeners
        observer.on('incoming_cards', incoming_cards);
        observer.on('card_added', incoming_card);

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

    // handy functions for views to use
    function form_to_obj(form) {
        // gets form vals in an object we can JSONify ... :)
        form_array = $(form).serializeArray();
        return _(form_array).reduce(function(acc, field) {
            acc[field.name] = field.value;
            return acc;
        }, {});
    }

    function TestView () {
        var el = '#test-view';
        var template = _.template($('#test-view-template').text());

        function first_card(data) {
            var next_card = data['cards'][0];
            var next_card_el = template({'card': next_card});
            $(el).html(next_card_el);
            bind_listeners();
        }
        
        function next_card(data) {
            var next_card = controller.next_card();
            var next_card_el = template({'card': next_card});
            var $old_card = $(el).find('.row')
            $old_card.removeClass('fade-in-up').addClass('fade-out-up');
            $(el).append(next_card_el);
            bind_listeners();
            _.delay(function(){ $old_card.remove(); }, 300);
        }

        function answer_card(e) {
            e.preventDefault();
            var form = $(el).find('form');
            form.find('button[type=submit]').button('loading');
            data = form_to_obj(form);
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
            var $old_form = $(el).find('.row');
            if ($old_form.length) {
                $old_form.removeClass('fade-in-up').addClass('fade-out-up');
                _.delay(function(){ $old_form.remove(); }, 300);
            }

            var new_form_el = template();
            $(el).append(new_form_el);
            bind_listeners();
        }

        function add_card(e) {
            e.preventDefault();
            var form = $(el).find('form');
            form.find('button[type=submit]').button('loading');
            data = form_to_obj(form);
            controller.add_card(data);
        }

        function bind_listeners(data) {
            $(el).find('form').on('submit', add_card);
        }

        observer.on('card_added', reset_form);

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
        'test_view': test_view,
        'add_view': add_view
    }
}
window.clin = new Clin();