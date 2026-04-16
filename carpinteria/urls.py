from django.urls import path
from django.contrib.auth import views as auth_views
from .views import home, healthz, categoria, producto_detalle, carrito, checkout, pedido_confirmacion, register, logout_view, simulate_pago, admin_panel, cotizacion, RoleBasedLoginView

urlpatterns = [
    path('', home, name='home'),
        path('healthz/', healthz, name='healthz'),
    path('cotizacion/', cotizacion, name='cotizacion'),
    path('categoria/<str:categoria>/', categoria, name='categoria'),
    path('producto/<int:producto_id>/', producto_detalle, name='producto_detalle'),
    path('carrito/', carrito, name='carrito'),
    path('checkout/', checkout, name='checkout'),
    path('pedido/<int:pedido_id>/', pedido_confirmacion, name='pedido_confirmacion'),
    path('pedido/<int:pedido_id>/simular/', simulate_pago, name='simulate_pago'),
    path('admin-panel/', admin_panel, name='admin_panel'),

    # Authentication
    path('login/', RoleBasedLoginView.as_view(), name='login'),
    path('logout/', logout_view, name='logout'),
    path('register/', register, name='register'),
]
