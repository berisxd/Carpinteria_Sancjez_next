from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.http import JsonResponse
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib.auth.views import LoginView
from django.urls import reverse
from django.core.validators import URLValidator
from django.core.exceptions import ValidationError
from django.core.paginator import Paginator


# se asegura de que exista la cuenta administrativa
# (email y usuario iguales) con contraseña "admin".
# se ejecuta tan pronto como se importa la vista.
def _ensure_admin_account():
    try:
        if not User.objects.filter(email='admin@admin.com').exists():
            admin_user = User.objects.create_user(username='admin@admin.com',
                                                  email='admin@admin.com',
                                                  password='admin')
            admin_user.is_staff = True
            admin_user.is_superuser = True
            admin_user.save()
        else:
            admin_user = User.objects.filter(email='admin@admin.com').first()
            if admin_user and (not admin_user.is_staff or not admin_user.is_superuser):
                admin_user.is_staff = True
                admin_user.is_superuser = True
                admin_user.save()
    except Exception:
        pass

_ensure_admin_account()

from .forms import CustomUserCreationForm
import json
from .models import Contacto, Categoria, Producto, Pedido, Cotizacion
from .payment_simulator import simulate_payment


def home(request):
    if request.method == 'POST':
        nombre = request.POST.get('nombre', '').strip()
        contacto = request.POST.get('contacto', '').strip()
        mensaje = request.POST.get('mensaje', '').strip()

        if nombre and contacto and mensaje:
            Contacto.objects.create(nombre=nombre, contacto=contacto, mensaje=mensaje)
            messages.success(request, 'Gracias — tu mensaje ha sido recibido. Nos comunicaremos pronto.')
            return redirect('home')
        else:
            messages.error(request, 'Por favor completa todos los campos antes de enviar.')

    return render(request, 'index.html')


def cotizacion(request):
    if request.method == 'POST':
        nombre = request.POST.get('nombre', '').strip()
        email = request.POST.get('email', '').strip()
        telefono = request.POST.get('telefono', '').strip()
        tipo_mueble = request.POST.get('tipo_mueble', '').strip()
        descripcion = request.POST.get('descripcion', '').strip()
        imagen_referencia = request.FILES.get('imagen_referencia')
        
        if not all([nombre, email, telefono, tipo_mueble, descripcion]):
            messages.error(request, 'Por favor completa todos los campos requeridos.')
            return redirect('cotizacion')
        
        try:
            Cotizacion.objects.create(
                nombre=nombre,
                email=email,
                telefono=telefono,
                tipo_mueble=tipo_mueble,
                descripcion=descripcion,
                imagen_referencia=imagen_referencia
            )
            messages.success(request, 'Cotización enviada exitosamente. Nos comunicaremos pronto con tu presupuesto.')
            return redirect('home')
        except Exception as e:
            messages.error(request, f'Error al enviar la cotización: {str(e)}')
            return redirect('cotizacion')
    
    return render(request, 'cotizacion.html')


def categoria(request, categoria):
    # búsqueda por categoria slug (dinámica)
    categoria_obj = None
    try:
        categoria_obj = Categoria.objects.get(slug=categoria)
    except Exception:
        pass

    if not categoria_obj:
        return render(request, 'categoria.html', {
            'categoria': categoria,
            'titulo_categoria': 'Categoría no encontrada',
            'productos': [],
        })

    productos = Producto.objects.filter(categoria=categoria_obj, habilitado=True)

    return render(request, 'categoria.html', {
        'categoria': categoria,
        'titulo_categoria': categoria_obj.nombre,
        'productos': productos,
    })


def producto_detalle(request, producto_id):
    producto = get_object_or_404(Producto, pk=producto_id, habilitado=True)
    return render(request, 'producto_detalle.html', {'producto': producto})


def carrito(request):
    return render(request, 'carrito.html')


