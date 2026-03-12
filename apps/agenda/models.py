from django.db import models

# Create your models here.
class Ambiente(models.Model):
    nome = models.CharField(max_length=100)
    descricao = models.TextField(blank=True)
    ativo = models.BooleanField(default=True)

    def __str__(self):
        return self.nome


class Reserva(models.Model):

    class Meta:
        indexes = [
            models.Index(fields=["ambiente", "data_inicio", "data_fim"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["ambiente", "data_inicio", "data_fim", "periodo"],
                name="reserva_unica_por_periodo"
            )
        ]

    class TipoSolicitacao(models.TextChoices):
        INTERNA = "INTERNA", "Interna"
        EXTERNA = "EXTERNA", "Externa"

    class StatusReserva(models.TextChoices):
        PENDENTE = "PENDENTE", "Pendente"
        APROVADA = "APROVADA", "Aprovada"
        REJEITADA = "REJEITADA", "Rejeitada"

    class Periodo(models.TextChoices):
        INTEGRAL = "INTEGRAL", "Integral"
        MANHA = "MANHA", "Manhã"
        TARDE = "TARDE", "Tarde"
        NOITE = "NOITE", "Noite"

    ambiente = models.ForeignKey(
        Ambiente,
        on_delete=models.CASCADE,
        related_name="reservas"
    )

    tipo_solicitacao = models.CharField(
        max_length=10,
        choices=TipoSolicitacao.choices
    )

    instituicao = models.CharField(max_length=200)
    responsavel = models.CharField(max_length=200)
    email = models.EmailField()
    telefone = models.CharField(max_length=20)
    data_inicio = models.DateField()
    data_fim = models.DateField()
    periodo = models.CharField(max_length=50, choices=Periodo.choices)
    finalidade = models.TextField()
    observacoes = models.TextField(blank=True)
    anexo_edocs = models.FileField(
        upload_to="anexos/",
        blank=True,
        null=True
    )

    status = models.CharField(
        max_length=10,
        choices=StatusReserva.choices,
        default=StatusReserva.PENDENTE
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.ambiente} - {self.data_inicio} ({self.status})"