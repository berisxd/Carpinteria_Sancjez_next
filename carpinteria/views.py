from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, HttpResponse
from django.contrib import messages
import logging
logger = logging.getLogger(__name__)
from io import BytesIO
import os
from django.contrib.auth import logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib.auth.views import LoginView
from django.urls import reverse
from django.db import OperationalError, ProgrammingError, DatabaseError
from django.core.paginator import Paginator
from django.conf import settings
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

from .forms import CustomUserCreationForm, EmailOrUsernameAuthenticationForm
import json
from .models import Contacto, Categoria, Producto, Pedido, Cotizacion
from .payment_simulator import simulate_payment


def healthz(request):
    try:
        from django.conf import settings
        slugs = list(Categoria.objects.order_by('slug').values_list('slug', flat=True))
        prods = Producto.objects.count()
        db_engine = settings.DATABASES['default'].get('ENGINE', '')
        return JsonResponse({'ok': True, 'engine': db_engine, 'categoria_slugs': slugs, 'productos': prods})
    except Exception as exc:
        return JsonResponse({'ok': False, 'error': str(exc)}, status=500)


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
    try:
        categoria_obj = Categoria.objects.get(slug=categoria)
    except Categoria.DoesNotExist:
        logger.error('categoria_not_found slug=%r db_slugs=%r', categoria,
                     list(Categoria.objects.values_list('slug', flat=True)))
        return render(request, 'categoria.html', {
            'categoria': categoria,
            'titulo_categoria': 'Categoría no encontrada',
            'productos': [],
        })
    except Exception as exc:
        logger.error('categoria_exception slug=%r exc=%r', categoria, exc)
        messages.error(request, 'Servicio temporalmente no disponible. Intenta nuevamente en unos minutos.')
        return render(request, 'categoria.html', {
            'categoria': categoria,
            'titulo_categoria': 'Servicio temporalmente no disponible',
            'productos': [],
        }, status=503)

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
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
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

        # El pago físico en carpintería siempre queda en pendiente y no usa simulación.
        if metodo_pago == 'ticket_tienda':
            simulacion = ''

        # manejo específico de simulaciones
        if simulacion == 'failure':
            if is_ajax:
                return JsonResponse({'status': 'error', 'message': 'Pago simulado fallido. Permanece en el checkout.'}, status=400)
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
            if is_ajax:
                return JsonResponse({'status': 'error', 'message': 'Por favor completa todos los campos requeridos.'}, status=400)
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
            logger.info(
                'pedido_creado id=%s metodo=%s estado=%s email=%s total=%s',
                pedido.id,
                pedido.metodo_pago,
                pedido.estado,
                pedido.email,
                pedido.total,
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
            redirect_url = reverse('pedido_confirmacion', kwargs={'pedido_id': pedido.id})

            # Para Mercado Pago, redirigir al checkout de MP
            if metodo_pago == 'mercado_pago':
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    mp_url = reverse('iniciar_pago_mercadopago', kwargs={'pedido_id': pedido.id})
                    return JsonResponse({'status': 'ok', 'pedido_id': pedido.id, 'redirect': mp_url})
                return redirect('iniciar_pago_mercadopago', pedido_id=pedido.id)

            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'status': 'ok', 'pedido_id': pedido.id, 'redirect': redirect_url})
            return redirect('pedido_confirmacion', pedido_id=pedido.id)

        except Exception as e:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
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
    try:
        if request.method == 'POST':
            form = CustomUserCreationForm(request.POST)
            if form.is_valid():
                form.save()
                # Do NOT log the user in automatically. Inform and redirect to login.
                messages.success(request, 'Registro exitoso. Por favor inicia sesión.')
                # Preserve 'next' parameter if present so login can redirect afterwards
                next_url = request.GET.get('next') or request.POST.get('next')
                if next_url:
                    return redirect(f"/login/?next={next_url}")
                return redirect('login')
            messages.error(request, 'Por favor corrige los errores en el formulario.')
        else:
            form = CustomUserCreationForm()
    except (OperationalError, ProgrammingError):
        form = CustomUserCreationForm()
        messages.error(
            request,
            'Servicio temporalmente no disponible. Intenta nuevamente en unos minutos.'
        )
    except Exception:
        form = CustomUserCreationForm()
        messages.error(
            request,
            'No fue posible procesar el registro en este momento. Intenta nuevamente.'
        )

    return render(request, 'register.html', {'form': form})


