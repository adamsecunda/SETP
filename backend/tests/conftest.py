import pytest
import requests
import pytest
import os
import django
import requests

# Bootstrap Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()


BASE_URL = "http://127.0.0.1:8000"

@pytest.fixture(scope="session")
def api_client():
    session = requests.Session()
    session.headers.update({"Accept": "application/json"})
    return session