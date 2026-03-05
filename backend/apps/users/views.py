from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django.db import transaction
from drf_spectacular.utils import extend_schema, OpenApiExample
from drf_spectacular.types import OpenApiTypes

from .models import CustomUser
from .serializers import RegisterSerializer, DepositSerializer
from backend.apps.transactions.models import Transaction, TransactionType

class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer
    
    @extend_schema(
        summary="User Registration",
        description="Creates a new user account in the system. New users typically start with a default balance of 0.00.",
        tags=['Authentication']
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)
    
    
class DepositView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Deposit Funds",
        description="Adds a specified amount to the authenticated user's balance and logs a Transaction record.",
        request=DepositSerializer,
        responses={200: OpenApiTypes.OBJECT},
        examples=[
            OpenApiExample(
                'Deposit Example',
                value={"amount": 1000.00}
            )
        ],
        tags=['Financial Operations']
    )
    def post(self, request):
        serializer = DepositSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        amount = serializer.validated_data['amount']
        user = request.user

        # Update balance
        user.balance += amount
        user.save()

        # Record transaction
        Transaction.objects.create(
            user=user,
            type=TransactionType.DEPOSIT,
            amount=amount,
        )

        return Response({
            "message": f"Deposited {amount:.2f}",
            "new_balance": float(user.balance)
        }, status=status.HTTP_200_OK)
        
        
class WithdrawView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Withdraw Funds",
        description="Deducts funds from the user's balance. Includes an atomic check to prevent overdrafts.",
        request=DepositSerializer,
        responses={
            200: OpenApiTypes.OBJECT,
            400: OpenApiTypes.OBJECT
        },
        examples=[
            OpenApiExample(
                'Successful Withdrawal',
                value={"amount": 500.00}
            ),
            OpenApiExample(
                'Insufficient Funds Error',
                status_codes=['400'],
                value={"error": "Insufficient funds for this withdrawal."}
            )
        ],
        tags=['Financial Operations']
    )
    def post(self, request):
        serializer = DepositSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        amount = serializer.validated_data['amount']
        user = request.user

        # Check if user has enough money
        if user.balance < amount:
            return Response(
                {"error": "Insufficient funds for this withdrawal."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Wrap in transaction to ensure data integrity
        with transaction.atomic():
            user.balance -= amount
            user.save()

            # Record transaction
            Transaction.objects.create(
                user=user,
                type=TransactionType.WITHDRAWAL,
                amount=amount,
            )

        return Response({
            "message": f"Withdrew {amount:.2f}",
            "new_balance": float(user.balance)
        }, status=status.HTTP_200_OK)