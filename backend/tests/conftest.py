import pytest
import requests

BASE_URL = "http://127.0.0.1:8000"

@pytest.fixture(scope="session")
def api_client():
    session = requests.Session()
    session.headers.update({"Accept": "application/json"})
    return session