def checkout(request):
    if request.method == 'POST':
        # valores enviados (se rellenarán con valores de simulación si hacen falta)
        nombre = request.POST.get('nombre', '').strip()
        email = request.POST.get('email', '').strip()
        telefono = request.POST.get('telefono', '').strip()
        direccion = request.POST.get('direccion', '').strip()
        ciudad = request.POST.get('ciudad', '').strip()
        codigo_postal = request.POST.get('codigo_postal', '').strip()
        referencia = request.POST.get('referencia', '').strip()
        metodo_pago = request.POST.get('metodo_pago', '').strip()
        total = request.POST.get('total', '0')
        productos_json = request.POST.get('productos_json', '[]')
        simulacion = request.POST.get('simulacion', '')

        # manejo específico de simulaciones
        if simulacion == 'failure':
            messages.error(request, 'Pago simulado fallido. Permanece en el checkout.')
            # volver a mostrar el formulario con los datos ingresados
            return render(request, 'checkout.html', {
                'nombre': nombre,
                'email': email,
                'telefono': telefono,
                'direccion': direccion,
                'ciudad': ciudad,
                'codigo_postal': codigo_postal,
                'referencia': referencia,
                'metodo_pago': metodo_pago,
            })

        # si se simula pago exitoso, permitimos campos vacíos rellenándolos
        if simulacion == 'success':
            nombre = nombre or 'Cliente Simulado'
            email = email or 'simulado@example.com'
            telefono = telefono or '0000000000'
            direccion = direccion or 'Dirección simulada'
            ciudad = ciudad or 'Ciudad simulada'
            codigo_postal = codigo_postal or '00000'
            metodo_pago = metodo_pago or 'tarjeta'
            # total y productos deben enviarse por JS; si no vienen, dejamos 0/[]

        # validación de campos obligatorios solo para pagos reales
        if simulacion != 'success' and not all([nombre, email, telefono, direccion, ciudad, codigo_postal, metodo_pago, total]):
            messages.error(request, 'Por favor completa todos los campos requeridos.')
            return render(request, 'checkout.html', {
                'nombre': nombre,
                'email': email,
                'telefono': telefono,
                'direccion': direccion,
                'ciudad': ciudad,
                'codigo_postal': codigo_postal,
                'referencia': referencia,
                'metodo_pago': metodo_pago,
            })

        try:
            total = float(total)

            # Crear el pedido
            pedido = Pedido.objects.create(
                nombre_destinatario=nombre,
                email=email,
                telefono=telefono,
                direccion=direccion,
                ciudad=ciudad,
                codigo_postal=codigo_postal,
                referencia=referencia,
                total=total,
                metodo_pago=metodo_pago,
                productos_json=productos_json,
                estado='pendiente'
            )

            # actualizar profile si se solicitó y está logueado
            guardar = request.POST.get('guardar_datos')
            if guardar and request.user.is_authenticated:
                try:
                    user = request.user
                    if email and email != (user.email or ''):
                        user.email = email
                        user.username = email
                        user.save()
                    try:
                        profile = user.profile
                    except Exception:
                        from .models import Profile
                        profile = Profile.objects.create(user=user)
                    profile.full_name = nombre or profile.full_name
                    profile.direccion = direccion or profile.direccion
                    profile.telefono = telefono or profile.telefono
                    profile.save()
                except Exception:
                    pass

            # si fue simulación de éxito, confirmar inmediatamente y redirigir a inicio
            if simulacion == 'success':
                simulate_payment(pedido, outcome='success')
                messages.success(request, f'Pago simulado con éxito. Pedido #{pedido.id} guardado.')
                return redirect('home')

            # flujo normal: mostrar confirmación del pedido
            messages.success(request, f'¡Pedido creado exitosamente! Número de pedido: #{pedido.id}')
            return redirect('pedido_confirmacion', pedido_id=pedido.id)

        except Exception as e:
            messages.error(request, f'Error al procesar el pedido: {str(e)}')
            return render(request, 'checkout.html', {
                'nombre': nombre,
                'email': email,
                'telefono': telefono,
                'direccion': direccion,
                'ciudad': ciudad,
                'codigo_postal': codigo_postal,
                'referencia': referencia,
                'metodo_pago': metodo_pago,
            })
    
    # Prefill fields if user has profile
    nombre = ''
    email = ''
    telefono = ''
    direccion = ''

    if request.user.is_authenticated:
        email = request.user.email or ''
        try:
            profile = request.user.profile
            nombre = profile.full_name or request.user.get_full_name() or request.user.username
            telefono = profile.telefono or ''
            direccion = profile.direccion or ''
        except Exception:
            nombre = request.user.get_full_name() or request.user.username

    return render(request, 'checkout.html', {
        'nombre': nombre,
        'email': email,
        'telefono': telefono,
        'direccion': direccion,
    })


