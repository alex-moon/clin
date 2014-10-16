from clin.core.views import JsonPostView, JsonGetView
from clin.card.services import CardService

service = CardService()


class AddCardView(JsonPostView):
    def get_response(self, request, *args, **kwargs):
        french = request.POST.get('french')
        english = request.POST.get('english')
        if not french or not english:
            raise Exception('Please supply both French and English')

        english_card, french_card = service.add_card(french, english)
        return {'cards': [
            english_card.serialise(),
            french_card.serialise(),
        ]}


class GetCardsView(JsonGetView):
    def get_response(self, request, *args, **kwargs):
        count = request.GET.get('count', service.default_card_count())
        cards = service.get_cards(count)
        cards_list = [card.serialise() for card in cards]
        return {'cards': cards_list}


class AnswerCardView(JsonPostView):
    def get_response(self, request, *args, **kwargs):
        pk = kwargs['pk']
        answer = request.POST['answer']
        card = service.answer_card(pk, answer)
        return {'card': card.serialise()}
