from rest_framework.decorators import api_view
from rest_framework.response import Response
from backend.market.engine import r, PRICE_PREFIX

@api_view(["GET"])
def live_prices(request):
    keys = r.keys(PRICE_PREFIX + "*")

    data = []
    for key in keys:
        ticker = key.replace(PRICE_PREFIX, "")
        price = float(r.get(key))
        data.append({
            "ticker": ticker,
            "price": price
        })
    return Response(data)