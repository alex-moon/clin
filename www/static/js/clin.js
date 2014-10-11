function Clin() {
    var subscribers = {}

    function subscribe(key, obj) {
        if (! subscribers.hasOwnProperty(key)) {
            subscibers[key] = [obj];
        } else {
            subscribers[key].push(obj);
        }
    }

    function publish(key, data) {
        if (subscribers.hasOwnProperty(key)) {
            for (i = 0; i < subscribers[key].length; i++) {
                subscribers[key][i].tell(key, data);
            }
        }
    }

    function TestView() {
        var template = '#test-view-template';
        function tell(key, data) {
            switch (key) {
                default:
                    console.log('TestView.tell', key, data);
                    break;
            }
        }
        function render(data) {
            console.log('TestView.render', data);
        }
    }

    return {
        'test_view': new TestView()
    }
}
window.clin = new Clin();