def logout_view(request):
    try:
        logout(request)
    except Exception:
        pass
    return redirect('home')


def _get_productos_pedido(pedido):
    try:
        productos = json.loads(pedido.productos_json)
    except Exception:
        return []

    for item in productos:
        try:
            precio = float(item.get('precio', 0))
            cantidad = int(item.get('cantidad', 0))
        except (TypeError, ValueError):
            precio = 0
            cantidad = 0
        item['precio'] = precio
        item['cantidad'] = cantidad
        item['subtotal'] = precio * cantidad
    return productos


def descargar_ticket_pdf(request, pedido_id):
    pedido = get_object_or_404(Pedido, pk=pedido_id)
    productos = _get_productos_pedido(pedido)

    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    margin = 42
    y = height - margin

    brand = colors.HexColor('#0f3e73')
    brand_light = colors.HexColor('#e9f1f8')
    accent = colors.HexColor('#d97706')
    text_dark = colors.HexColor('#1f2937')
    muted = colors.HexColor('#6b7280')

    def ensure_space(required_height=30):
        nonlocal y
        if y - required_height < margin:
            pdf.showPage()
            y = height - margin

    def draw_section_title(title):
        nonlocal y
        ensure_space(28)
        pdf.setFillColor(brand_light)
        pdf.roundRect(margin, y - 18, width - (margin * 2), 20, 6, fill=1, stroke=0)
        pdf.setFillColor(brand)
        pdf.setFont('Helvetica-Bold', 11)
        pdf.drawString(margin + 10, y - 5, title)
        y -= 30

    def draw_label_value(label, value, x, width_available, line_gap=16):
        nonlocal y
        text = f'{label}: {value}'
        pdf.setFont('Helvetica', 10)
        pdf.setFillColor(text_dark)
        parts = []
        current = ''
        for word in str(text).split():
            candidate = f'{current} {word}'.strip()
            if pdf.stringWidth(candidate, 'Helvetica', 10) <= width_available:
                current = candidate
            else:
                if current:
                    parts.append(current)
                current = word
        if current:
            parts.append(current)
        for part in parts:
            ensure_space(line_gap)
            pdf.drawString(x, y, part)
            y -= line_gap

    def draw_status_stamp(label):
        stamp_width = 120
        stamp_height = 34
        x = width - margin - stamp_width
        stamp_color = accent if label.upper() == 'PENDIENTE' else brand
        pdf.saveState()
        pdf.setStrokeColor(stamp_color)
        pdf.setFillColor(colors.white)
        pdf.setLineWidth(2)
        pdf.roundRect(x, y - 8, stamp_width, stamp_height, 8, fill=1, stroke=1)
        pdf.setFillColor(stamp_color)
        pdf.setFont('Helvetica-Bold', 15)
        pdf.drawCentredString(x + (stamp_width / 2), y + 5, label.upper())
        pdf.restoreState()

    pdf.setTitle(f'Ticket Pedido {pedido.id}')

    pdf.setFillColor(brand)
    pdf.rect(0, height - 110, width, 110, fill=1, stroke=0)

    logo_path = os.path.join(settings.BASE_DIR, 'static', 'img', 'logo.png')
    if os.path.exists(logo_path):
        try:
            pdf.drawImage(ImageReader(logo_path), margin, height - 92, width=52, height=52, mask='auto')
        except Exception:
            pass

    pdf.setFillColor(colors.white)
    pdf.setFont('Helvetica-Bold', 21)
    pdf.drawString(margin + 64, height - 56, 'Carpinteria Sanchez')
    pdf.setFont('Helvetica', 10)
    pdf.drawString(margin + 64, height - 74, 'Privada Progreso No. 12, San Cosme Atlamaxac, Tepeyanco, Tlaxcala')
    pdf.drawString(margin + 64, height - 89, 'Tel. (246) 158 1146  |  juanyahelsanchezflores5@gmail.com')

    y = height - 140
    pdf.setFillColor(text_dark)
    pdf.setFont('Helvetica-Bold', 18)
    pdf.drawString(margin, y, 'Ticket de pago')
    pdf.setFont('Helvetica', 10)
    pdf.setFillColor(muted)
    pdf.drawString(margin, y - 16, f'Folio #{pedido.id}  |  Generado {pedido.created_at.strftime("%d/%m/%Y %H:%M") if pedido.created_at else ""}')
    draw_status_stamp(pedido.get_estado_display())
    y -= 42

    draw_section_title('Datos del cliente')
    left_x = margin + 10
    right_x = width / 2 + 10
    original_y = y
    draw_label_value('Nombre', pedido.nombre_destinatario, left_x, (width / 2) - 60)
    draw_label_value('Email', pedido.email, left_x, (width / 2) - 60)
    draw_label_value('Telefono', pedido.telefono, left_x, (width / 2) - 60)
    left_end_y = y

    y = original_y
    draw_label_value('Direccion', pedido.direccion, right_x, (width / 2) - 60)
    draw_label_value('Ciudad', f'{pedido.ciudad} {pedido.codigo_postal}', right_x, (width / 2) - 60)
    if pedido.referencia:
        draw_label_value('Referencia', pedido.referencia, right_x, (width / 2) - 60)
    right_end_y = y
    y = min(left_end_y, right_end_y) - 8

    draw_section_title('Detalle de productos')
    ensure_space(40)
    table_x = margin
    table_width = width - (margin * 2)
    row_height = 22
    col_positions = [table_x + 10, table_x + 270, table_x + 350, table_x + 450]

    pdf.setFillColor(brand)
    pdf.roundRect(table_x, y - 16, table_width, 22, 6, fill=1, stroke=0)
    pdf.setFillColor(colors.white)
    pdf.setFont('Helvetica-Bold', 10)
    pdf.drawString(col_positions[0], y - 2, 'Producto')
    pdf.drawString(col_positions[1], y - 2, 'Cantidad')
    pdf.drawString(col_positions[2], y - 2, 'Precio')
    pdf.drawString(col_positions[3], y - 2, 'Subtotal')
    y -= 26

    for index, item in enumerate(productos, start=1):
        ensure_space(row_height + 8)
        if index % 2 == 1:
            pdf.setFillColor(colors.HexColor('#f8fafc'))
            pdf.rect(table_x, y - 14, table_width, row_height, fill=1, stroke=0)
        pdf.setFillColor(text_dark)
        pdf.setFont('Helvetica', 10)
        product_name = str(item.get('nombre', 'Producto'))[:42]
        pdf.drawString(col_positions[0], y, product_name)
        pdf.drawRightString(col_positions[1] + 40, y, str(item.get('cantidad', 0)))
        pdf.drawRightString(col_positions[2] + 55, y, f'${item.get("precio", 0):.2f}')
        pdf.drawRightString(col_positions[3] + 65, y, f'${item.get("subtotal", 0):.2f}')
        y -= row_height

    ensure_space(60)
    pdf.setStrokeColor(colors.HexColor('#d1d5db'))
    pdf.line(table_x, y + 6, table_x + table_width, y + 6)
    y -= 10
    pdf.setFont('Helvetica', 11)
    pdf.setFillColor(text_dark)
    pdf.drawRightString(table_x + table_width - 120, y, 'Total a pagar:')
    pdf.setFont('Helvetica-Bold', 16)
    pdf.setFillColor(brand)
    pdf.drawRightString(table_x + table_width, y, f'${float(pedido.total):.2f}')
    y -= 28

    draw_section_title('Instrucciones')
    pdf.setFillColor(text_dark)
    pdf.setFont('Helvetica', 10)
    instructions = [
        'Presenta este ticket en la carpinteria para completar el pago fisico.',
        'El pedido permanecera en pendiente hasta que el administrador confirme el pago.',
        f'Conserva tu folio #{pedido.id} para cualquier aclaracion.',
    ]
    for instruction in instructions:
        ensure_space(18)
        pdf.drawString(margin + 14, y, f'- {instruction}')
        y -= 18

    pdf.setFillColor(muted)
    pdf.setFont('Helvetica', 8)
    pdf.drawCentredString(width / 2, 24, 'Documento generado automaticamente por Carpinteria Sanchez')

    pdf.showPage()
    pdf.save()
    buffer.seek(0)

    response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="ticket-pedido-{pedido.id}.pdf"'
    return response


