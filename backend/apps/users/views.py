from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from .models import CustomUser
from .serializers import RegisterSerializer
from .serializers import DepositSerializer
from .models import CustomUser
from backend.apps.transactions.models import Transaction, TransactionType

class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer
    
    
class DepositView(APIView):
    permission_classes = [IsAuthenticated]

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