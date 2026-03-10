from django.urls import path

from .ambientes import listar_ambientes
from .periodos import periodos_livres

urlpatterns = [
    path("periodos-livres/", periodos_livres),
    path("ambientes", listar_ambientes),
]