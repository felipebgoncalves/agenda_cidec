from django.urls import path
from .periodos import periodos_livres

urlpatterns = [
    path("periodos-livres/", periodos_livres),
]