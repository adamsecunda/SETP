from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Watchlist, WatchlistItem
from .serializers import WatchlistSerializer, WatchlistItemSerializer
from backend.apps.assets.models import Asset

class WatchlistListCreateView(generics.ListCreateAPIView):
    serializer_class = WatchlistSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Watchlist.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class WatchlistDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = WatchlistSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'

    def get_queryset(self):
        return Watchlist.objects.filter(user=self.request.user)

class WatchlistItemCreateView(generics.CreateAPIView):
    serializer_class = WatchlistItemSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        watchlist_id = self.kwargs['watchlist_id']
        watchlist = Watchlist.objects.get(id=watchlist_id, user=self.request.user)
        asset_id = self.request.data.get('asset_id')
        asset = Asset.objects.get(id=asset_id)
        serializer.save(watchlist=watchlist, asset=asset)

class WatchlistItemDeleteView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]

    def get_object(self):
        watchlist_id = self.kwargs['watchlist_id']
        asset_id = self.kwargs['asset_id']
        return WatchlistItem.objects.get(
            watchlist__id=watchlist_id,
            asset__id=asset_id,
            watchlist__user=self.request.user
        )