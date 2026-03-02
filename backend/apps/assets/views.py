from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from .models import Asset
from .serializers import AssetSerializer

class AssetViewSet(viewsets.ModelViewSet):
    queryset = Asset.objects.all()
    serializer_class = AssetSerializer
    permission_classes = [IsAuthenticated]  # require login

    filter_backends = [filters.SearchFilter]
    search_fields = ['ticker', 'name']