def register(request):
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            # Do NOT log the user in automatically. Inform and redirect to login.
            messages.success(request, 'Registro exitoso. Por favor inicia sesión.')
            # Preserve 'next' parameter if present so login can redirect afterwards
            next_url = request.GET.get('next') or request.POST.get('next')
            if next_url:
                return redirect(f"/login/?next={next_url}")
            return redirect('login')
        else:
            messages.error(request, 'Por favor corrige los errores en el formulario.')
    else:
        form = CustomUserCreationForm()

    return render(request, 'register.html', {'form': form})


def logout_view(request):
    try:
        logout(request)
    except Exception:
        pass
    return redirect('home')


def pedido_confirmacion(request, pedido_id):
    pedido = get_object_or_404(Pedido, pk=pedido_id)
    try:
        productos = json.loads(pedido.productos_json)
    except:
        productos = []
    
    return render(request, 'pedido_confirmacion.html', {
        'pedido': pedido,
        'productos': productos
    })


class RoleBasedLoginView(LoginView):
    template_name = 'login.html'
    redirect_authenticated_user = True

    def get_success_url(self):
        user = self.request.user
        if user.is_authenticated and user.is_staff:
            return reverse('admin_panel')
        return super().get_success_url() or reverse('home')


@login_required(login_url='login')
def simulate_pago(request, pedido_id):
    """Página para disparar simulaciones de pago.

    Se usa en desarrollo para comprobar que la aplicación reacciona al cambio
    en el estado del pedido tras un pago (exitoso o fallido). El método recibe
    un query param `resultado` que puede ser `success` o `failure`.
    """
    pedido = get_object_or_404(Pedido, pk=pedido_id)
    resultado = request.GET.get('resultado', 'success')
    info = None

    if request.method == 'POST' or resultado in ('success', 'failure'):
        # preferimos aceptar POST o el parámetro en GET para facilitar pruebas
        info = simulate_payment(pedido, outcome=resultado)

    return render(request, 'simulador_pago.html', {
        'pedido': pedido,
        'info': info,
        'resultado': resultado,
    })


