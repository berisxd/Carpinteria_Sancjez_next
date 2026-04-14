"""
Módulo para simular procesamientos de pago.

Este simulador se usa únicamente en entorno de desarrollo/demo para comprobar
que la lógica de creación de pedidos y cambio de estado funciona correctamente.
"""

from .models import Pedido


def simulate_payment(pedido: Pedido, outcome: str = "success") -> dict:
    """Procesa un "pago" sobre el objeto pedido.

    Args:
        pedido: instancia de Pedido que se desea simular el pago.
        outcome: "success" o "failure". Cualquier otro valor se considera
            fallido.

    Returns:
        dict con llaves:
            - success: bool
            - message: descripción del resultado
            - pedido: el pedido actualizado
    """
    if outcome == "success":
        pedido.estado = "confirmado"
        message = "Pago simulado con éxito. El pedido ahora está en estado 'confirmado'."
        success = True
    else:
        # dejaremos el pedido en estado cancelado para indicar fallo
        pedido.estado = "cancelado"
        message = "Simulación de pago fallida. El pedido se marcó como 'cancelado'."
        success = False

    pedido.save()
    return {"success": success, "message": message, "pedido": pedido}
