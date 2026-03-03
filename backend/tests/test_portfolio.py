import pytest
from .conftest import BASE_URL

TEST_EMAIL = "portfolio_test@setp.local"
TEST_PASSWORD = "portfolio123"

@pytest.fixture(scope="module")
def portfolio_user(api_client):
    register_url = f"{BASE_URL}/api/register/"
    payload = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    }
    response = api_client.post(register_url, json=payload)
    
    if response.status_code == 201:
        print(f"Registered portfolio test user: {TEST_EMAIL}")
    elif response.status_code == 400 and "email" in response.json():
        print(f"Reusing existing portfolio user: {TEST_EMAIL}")
    else:
        pytest.fail(f"Registration failed: {response.status_code} - {response.text}")
    
    return payload

@pytest.fixture
def auth_token(api_client, portfolio_user):
    login_url = f"{BASE_URL}/api/token/"
    payload = {
        "email": portfolio_user["email"],
        "password": portfolio_user["password"]
    }
    response = api_client.post(login_url, json=payload)
    if response.status_code != 200:
        pytest.fail(f"Login failed: {response.text}")
    
    return response.json()["access"]

@pytest.fixture
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}"}

def test_portfolio_view(auth_headers, api_client):
    url = f"{BASE_URL}/api/portfolio/"
    
    # First deposit some funds so balance > 0
    deposit_url = f"{BASE_URL}/api/deposit/"
    deposit_payload = {"amount": "500.00"}
    deposit_resp = api_client.post(deposit_url, json=deposit_payload, headers=auth_headers)
    assert deposit_resp.status_code == 200
    
    # Call portfolio
    response = api_client.get(url, headers=auth_headers)
    assert response.status_code == 200, response.text
    
    data = response.json()
    
    assert "balance" in data
    assert isinstance(data["balance"], (int, float))
    assert data["balance"] >= 500.0
    
    assert "holdings" in data
    assert isinstance(data["holdings"], list)
    
    assert "total_portfolio_value" in data
    assert isinstance(data["total_portfolio_value"], (int, float))
    
    assert "holdings_count" in data
    assert isinstance(data["holdings_count"], int)
    
    assert "note" in data  # the placeholder note
    
    if data["holdings"]:
        first_holding = data["holdings"][0]
        assert "asset" in first_holding
        assert "quantity" in first_holding
        assert "current_value" in first_holding

@pytest.mark.skip(reason="Requires filled buy order to have holdings")
def test_portfolio_with_holdings(auth_headers, api_client):
    # TODO - Complete after order fill logic added
    pass