@login_required(login_url='login')
def admin_panel(request):
    """Vista administrativa básica para ver y actualizar pedidos.

    Solo accesible por el usuario con correo `admin@admin.com`.
    """
    user = request.user
    if not user.is_staff:
        messages.error(request, 'No tienes permiso para acceder a esta página.')
        return redirect('home')

    # manejar acciones del panel
    if request.method == 'POST':
        action = request.POST.get('action')

        if action == 'cambiar_estado':
            try:
                pid = int(request.POST.get('pedido_id'))
                nuevo = request.POST.get('nuevo_estado')
                pedido = Pedido.objects.get(pk=pid)
                if nuevo in dict(Pedido.ESTADOS):
                    pedido.estado = nuevo
                    pedido.save()
                    messages.success(request, f"Estado del pedido #{pid} actualizado.")
                else:
                    messages.error(request, 'Estado no válido.')
            except Exception as e:
                messages.error(request, f"Error al cambiar estado: {e}")
            return redirect('admin_panel')

        if action == 'crear_usuario':
            email = request.POST.get('email', '').strip()
            password = request.POST.get('password', '').strip()
            full_name = request.POST.get('full_name', '').strip()
            direccion = request.POST.get('direccion', '').strip()
            telefono = request.POST.get('telefono', '').strip()
            role = request.POST.get('role', 'empleado')

            if not all([email, password, full_name, direccion, telefono]):
                messages.error(request, 'Completa todos los campos del formulario de usuario.')
                return redirect('admin_panel')

            if User.objects.filter(username__iexact=email).exists():
                messages.error(request, 'Ya existe un usuario con ese correo.')
                return redirect('admin_panel')

            try:
                u = User.objects.create_user(username=email, email=email, password=password)
                if role in ('administrador', 'empleado'):
                    u.is_staff = True
                else:
                    u.is_staff = False

                u.is_superuser = False
                u.save()
                try:
                    profile = u.profile
                except Exception:
                    from .models import Profile
                    profile = Profile.objects.create(user=u)
                profile.full_name = full_name
                profile.direccion = direccion
                profile.telefono = telefono
                profile.save()
                messages.success(request, f'Usuario {email} creado como {role}.')
            except Exception as e:
                messages.error(request, f'Error al crear usuario: {e}')
            return redirect('admin_panel')

        if action == 'editar_usuario':
            user_id = request.POST.get('user_id')
            role = request.POST.get('role')
            full_name = request.POST.get('full_name', '').strip()
            direccion = request.POST.get('direccion', '').strip()
            telefono = request.POST.get('telefono', '').strip()
            try:
                u = User.objects.get(pk=int(user_id))
                if u.username.lower() == 'admin@admin.com' and u == request.user:
                    messages.error(request, 'No puedes cambiar tu propio rol del administrador principal.')
                else:
                    if role in ('administrador', 'empleado'):
                        u.is_staff = True
                    else:
                        u.is_staff = False
                    u.is_superuser = False
                    u.save()

                    try:
                        profile = u.profile
                    except Exception:
                        from .models import Profile
                        profile = Profile.objects.create(user=u)

                    if full_name:
                        profile.full_name = full_name
                    if direccion:
                        profile.direccion = direccion
                    if telefono:
                        profile.telefono = telefono
                    profile.save()

                    messages.success(request, f'Usuario {u.email} actualizado.')
            except User.DoesNotExist:
                messages.error(request, 'Usuario no encontrado.')
            except Exception as e:
                messages.error(request, f'Error al editar usuario: {e}')
            return redirect('admin_panel')

        if action == 'eliminar_usuario':
            user_id = request.POST.get('user_id')
            try:
                u = User.objects.get(pk=int(user_id))
                if u.username.lower() == 'admin@admin.com':
                    messages.error(request, 'No se puede eliminar el usuario administrador principal.')
                elif u == request.user:
                    messages.error(request, 'No puedes eliminar tu propia cuenta desde aquí.')
                else:
                    u.delete()
                    messages.success(request, f'Usuario {u.email} eliminado correctamente.')
            except User.DoesNotExist:
                messages.error(request, 'Usuario no encontrado.')
            except Exception as e:
                messages.error(request, f'Error al eliminar usuario: {e}')
            return redirect('admin_panel')

        if action == 'crear_producto':
            nombre = request.POST.get('nombre', '').strip()
            categoria_id = request.POST.get('categoria', '').strip()
            precio = request.POST.get('precio', '').strip()
            descripcion = request.POST.get('descripcion', '').strip()
            materiales = request.POST.get('materiales', '').strip()
            imagen = request.POST.get('imagen', '').strip()
            habilitado = request.POST.get('habilitado') == 'on'

            if not all([nombre, categoria_id, precio, descripcion, materiales, imagen]):
                messages.error(request, 'Completa todos los campos del formulario de producto.')
                return redirect('admin_panel')

            try:
                categoria_obj = Categoria.objects.get(pk=int(categoria_id))
                precio_decimal = float(precio)
                if precio_decimal <= 0:
                    raise ValueError('El precio debe ser mayor que cero.')

                # Validación básica de URL (solo verificar que empiece con http)
                if not imagen.startswith(('http://', 'https://')):
                    raise ValueError('La URL de imagen debe comenzar con http:// o https://')

                Producto.objects.create(
                    nombre=nombre,
                    categoria=categoria_obj,
                    precio=precio_decimal,
                    descripcion=descripcion,
                    materiales=materiales,
                    imagen=imagen,
                    habilitado=habilitado
                )
                messages.success(request, f'Producto "{nombre}" creado correctamente.')
            except Categoria.DoesNotExist:
                messages.error(request, 'Categoría no encontrada.')
            except ValueError as ve:
                messages.error(request, str(ve))
            except Exception as e:
                messages.error(request, f'Error al crear producto: {e}')
            return redirect('admin_panel')

        if action == 'editar_producto':
            producto_id = request.POST.get('producto_id')
            nombre = request.POST.get('nombre', '').strip()
            categoria = request.POST.get('categoria', '').strip()
            precio = request.POST.get('precio', '').strip()
            descripcion = request.POST.get('descripcion', '').strip()
            materiales = request.POST.get('materiales', '').strip()
            imagen = request.POST.get('imagen', '').strip()
            habilitado = request.POST.get('habilitado') == 'on'

            try:
                p = Producto.objects.get(pk=int(producto_id))
                p.nombre = nombre or p.nombre

                if categoria:
                    try:
                        cat_obj = Categoria.objects.get(pk=int(categoria))
                        p.categoria = cat_obj
                    except Categoria.DoesNotExist:
                        raise ValueError('Categoría no encontrada.')

                if precio:
                    precio_decimal = float(precio)
                    if precio_decimal <= 0:
                        raise ValueError('El precio debe ser mayor que cero.')
                    p.precio = precio_decimal

                p.descripcion = descripcion or p.descripcion
                p.materiales = materiales or p.materiales
                p.habilitado = habilitado

                if imagen:
                    if not imagen.startswith(('http://', 'https://')):
                        raise ValueError('La URL de imagen debe comenzar con http:// o https://')
                    p.imagen = imagen

                p.save()
                messages.success(request, f'Producto "{p.nombre}" actualizado correctamente.')
            except ValueError as ve:
                messages.error(request, str(ve))
            except Producto.DoesNotExist:
                messages.error(request, 'Producto no encontrado.')
            except Exception as e:
                messages.error(request, f'Error al editar producto: {e}')
            return redirect('admin_panel')

        if action == 'eliminar_producto':
            producto_id = request.POST.get('producto_id')
            try:
                p = Producto.objects.get(pk=int(producto_id))
                p.delete()
                messages.success(request, f'Producto "{p.nombre}" eliminado correctamente.')
            except Producto.DoesNotExist:
                messages.error(request, 'Producto no encontrado.')
            except Exception as e:
                messages.error(request, f'Error al eliminar producto: {e}')
            return redirect('admin_panel')

        if action == 'crear_categoria':
            categoria_nombre = request.POST.get('categoria_nombre', '').strip()
            if not categoria_nombre:
                messages.error(request, 'El nombre de la categoría es obligatorio.')
                return redirect('admin_panel')
            if Categoria.objects.filter(nombre__iexact=categoria_nombre).exists():
                messages.error(request, f'Ya existe una categoría con el nombre "{categoria_nombre}".')
                return redirect('admin_panel')
            try:
                Categoria.objects.create(nombre=categoria_nombre)
                messages.success(request, f'Categoría "{categoria_nombre}" creada correctamente.')
            except Exception as e:
                messages.error(request, f'Error al crear categoría: {e}')
            return redirect('admin_panel')

        if action == 'editar_categoria':
            categoria_id = request.POST.get('categoria_id')
            categoria_nombre = request.POST.get('categoria_nombre', '').strip()
            if not all([categoria_id, categoria_nombre]):
                messages.error(request, 'Completa todos los campos para editar la categoría.')
                return redirect('admin_panel')
            try:
                cat = Categoria.objects.get(pk=int(categoria_id))
                if Categoria.objects.filter(nombre__iexact=categoria_nombre).exclude(pk=categoria_id).exists():
                    messages.error(request, f'Ya existe otra categoría con el nombre "{categoria_nombre}".')
                    return redirect('admin_panel')
                cat.nombre = categoria_nombre
                cat.save()
                messages.success(request, f'Categoría "{cat.nombre}" actualizada.')
            except Categoria.DoesNotExist:
                messages.error(request, 'Categoría no encontrada.')
            except Exception as e:
                messages.error(request, f'Error al editar categoría: {e}')
            return redirect('admin_panel')

        if action == 'eliminar_categoria':
            categoria_id = request.POST.get('categoria_id')
            try:
                cat = Categoria.objects.get(pk=int(categoria_id))
                if cat.productos.exists():
                    messages.error(request, 'No puede eliminar una categoría con productos asociados.')
                else:
                    cat.delete()
                    messages.success(request, f'Categoría "{cat.nombre}" eliminada correctamente.')
            except Categoria.DoesNotExist:
                messages.error(request, 'Categoría no encontrada.')
            except Exception as e:
                messages.error(request, f'Error al eliminar categoría: {e}')
            return redirect('admin_panel')

    # filtrado opcional por estado
    filtro = request.GET.get('estado', '')
    pedidos = Pedido.objects.all().order_by('-created_at')
    if filtro:
        pedidos = pedidos.filter(estado=filtro)

    # obtener cotizaciones
    cotizaciones = Cotizacion.objects.all().order_by('-created_at')

    usuarios = User.objects.all().order_by('username')

    # búsqueda y paginación para productos
    productos_search = request.GET.get('productos_search', '')
    productos = Producto.objects.all().order_by('-created_at')
    if productos_search:
        productos = productos.filter(nombre__icontains=productos_search)

    productos_page = request.GET.get('productos_page', 1)
    productos_paginator = Paginator(productos, 10)  # 10 productos por página
    productos_page_obj = productos_paginator.get_page(productos_page)

    # búsqueda y paginación para categorías
    categorias_search = request.GET.get('categorias_search', '')
    categorias = Categoria.objects.all().order_by('nombre')
    if categorias_search:
        categorias = categorias.filter(nombre__icontains=categorias_search)

    categorias_page = request.GET.get('categorias_page', 1)
    categorias_paginator = Paginator(categorias, 10)  # 10 categorías por página
    categorias_page_obj = categorias_paginator.get_page(categorias_page)

    # obtener todas las categorías para los dropdowns (sin paginación)
    todas_categorias = Categoria.objects.all().order_by('nombre')

    # Calcular métricas adicionales para el dashboard
    from datetime import datetime, timedelta
    from django.utils import timezone

    # Pedidos pendientes
    pedidos_pendientes = Pedido.objects.filter(estado='pendiente')

    # Cotizaciones de los últimos 7 días
    hace_7_dias = timezone.now() - timedelta(days=7)
    cotizaciones_recientes = Cotizacion.objects.filter(created_at__gte=hace_7_dias)

    # Usuarios nuevos (últimos 30 días)
    hace_30_dias = timezone.now() - timedelta(days=30)
    usuarios_nuevos = User.objects.filter(date_joined__gte=hace_30_dias)

    # Productos deshabilitados
    productos_deshabilitados = Producto.objects.filter(habilitado=False)

    return render(request, 'admin_panel.html', {
        'pedidos': pedidos,
        'cotizaciones': cotizaciones,
        'usuarios': usuarios,
        'productos_page_obj': productos_page_obj,
        'productos_search': productos_search,
        'categorias_page_obj': categorias_page_obj,
        'categorias_search': categorias_search,
        'todas_categorias': todas_categorias,
        'filtro': filtro,
        'estados': Pedido.ESTADOS,
        # Métricas adicionales
        'pedidos_pendientes': pedidos_pendientes,
        'cotizaciones_recientes': cotizaciones_recientes,
        'usuarios_nuevos': usuarios_nuevos,
        'productos_deshabilitados': productos_deshabilitados,
    })
