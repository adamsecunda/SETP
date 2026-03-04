from rest_framework import serializers
from .models import Watchlist, WatchlistItem
from backend.apps.assets.serializers import AssetSerializer

class WatchlistItemSerializer(serializers.ModelSerializer):
    asset = AssetSerializer(read_only=True)

    class Meta:
        model = WatchlistItem
        fields = ['id', 'asset', 'added_at']

class WatchlistSerializer(serializers.ModelSerializer):
    items = WatchlistItemSerializer(many=True, read_only=True)

    class Meta:
        model = Watchlist
        fields = ['id', 'name', 'created_at', 'items']