from django.urls import path



from .periodos_livres_intervalo import periodos_livres_intervalo
from .listar_ambientes import listar_ambientes
from .listar_periodos import listar_periodos
from .periodos_livres import periodos_livres
from .reserva import criar_reserva
from .reservas_public import reservas_public

urlpatterns = [
    path("periodos-livres/", periodos_livres),
    path("periodos-livres-intervalo/", periodos_livres_intervalo),
    path("periodos/", listar_periodos),
    path("ambientes/", listar_ambientes),
    path("reservas-public/", reservas_public),
    path("reservas", criar_reserva),
]