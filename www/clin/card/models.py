from Levenshtein import distance

from django.db import models


class Card(models.Model):
    SMA_N = 10

    question = 'question'
    answer = 'answer'

    QUESTION_TYPES = (
        ('f', question),
        ('e', answer),
    )

    question = models.CharField(max_length=256)
    answer = models.CharField(max_length=256)
    question_type = models.CharField(choices=QUESTION_TYPES)

    answered_count = models.IntegerField(default=0, db_index=True)
    last_score = models.FloatField(default=0)
    average_score = models.FloatField(default=0)

    # Model methods
    def answer(self, answer):
        answer_len = len(self.answer)
        levdist = distance(answer, self.answer)
        correct_len = answer_len - levdist
        score = correct_len / answer_len
        self.update_score(score)

    def update_score(self, score):
        if self.answered_count == 0:
            self.last_score = self.average_score = score
        else:
            new_average = self.average_score \
                          - self.last_score / self.SMA_N \
                          + score / self.SMA_N
            self.last_score = score
            self.average_score = new_average
        self.answered_count += 1
        self.save()

    def serialise(self):
        return {
            'question': self.question,
            'answer': self.answer,
            'answered_count': self.answered_count,
            'last_score': self.last_score,
            'average_score': self.average_score,
        }

    # Boilerplate
    def __unicode__(self):
        return "<Card: %s:%s>" % (
            self._truncate(self.question),
            self._truncate(self.answer),
        )

    def _truncate(self, string):
        TRUNCATE_LENGTH = 20
        length = len(string)
        if length < TRUNCATE_LENGTH:
            return string
        return string[:TRUNCATE_LENGTH] + '...'

    class Meta(object):
        ordering = ('answered_count', 'last_score')
