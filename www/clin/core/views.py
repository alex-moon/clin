import json

from django.views.generic import View, TemplateView
from django.http import HttpResponse


# Template views
class HomeView(TemplateView):
    def get_template_names(self):
        if (
            self.request.GET.get('activate', None) != 'clin'
            and not self.request.session.get('activated')
        ):
            return ['forbidden.html']
        self.request.session['activated'] = True
        return ['home.html']


# JSON API
class JsonView(View):
    def build_response(self, response_dict):
        if 'status' not in response_dict:
            response_dict['status'] = 500
            if 'error' not in response_dict:
                response_dict['error'] = 'Unknown error'

        return HttpResponse(
            json.dumps(response_dict),
            status=response_dict['status'],
            content_type='application/json',
        )

    def handle(self, request, *args, **kwargs):
        try:
            response = {'status': 200}
            response.update(self.get_response(request, *args, **kwargs))
        except Exception as e:
            response = {
                'status': 200,
                'error': str(e),
            }
        return self.build_response(response)


class JsonGetView(JsonView):
    def get(self, request, *args, **kwargs):
        return self.handle(request.GET, *args, **kwargs)


class JsonPostView(JsonView):
    def post(self, request, *args, **kwargs):
        return self.handle(json.loads(request.body), *args, **kwargs)
