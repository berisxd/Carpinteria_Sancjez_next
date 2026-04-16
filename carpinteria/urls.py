from django.urls import path
from django.contrib.auth import views as auth_views
from .views import (
    home, healthz, categoria, producto_detalle, carrito, checkout,
    pedido_confirmacion, descargar_ticket_pdf, register, logout_view,
    simulate_pago, admin_panel, cotizacion, RoleBasedLoginView,
    iniciar_pago_mercadopago, mp_webhook, mp_pago_exitoso,
    mp_pago_fallido, mp_pago_pendiente,
)

urlpatterns = [
    path('', home, name='home'),
        path('healthz/', healthz, name='healthz'),
    path('cotizacion/', cotizacion, name='cotizacion'),
    path('categoria/<str:categoria>/', categoria, name='categoria'),
    path('producto/<int:producto_id>/', producto_detalle, name='producto_detalle'),
    path('carrito/', carrito, name='carrito'),
    path('checkout/', checkout, name='checkout'),
    path('pedido/<int:pedido_id>/', pedido_confirmacion, name='pedido_confirmacion'),
    path('pedido/<int:pedido_id>/ticket.pdf', descargar_ticket_pdf, name='descargar_ticket_pdf'),
    path('pedido/<int:pedido_id>/simular/', simulate_pago, name='simulate_pago'),
    path('admin-panel/', admin_panel, name='admin_panel'),

    # Mercado Pago
    path('pedido/<int:pedido_id>/pagar/', iniciar_pago_mercadopago, name='iniciar_pago_mercadopago'),
    path('pedido/<int:pedido_id>/pago/exitoso/', mp_pago_exitoso, name='mp_pago_exitoso'),
    path('pedido/<int:pedido_id>/pago/fallido/', mp_pago_fallido, name='mp_pago_fallido'),
    path('pedido/<int:pedido_id>/pago/pendiente/', mp_pago_pendiente, name='mp_pago_pendiente'),
    path('mp/webhook/', mp_webhook, name='mp_webhook'),

    # Authentication
    path('login/', RoleBasedLoginView.as_view(), name='login'),
    path('logout/', logout_view, name='logout'),
    path('register/', register, name='register'),
]
