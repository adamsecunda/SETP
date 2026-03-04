from requests import Response
from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from .models import Asset
from .serializers import AssetSerializer
from django.db.models import Q

class AssetViewSet(viewsets.ModelViewSet):
    queryset = Asset.objects.all()
    serializer_class = AssetSerializer
    permission_classes = [IsAuthenticated] 

    filter_backends = [filters.SearchFilter]
    search_fields = ['ticker', 'name']
    
    
class AssetSearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        if not query:
            return Response({"results": []}, status=200)

        # Search by ticker (exact or start) or name (contains)
        assets = Asset.objects.filter(
            Q(ticker__istartswith=query) | Q(ticker__iexact=query) |
            Q(name__icontains=query)
        ).order_by('ticker')[:20]  

        serializer = AssetSerializer(assets, many=True)
        return Response({"results": serializer.data})