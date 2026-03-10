from django.http import JsonResponse
from apps.agenda.models import Reserva


def reservas_public(request):

    ambiente = request.GET.get("ambiente")

    try:
        ambiente_id = int(ambiente)
    except (TypeError, ValueError):
        return JsonResponse({"error": "ambiente inválido"}, status=400)

    reservas = Reserva.objects.filter(
        ambiente_id=ambiente_id
    ).values(
        "id",
        "instituicao",
        "responsavel",
        "finalidade",
        "tipo_solicitacao",
        "periodo",
        "status",
        "data_inicio",
        "data_fim",
        "ambiente_id"
    )

    data = []

    for r in reservas:
        data.append({
            "id": r["id"],
            "instituicao": r["instituicao"],
            "responsavel": r["responsavel"],
            "finalidade": r["finalidade"],
            "tipo_solicitacao": r["tipo_solicitacao"],
            "periodo": r["periodo"],
            "status": r["status"],
            "data_evento": r["data_inicio"],
            "data_fim": r["data_fim"],
            "ambiente": r["ambiente_id"]
        })

    return JsonResponse(data, safe=False)