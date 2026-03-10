from django.http import JsonResponse
from apps.agenda.models import Ambiente, Reserva 


PERIODOS = ["MANHA", "TARDE", "NOITE", "INTEGRAL"]


def periodos_livres(request):

    data = request.GET.get("data")
    ambiente_id = request.GET.get("ambiente")

    if not data or not ambiente_id:
        return JsonResponse({"error": "data e ambiente são obrigatórios"}, status=400)

    try:
        ambiente = Ambiente.objects.get(id=ambiente_id)
    except Ambiente.DoesNotExist:
        return JsonResponse({"error": "Ambiente não encontrado"}, status=404)

    reservas = Reserva.objects.filter(
        ambiente=ambiente,
        data_inicio__lte=data,
        data_fim__gte=data,
        status="APPROVED"
    )

    ocupados = reservas.values_list("periodo", flat=True)

    livres = [p for p in PERIODOS if p not in ocupados]

    return JsonResponse({"periodos": livres})