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
            console.log(answer_card_url({'pk': pk}));
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

        function add_cards_to_list(data) {
            cards.concat(data);
        }

        function add_card(pk, question, answer) {
            cards.push({
                'pk': pk,
                'question': question,
                'answer': answer
            });
        }

        function next_card() {
            current_card_index ++;
            if (current_card_index > cards.length) {
                current_card_index = 0;
            }
            return cards[current_card_index];
        }

        // set up listeners
        observer.on('incoming_cards', add_cards_to_list);

        // and here we go!
        function start() {
            backend.get_cards();
        }

        return {
            'start': start,
            'answer_card': answer_card,
            'next_card': next_card,
            'add_card': add_card,
            'backend': backend,
        }
    }
    controller = new Controller();

    // handy function for views to use -
    // converts an array from $(form_selector).serializeArray()
    // to a dict we can JSONify ... :)
    function form_to_obj(form_array) {
        return _(form_array).reduce(function(acc, field) {
            acc[field.name] = field.value;
            return acc;
        }, {});
    }

    function TestView () {
        var el = '#test-view';
        var template = _.template($('#test-view-template').text());

        function answer_card(e) {
            e.preventDefault();
            form_data = $(el).find('form').serializeArray();
            data = form_to_obj(form_data);
            controller.answer_card(data);  // @todo Demeter - should be a method on controller
        }

        function bind_listeners(data) {
            $(el).find('form').on('submit', answer_card);
        }
        
        function first_card(data) {
            var next_card = data['cards'][0];
            var next_card_el = template({'card': next_card});
            $(el).html(next_card_el);
            bind_listeners();
        }
        
        function next_card(data) {
            var next_card = controller.next_card();
            var next_card_el = template(next_card);
            $(el).append(next_card_el);
            // @todo scroll up lol
        }

        observer.on('incoming_cards', first_card);
        observer.on('card_answered', next_card);

        return {
        }
    };
    test_view = new TestView();

    controller.start();
    return {
        'observer': observer,
        'controller': controller,
        'test_view': test_view
    }
}
window.clin = new Clin();