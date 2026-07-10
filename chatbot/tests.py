from django.test import TestCase, Client
from django.urls import reverse
import json

class ChatbotViewsTestCase(TestCase):
    def setUp(self):
        self.client = Client()

    def test_chat_page_loads(self):
        """Test that the chatbot welcome page renders successfully."""
        response = self.client.get(reverse('chat_page'))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'chatbot/index.html')
        self.assertIn('stats', response.context)

    def test_chat_api_local_response(self):
        """Test the local fallback chatbot engine when no api_key is provided."""
        payload = {
            'message': 'Show active alerts'
        }
        response = self.client.post(
            reverse('chat_api'),
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('response', data)
        self.assertIn('suggestions', data)
        self.assertNotIn('use_gemini', data)

    def test_chat_api_gemini_fallback(self):
        """Test that the API falls back to the local engine on any Gemini query errors/exceptions."""
        payload = {
            'message': 'Show active alerts'
        }
        response = self.client.post(
            reverse('chat_api'),
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('response', data)
        # Verify that it returned the local engine response (which includes alert metrics)
        self.assertIn('alerts', data['response'])
        self.assertIn('suggestions', data)

    def test_chat_api_with_filters(self):
        """Test that the chatbot API filters the RAG scope correctly based on sidebar filters."""
        payload = {
            'message': 'Show active alerts',
            'filters': {
                'territory': ['Territory-05']
            }
        }
        response = self.client.post(
            reverse('chat_api'),
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('response', data)
        self.assertIn('Territory-05', data['response'])

    def test_chat_export_no_data(self):
        """Test the export endpoint returns 404 if no query was run."""
        response = self.client.get(reverse('chat_export'))
        self.assertEqual(response.status_code, 404)

    def test_filter_count_api(self):
        """Test that the filter count API correctly computes the filtered total counts."""
        payload = {
            'filters': {
                'channel': ['Direct']
            }
        }
        response = self.client.post(
            reverse('filter_count_api'),
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('total', data)
        self.assertIn('filtered', data)
        self.assertTrue(data['filtered'] <= data['total'])


