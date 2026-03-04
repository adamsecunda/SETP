import pytest
from django.db import transaction
from .conftest import BASE_URL
from backend.apps.orders.models import Order, OrderStatus
from backend.apps.holdings.models import Holding
from backend.apps.assets.models import Asset
from backend.apps.users.models import CustomUser  # assuming your user model
from backend.apps.orders.management.commands.fill_order import Command as FillOrderCommand

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
    # Get the user object
    user = CustomUser.objects.get(email=TEST_EMAIL)

    # Reset holding to 0 before test (clean slate)
    Holding.objects.filter(user=user, asset__id=13).delete()
    print("Holding reset to 0 for AAPL")

    # Deposit enough funds
    deposit_url = f"{BASE_URL}/api/deposit/"
    deposit_response = api_client.post(deposit_url, json={"amount": "10000.00"}, headers=fill_auth_headers)
    print("Deposit response:", deposit_response.status_code, deposit_response.json())

    # Place buy order
    buy_url = f"{BASE_URL}/api/orders/market-buy/"
    buy_payload = {"asset_id": 13, "quantity": 10}
    buy_response = api_client.post(buy_url, json=buy_payload, headers=fill_auth_headers)

    print("Buy response:", buy_response.status_code, buy_response.json())  # debug

    assert buy_response.status_code == 201, f"Buy failed: {buy_response.json()}"

    data = buy_response.json()
    print("Full buy response data:", data)

    if "order_id" not in data:
        pytest.fail(f"No 'order_id' key in buy response. Full data: {data}")

    order_id = data["order_id"]
    print(f"Extracted order_id: {order_id}")

    # Run the fill logic directly inside the test transaction
    with transaction.atomic():
        command = FillOrderCommand()
        command.handle(order_id=order_id)  # keyword arg

    # Verify order status
    order = Order.objects.get(id=order_id)
    assert order.status == OrderStatus.FILLED, f"Order status is {order.status}, expected FILLED"

    # Verify holding created/updated
    holding = Holding.objects.filter(user=user, asset__id=13).first()
    assert holding is not None, "Holding not created"
    assert holding.quantity == 10, f"Quantity is {holding.quantity}, expected 10"

    print("Test passed - order filled successfully")