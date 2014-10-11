function Clin() {
    var TestView = Backbone.View.extend({
        template: _.template($('#test-view-template').text())
    });

    return {
        'test_view': new TestView()
    }
}
window.clin = new Clin();