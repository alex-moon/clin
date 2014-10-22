import random

from django.db.models import Max
from django.utils.encoding import smart_text

from clin.card.models import Card


class CardService(object):
    DEFAULT_CARD_COUNT = 100

    _cache_max_answered = None

    def default_card_count(self):
        return self.DEFAULT_CARD_COUNT

    def get_cards(self, count=DEFAULT_CARD_COUNT):
        count = int(count)
        sample = Card.objects.all()[:count * 10]
        return random.sample(sample, count if count < sample.count() else sample.count())

    def answer_card(self, pk, answer):
        card = Card.objects.get(pk=pk)
        card.answer_card(answer)
        if card.answered_count > self._cache_max_answered:
            self._cache_max_answered = card.answered_count
        return card

    def add_card(self, french, english):
        french_card = Card.objects.filter(question=french)
        english_card = Card.objects.filter(question=english)
        if french_card.exists():
            raise Exception(
                'A card with that French value already exists: %s'
                % french_card.get()
            )
        if english_card.exists():
            raise Exception(
                'A card with that English value already exists: %s'
                % english_card.get()
            )

        english_card = Card.objects.create(
            question=english,
            answer=french,
            question_type=Card.ENGLISH
        )
        french_card = Card.objects.create(
            question=french,
            answer=english,
            question_type=Card.FRENCH
        )
        return (english_card, french_card)

    def get_max_answered(self):
        if self._cache_max_answered is None:
            self._cache_max_answered = Card.objects.all().aggregate(Max('answered_count'))
        return self._cache_max_answered

    def update_max_answered(self, max_answered):
        self._cache_max_answered = max_answered

    def clear_cache(self):
        self._cache_max_answered = None
