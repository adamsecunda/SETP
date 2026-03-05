from rest_framework.response import Response
from rest_framework import viewsets, filters, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from .models import Asset
from .serializers import AssetSerializer
from django.db.models import Q

# Swagger Imports
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes

@extend_schema(
    summary="Asset Directory",
    description="Standard CRUD interface for all assets in the system. Use for admin-level management or full list retrieval.",
    tags=['Market Data']
)
class AssetViewSet(viewsets.ModelViewSet):
    queryset = Asset.objects.all()
    serializer_class = AssetSerializer
    permission_classes = [IsAuthenticated] 

    filter_backends = [filters.SearchFilter]
    search_fields = ['ticker', 'name']
    
    
class AssetSearchView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Search Assets",
        description="Search for stocks or assets by ticker symbol or full company name. Returns up to 20 matches.",
        parameters=[
            OpenApiParameter(
                name='q',
                description='Search query (e.g., "AAPL" or "Apple")',
                required=True,
                type=str,
                location=OpenApiParameter.QUERY
            )
        ],
        responses={200: OpenApiTypes.OBJECT},
        examples=[
            OpenApiExample(
                'Search Results Example',
                value={
                    "results": [
                        {
                            "id": 1,
                            "ticker": "AAPL",
                            "name": "Apple Inc.",
                            "type": "STOCK"
                        }
                    ]
                }
            )
        ],
        tags=['Market Data']
    )
    def get(self, request):
        query = request.query_params.get('q', '').strip()
        if not query:
            return Response({"results": []}, status=status.HTTP_200_OK)

        # Search by ticker (exact or start) or name (contains)
        assets = Asset.objects.filter(
            Q(ticker__istartswith=query) | Q(ticker__iexact=query) |
            Q(name__icontains=query)
        ).order_by('ticker')[:20]  

        serializer = AssetSerializer(assets, many=True)
        return Response({"results": serializer.data})