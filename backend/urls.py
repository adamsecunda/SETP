"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from backend.apps.holdings.views import PortfolioView
from backend.apps.orders.views import CancelOrderView, PlaceMarketBuyView, PlaceMarketSellView
from backend.apps.users.views import RegisterView
from backend.apps.users.views import DepositView
from backend.apps.watchlists.views import WatchlistDetailView, WatchlistItemCreateView, WatchlistItemDeleteView, WatchlistListCreateView

urlpatterns = [
    path("admin/", admin.site.urls),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/', include('backend.apps.assets.urls')),
    path('api/deposit/', DepositView.as_view(), name='deposit'),
    path('api/orders/market-buy/', PlaceMarketBuyView.as_view(), name='place_market_buy'),
    path('api/orders/<int:pk>/cancel/', CancelOrderView.as_view(), name='cancel_order'),
    path('api/orders/market-sell/', PlaceMarketSellView.as_view(), name='place_market_sell'),
    path('api/portfolio/', PortfolioView.as_view(), name='portfolio'),
    path('api/watchlists/', WatchlistListCreateView.as_view(), name='watchlist-list-create'),
    path('api/watchlists/<int:id>/', WatchlistDetailView.as_view(), name='watchlist-detail'),
    path('api/watchlists/<int:watchlist_id>/items/', WatchlistItemCreateView.as_view(), name='watchlist-item-create'),
    path('api/watchlists/<int:watchlist_id>/items/<int:asset_id>/', WatchlistItemDeleteView.as_view(), name='watchlist-item-delete'),
]