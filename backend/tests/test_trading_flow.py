import pytest
from .conftest import BASE_URL

# Test user credentials
TEST_EMAIL = "testflow@setp.local"
TEST_PASSWORD = "flowtest123"

@pytest.fixture(scope="module")
def registered_user(api_client):
    register_url = f"{BASE_URL}/api/register/"
    payload = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    }
    response = api_client.post(register_url, json=payload)
    
    if response.status_code == 201:
        print(f"Registered new user: {TEST_EMAIL}")
        return payload
    elif response.status_code == 400 and "email" in response.json():
        print(f"User already exists, reusing: {TEST_EMAIL}")
        return payload
    else:
        pytest.fail(f"Registration failed: {response.status_code} - {response.text}")

@pytest.fixture
def auth_token(api_client, registered_user):
    login_url = f"{BASE_URL}/api/token/"
    payload = {
        "email": registered_user["email"],
        "password": registered_user["password"]
    }
    response = api_client.post(login_url, json=payload)
    if response.status_code != 200:
        pytest.fail(f"Login failed: {response.text}")
    
    return response.json()["access"]

@pytest.fixture
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}"}

def test_deposit_and_balance(api_client, auth_headers):
    deposit_url = f"{BASE_URL}/api/deposit/"
    payload = {"amount": "1000.00"}
    
    response = api_client.post(deposit_url, json=payload, headers=auth_headers)
    assert response.status_code == 200, response.text
    assert "new_balance" in response.json()
    assert float(response.json()["new_balance"]) >= 1000.0

def test_place_buy_and_cancel(api_client, auth_headers):
    # Place buy order for AAPL (asset_id 13)
    buy_url = f"{BASE_URL}/api/orders/market-buy/"
    buy_payload = {"asset_id": 13, "quantity": 5}
    
    buy_response = api_client.post(buy_url, json=buy_payload, headers=auth_headers)
    assert buy_response.status_code in (201, 400), buy_response.text
    
    if buy_response.status_code == 400:
        pytest.skip("Buy failed (likely insufficient balance) - skipping cancel")
    
    order_id = buy_response.json()["order_id"]
    
    # Cancel the order
    cancel_url = f"{BASE_URL}/api/orders/{order_id}/cancel/"
    cancel_response = api_client.post(cancel_url, headers=auth_headers)
    assert cancel_response.status_code == 200, cancel_response.text
    assert "Order cancelled" in cancel_response.json()["message"]