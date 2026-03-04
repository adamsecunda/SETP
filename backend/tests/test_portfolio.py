import pytest
from decimal import Decimal
from .conftest import BASE_URL
from backend.apps.orders.models import Order, OrderStatus
from backend.apps.holdings.models import Holding
from backend.apps.assets.models import Asset

TEST_EMAIL = "portfolio_test@setp.local"
TEST_PASSWORD = "portfolio123"
HIGH_BALANCE = Decimal("20000.00")  # Enough for most buys even at high prices

@pytest.fixture(scope="module")
def portfolio_user(api_client):
    register_url = f"{BASE_URL}/api/register/"
    payload = {"email": TEST_EMAIL, "password": TEST_PASSWORD}
    response = api_client.post(register_url, json=payload)
    
    if response.status_code == 201:
        print(f"Registered portfolio test user: {TEST_EMAIL}")
    elif response.status_code == 400 and "email" in response.json():
        print(f"Reusing existing portfolio user: {TEST_EMAIL}")
    else:
        pytest.fail(f"Registration failed: {response.status_code} - {response.text}")
    
    # Give high balance once
    from backend.apps.users.models import CustomUser
    user = CustomUser.objects.get(email=TEST_EMAIL)
    user.balance = HIGH_BALANCE
    user.save()
    
    return payload

@pytest.fixture
def auth_token(api_client, portfolio_user):
    login_url = f"{BASE_URL}/api/token/"
    payload = {"email": portfolio_user["email"], "password": portfolio_user["password"]}
    response = api_client.post(login_url, json=payload)
    if response.status_code != 200:
        pytest.fail(f"Login failed: {response.text}")
    return response.json()["access"]

@pytest.fixture
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}"}

@pytest.mark.django_db(transaction=True)
def test_buy_fill_and_portfolio_shows_holding(auth_headers, api_client):
    # No need to deposit — user already has high balance from fixture

    # Place buy order for AAPL (id 13)
    buy_url = f"{BASE_URL}/api/orders/market-buy/"
    buy_payload = {"asset_id": 13, "quantity": 10}
    buy_response = api_client.post(buy_url, json=buy_payload, headers=auth_headers)
    assert buy_response.status_code == 201, buy_response.text

    order_id = buy_response.json()["order_id"]

    # Fill the order
    from django.db import transaction
    with transaction.atomic():
        from django.core.management import call_command
        call_command("fill_order", order_id)

    # Verify filled
    order = Order.objects.get(id=order_id)
    assert order.status == OrderStatus.FILLED

    # Verify holding created
    holding = Holding.objects.filter(user__email=TEST_EMAIL, asset__id=13).first()
    assert holding is not None
    assert holding.quantity == 10

    # Verify portfolio shows it
    portfolio_url = f"{BASE_URL}/api/portfolio/"
    portfolio_response = api_client.get(portfolio_url, headers=auth_headers)
    assert portfolio_response.status_code == 200

    data = portfolio_response.json()

    assert data["balance"] >= 0
    assert data["holdings_count"] >= 1
    assert len(data["holdings"]) >= 1

    first_holding = data["holdings"][0]
    assert first_holding["asset"]["ticker"] == "AAPL"
    assert first_holding["quantity"] == 10
    assert "current_value" in first_holding
    assert first_holding["current_value"] > 0

    assert data["total_portfolio_value"] > data["balance"]  # holdings add value