def pedido_confirmacion(request, pedido_id):
    pedido = get_object_or_404(Pedido, pk=pedido_id)
    productos = _get_productos_pedido(pedido)
    
    return render(request, 'pedido_confirmacion.html', {
        'pedido': pedido,
        'productos': productos
    })


class RoleBasedLoginView(LoginView):
    template_name = 'login.html'
    form_class = EmailOrUsernameAuthenticationForm
    redirect_authenticated_user = True

    def dispatch(self, request, *args, **kwargs):
        try:
            return super().dispatch(request, *args, **kwargs)
        except (OperationalError, ProgrammingError):
            messages.error(
                request,
                'Servicio temporalmente no disponible. Intenta nuevamente en unos minutos.'
            )
            return render(request, self.template_name, status=503)
        except Exception:
            messages.error(
                request,
                'No fue posible iniciar sesión en este momento. Intenta nuevamente.'
            )
            return render(request, self.template_name, status=503)

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
        action = request.POST.get('action', '')
        logger.info(f"admin_panel POST action={action} user={user.email}")

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
    from datetime import timedelta
    from django.utils import timezone

    # Pedidos pendientes
    pedidos_pendientes = Pedido.objects.filter(estado='pendiente')
    ticket_pendientes = Pedido.objects.filter(
        estado='pendiente',
        metodo_pago='ticket_tienda'
    ).order_by('-created_at')

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
        'ticket_pendientes': ticket_pendientes,
        'cotizaciones_recientes': cotizaciones_recientes,
        'usuarios_nuevos': usuarios_nuevos,
        'productos_deshabilitados': productos_deshabilitados,
    })


