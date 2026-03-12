from django.http import JsonResponse
from apps.agenda.models import Ambiente, Reserva 


PERIODOS = ["INTEGRAL", "MANHA", "TARDE", "NOITE"]


def periodos_livres(request):

    data = request.GET.get("data")
    ambiente_id = request.GET.get("ambiente")

    if not data or not ambiente_id:
        return JsonResponse({"error": "data e ambiente são obrigatórios"}, status=400)

    reservas = Reserva.objects.filter(
        ambiente_id=ambiente_id,
        data_inicio__lte=data,
        data_fim__gte=data,
        status="APROVADA"
    )

    ocupados = reservas.values_list("periodo", flat=True)

    # se existir INTEGRAL nada mais está disponível
    if "INTEGRAL" in ocupados:
        return JsonResponse({"periodos": []})

    livres = []

    for p in PERIODOS:

        if p in ocupados:
            continue

        # INTEGRAL só pode se nenhum outro período estiver ocupado
        if p == "INTEGRAL" and ocupados:
            continue

        livres.append(p)

    return JsonResponse({"periodos": livres})