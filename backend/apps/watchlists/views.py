from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Watchlist, WatchlistItem
from .serializers import WatchlistSerializer, WatchlistItemSerializer
from backend.apps.assets.models import Asset

# Swagger Imports
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes

@extend_schema(
    summary="List or Create Watchlists",
    description="Returns all watchlists belonging to the authenticated user or creates a new empty watchlist.",
    tags=['Watchlists']
)
class WatchlistListCreateView(generics.ListCreateAPIView):
    serializer_class = WatchlistSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Watchlist.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


@extend_schema(
    summary="Watchlist Details",
    description="Retrieves, updates the name of, or deletes an entire watchlist container by ID.",
    tags=['Watchlists']
)
class WatchlistDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = WatchlistSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'

    def get_queryset(self):
        return Watchlist.objects.filter(user=self.request.user)


@extend_schema(
    summary="Add Asset to Watchlist",
    description="Adds a specific asset to a chosen watchlist. Body requires asset_id. URL requires watchlist_id.",
    request=WatchlistItemSerializer,
    responses={201: WatchlistItemSerializer},
    examples=[
        OpenApiExample(
            'Add Asset Example',
            value={"asset_id": 1}
        )
    ],
    tags=['Watchlists']
)
class WatchlistItemCreateView(generics.CreateAPIView):
    serializer_class = WatchlistItemSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        watchlist_id = self.kwargs['watchlist_id']
        watchlist = Watchlist.objects.get(id=watchlist_id, user=self.request.user)
        asset_id = self.request.data.get('asset_id')
        asset = Asset.objects.get(id=asset_id)
        serializer.save(watchlist=watchlist, asset=asset)


@extend_schema(
    summary="Remove Asset from Watchlist",
    description="Deletes a specific asset from a watchlist using the watchlist_id and asset_id provided in the URL.",
    responses={204: None},
    tags=['Watchlists']
)
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