from django.http import JsonResponse
from apps.agenda.models import Ambiente


def listar_ambientes(request):
    ambientes = Ambiente.objects.filter(ativo=True).values("id", "nome")

    data = list(ambientes)

    return JsonResponse(data, safe=False)