# ── Mercado Pago ───────────────────────────────────────────────────────────────

def _mp_sdk():
    """Return an initialized Mercado Pago SDK instance."""
    import mercadopago
    return mercadopago.SDK(settings.MP_ACCESS_TOKEN)


def iniciar_pago_mercadopago(request, pedido_id):
    """Create a MP preference and redirect the user to the MP checkout page."""
    pedido = get_object_or_404(Pedido, pk=pedido_id)

    if not settings.MP_ACCESS_TOKEN:
        messages.error(request, 'El pago con Mercado Pago no está configurado. Contacta al administrador.')
        return redirect('pedido_confirmacion', pedido_id=pedido.id)

    sdk = _mp_sdk()

    # Build items list from the order
    productos = _get_productos_pedido(pedido)
    if productos:
        items = [
            {
                "title": item["nombre"],
                "quantity": int(item["cantidad"]),
                "unit_price": float(item["precio"]),
                "currency_id": "MXN",
            }
            for item in productos
        ]
    else:
        items = [
            {
                "title": f"Pedido #{pedido.id} — Carpintería Sánchez",
                "quantity": 1,
                "unit_price": float(pedido.total),
                "currency_id": "MXN",
            }
        ]

    preference_data = {
        "items": items,
        "payer": {
            "name": pedido.nombre_destinatario,
            "email": pedido.email,
            "phone": {"number": pedido.telefono},
        },
        "back_urls": {
            "success": request.build_absolute_uri(
                reverse('mp_pago_exitoso', kwargs={'pedido_id': pedido.id})
            ),
            "failure": request.build_absolute_uri(
                reverse('mp_pago_fallido', kwargs={'pedido_id': pedido.id})
            ),
            "pending": request.build_absolute_uri(
                reverse('mp_pago_pendiente', kwargs={'pedido_id': pedido.id})
            ),
        },
        "auto_return": "approved",
        "notification_url": request.build_absolute_uri(reverse('mp_webhook')),
        "external_reference": str(pedido.id),
        "statement_descriptor": "Carpinteria Sanchez",
    }

    try:
        result = sdk.preference().create(preference_data)
        response = result.get("response", {})

        if result.get("status") not in (200, 201):
            logger.error("mp_preference_error pedido=%s response=%s", pedido.id, response)
            messages.error(request, "No se pudo iniciar el pago con Mercado Pago. Intenta de nuevo.")
            return redirect('pedido_confirmacion', pedido_id=pedido.id)

        # Use sandbox_init_point when in DEBUG mode, init_point for production
        init_point = response.get("sandbox_init_point" if settings.DEBUG else "init_point", "")
        if not init_point:
            messages.error(request, "Respuesta inválida de Mercado Pago. Intenta de nuevo.")
            return redirect('pedido_confirmacion', pedido_id=pedido.id)

        logger.info("mp_preference_created pedido=%s preference_id=%s", pedido.id, response.get("id"))
        return redirect(init_point)

    except Exception as exc:
        logger.error("mp_preference_exception pedido=%s exc=%s", pedido.id, exc)
        messages.error(request, "Error al conectar con Mercado Pago. Intenta de nuevo.")
        return redirect('pedido_confirmacion', pedido_id=pedido.id)


