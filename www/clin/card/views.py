from clin.core.views import JsonPostView, JsonGetView
from clin.card.services import CardService

service = CardService()


class AddCardsView(JsonPostView):
    def get_response(self, data, *args, **kwargs):
        cards = []
        for card in data['cards']:
            french = card.get('french')
            english = card.get('english')
            if not french or not english:
                raise Exception('Please supply both French and English')

            english_card, french_card = service.add_card(french, english)
            cards.append(english_card.serialise())
            cards.append(french_card.serialise())
        return {'cards': cards}


class AnswerCardsView(JsonPostView):
    def get_response(self, data, *args, **kwargs):
        cards = []
        for card in data['cards']:
            pk = card['pk']
            answer = card['answer']
            cards.append(service.answer_card(pk, answer))
        cards_list = [card.serialise() for card in cards]
        return {'cards': cards_list}


class GetCardsView(JsonGetView):
    def get_response(self, data, *args, **kwargs):
        count = data.get('count', service.default_card_count())
        cards = service.get_cards(count)
        cards_list = [card.serialise() for card in cards]
        return {'cards': cards_list}
