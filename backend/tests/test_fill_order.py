import pytest
from .conftest import BASE_URL
from backend.apps.orders.models import Order, OrderStatus
from backend.apps.holdings.models import Holding

TEST_EMAIL = "filltest@setp.local"
TEST_PASSWORD = "filltest123"

@pytest.fixture(scope="module")
def fill_user(api_client):
    register_url = f"{BASE_URL}/api/register/"
    payload = {"email": TEST_EMAIL, "password": TEST_PASSWORD}
    response = api_client.post(register_url, json=payload)
    
    if response.status_code == 201:
        print(f"Registered fill test user: {TEST_EMAIL}")
    elif response.status_code == 400 and "email" in response.json():
        print(f"Reusing existing fill user: {TEST_EMAIL}")
    else:
        pytest.fail(f"Registration failed: {response.text}")
    
    return payload

@pytest.fixture
def fill_auth_token(api_client, fill_user):
    login_url = f"{BASE_URL}/api/token/"
    payload = {"email": fill_user["email"], "password": fill_user["password"]}
    response = api_client.post(login_url, json=payload)
    if response.status_code != 200:
        pytest.fail(f"Login failed: {response.text}")
    return response.json()["access"]

@pytest.fixture
def fill_auth_headers(fill_auth_token):
    return {"Authorization": f"Bearer {fill_auth_token}"}

@pytest.mark.django_db(transaction=True) 
def test_fill_buy_order(api_client, fill_auth_headers, fill_user):
    # Deposit
    deposit_url = f"{BASE_URL}/api/deposit/"
    api_client.post(deposit_url, json={"amount": "2000.00"}, headers=fill_auth_headers)
    
    # Place buy
    buy_url = f"{BASE_URL}/api/orders/market-buy/"
    buy_payload = {"asset_id": 13, "quantity": 10}
    buy_response = api_client.post(buy_url, json=buy_payload, headers=fill_auth_headers)
    assert buy_response.status_code == 201
    
    order_id = buy_response.json()["order_id"]
    
    # Fill inside a transaction
    from django.db import transaction
    with transaction.atomic():
        from django.core.management import call_command
        call_command("fill_order", order_id)
    
    # Verify
    order = Order.objects.get(id=order_id)
    assert order.status == OrderStatus.FILLED
    
    holding = Holding.objects.filter(user__email=TEST_EMAIL, asset__id=13).first()
    assert holding is not None
    assert holding.quantity == 10