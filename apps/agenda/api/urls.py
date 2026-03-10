from django.urls import path

from .ambientes import listar_ambientes
from .periodos import periodos_livres
from .reservas_public import reservas_public

urlpatterns = [
    path("periodos-livres/", periodos_livres),
    path("ambientes", listar_ambientes),
    path("reservas-public", reservas_public),
]