def mp_webhook(request):
    """Receive IPN/webhook notifications from Mercado Pago and update order status."""
    import hmac, hashlib

    if request.method != "POST":
        return HttpResponse(status=405)

    try:
        data = json.loads(request.body)
    except Exception:
        return HttpResponse(status=400)

    topic = data.get("type") or request.GET.get("topic", "")
    resource_id = (
        data.get("data", {}).get("id")
        or request.GET.get("id")
    )

    if topic not in ("payment", "merchant_order") or not resource_id:
        return HttpResponse(status=200)

    if not settings.MP_ACCESS_TOKEN:
        return HttpResponse(status=200)

    try:
        sdk = _mp_sdk()

        if topic == "payment":
            result = sdk.payment().get(resource_id)
            payment = result.get("response", {})
            external_ref = payment.get("external_reference")
            mp_status = payment.get("status")  # approved / pending / rejected / etc.
        else:
            result = sdk.merchant_order().get(resource_id)
            order = result.get("response", {})
            external_ref = order.get("external_reference")
            payments = order.get("payments", [])
            mp_status = payments[0].get("status") if payments else None

        if not external_ref:
            return HttpResponse(status=200)

        pedido = Pedido.objects.filter(pk=int(external_ref)).first()
        if not pedido:
            return HttpResponse(status=200)

        estado_map = {
            "approved": "confirmado",
            "pending": "pendiente",
            "in_process": "pendiente",
            "rejected": "cancelado",
            "cancelled": "cancelado",
            "refunded": "cancelado",
            "charged_back": "cancelado",
        }
        nuevo_estado = estado_map.get(mp_status)
        if nuevo_estado and pedido.estado != nuevo_estado:
            pedido.estado = nuevo_estado
            pedido.save()
            logger.info("mp_webhook pedido=%s mp_status=%s nuevo_estado=%s", pedido.id, mp_status, nuevo_estado)

    except Exception as exc:
        logger.error("mp_webhook_exception exc=%s", exc)

    return HttpResponse(status=200)


def mp_pago_exitoso(request, pedido_id):
    """Called by MP after a successful payment."""
    pedido = get_object_or_404(Pedido, pk=pedido_id)
    # Mark as confirmed if not already updated by webhook
    if pedido.estado == 'pendiente':
        pedido.estado = 'confirmado'
        pedido.save()
    return render(request, 'mp_resultado.html', {
        'pedido': pedido,
        'resultado': 'exitoso',
        'titulo': '¡Pago realizado con éxito!',
        'mensaje': 'Tu pago fue procesado correctamente. Recibirás un correo de confirmación en breve.',
        'icono': 'bi-check-circle-fill',
        'color': 'success',
    })


def mp_pago_fallido(request, pedido_id):
    """Called by MP after a failed payment."""
    pedido = get_object_or_404(Pedido, pk=pedido_id)
    if pedido.estado == 'pendiente':
        pedido.estado = 'cancelado'
        pedido.save()
    return render(request, 'mp_resultado.html', {
        'pedido': pedido,
        'resultado': 'fallido',
        'titulo': 'El pago no pudo completarse',
        'mensaje': 'Tu pago fue rechazado. Puedes intentarlo de nuevo o elegir otro método de pago.',
        'icono': 'bi-x-circle-fill',
        'color': 'danger',
    })


def mp_pago_pendiente(request, pedido_id):
    """Called by MP when payment is pending (e.g. cash / bank transfer)."""
    pedido = get_object_or_404(Pedido, pk=pedido_id)
    return render(request, 'mp_resultado.html', {
        'pedido': pedido,
        'resultado': 'pendiente',
        'titulo': 'Pago pendiente de acreditación',
        'mensaje': 'Tu pago está siendo procesado. Te notificaremos cuando se acredite. Conserva tu número de pedido.',
        'icono': 'bi-hourglass-split',
        'color': 'warning',
    })
