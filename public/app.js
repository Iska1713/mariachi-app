// ═══════════════════════════════════════════════════════════════════
// SECCIÓN 1: AUTENTICACIÓN Y LOGIN
// Maneja el login, creación de tokens y verificación de sesión
// ═══════════════════════════════════════════════════════════════════

// Variables globales para autenticación
let tokenActual = null;
let rolActual = null;

// ═══════════════════════════════════════════
// Función: Cambiar entre tabs de Admin/Integrante
// ═══════════════════════════════════════════
function cambiarTab(tipoAcceso) {
  // Ocultar todos los tabs
  document.querySelectorAll('.login-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelectorAll('.login-form').forEach(form => {
    form.classList.remove('active');
    form.style.display = 'none';
  });

  // Mostrar el tab seleccionado
  if (tipoAcceso === 'admin') {
    document.querySelector('.login-tab:nth-child(1)').classList.add('active');
    document.getElementById('formLoginAdmin').classList.add('active');
    document.getElementById('formLoginAdmin').style.display = 'block';
  } else if (tipoAcceso === 'integrante') {
    document.querySelector('.login-tab:nth-child(2)').classList.add('active');
    document.getElementById('formLoginIntegrante').classList.add('active');
    document.getElementById('formLoginIntegrante').style.display = 'block';
  }

  // Limpiar mensaje de error
  document.getElementById('mensajeError').classList.add('oculto');
}

// ═══════════════════════════════════════════
// Función: Mostrar mensaje de error en login
// ═══════════════════════════════════════════
function mostrarErrorLogin(mensaje) {
  const errorDiv = document.getElementById('mensajeError');
  errorDiv.textContent = mensaje;
  errorDiv.classList.remove('oculto');
}

// ═══════════════════════════════════════════
// Función: Enviar credenciales al servidor
// ═══════════════════════════════════════════
async function autenticar(password) {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: password })
    });

    const data = await response.json();

    if (data.success) {
      // Guardar token y rol en localStorage
      tokenActual = data.token;
      rolActual = data.rol;
      localStorage.setItem('token', data.token);
      localStorage.setItem('rol', data.rol);

      // Ocultar login, mostrar app
      document.getElementById('loginOverlay').classList.add('oculto');
      mostrarInterfazSegunRol(data.rol);

      // Cargar eventos
      cargarEventos();
    } else {
      mostrarErrorLogin(data.mensaje || 'Credenciales inválidas');
    }
  } catch (err) {
    mostrarErrorLogin('Error de conexión: ' + err.message);
  }
}

// ═══════════════════════════════════════════
// Event Listeners: Formularios de Login
// ═══════════════════════════════════════════
document.getElementById('formLoginAdmin').addEventListener('submit', (e) => {
  e.preventDefault();
  const password = document.getElementById('passwordAdmin').value;
  autenticar(password);
});

document.getElementById('formLoginIntegrante').addEventListener('submit', (e) => {
  e.preventDefault();
  const codigo = document.getElementById('codigoIntegrante').value;
  autenticar(codigo);
});

// ═══════════════════════════════════════════
// Función: Verificar token al cargar la página
// Si hay token válido, muestra la app sin pedir login
// NUEVO: Valida expiración client-side (automático 24h)
// ═══════════════════════════════════════════
function verificarToken() {
  const token = localStorage.getItem('token');
  const rol = localStorage.getItem('rol');

  if (token && rol) {
    // Decodificar token para verificar expiración
    try {
      const payload = JSON.parse(atob(token.split('.')[1])); // Decodificar payload
      const ahora = Math.floor(Date.now() / 1000); // Hora actual en segundos
      
      // Verificar si token ya expiró
      if (payload.exp < ahora) {
        // Token expirado: limpiar y mandar al login
        localStorage.removeItem('token');
        localStorage.removeItem('rol');
        location.reload();
        return;
      }
    } catch (err) {
      // Si no puede decodificar, limpia por seguridad
      localStorage.removeItem('token');
      localStorage.removeItem('rol');
      location.reload();
      return;
    }

    // Si token es válido, mostrar app
    tokenActual = token;
    rolActual = rol;

    // Ocultar login, mostrar app
    document.getElementById('loginOverlay').classList.add('oculto');
    mostrarInterfazSegunRol(rol);

    // Cargar eventos
    cargarEventos();
  }
}

// ═══════════════════════════════════════════
// Event Listener: Detectar cuando vuelves a la pestaña
// NUEVO: Verifica token al volver de otra app/pestaña
// Así detecta si expiró mientras estabas fuera
// ═══════════════════════════════════════════
document.addEventListener('visibilitychange', () => {
  // Si vuelves a la pestaña (era invisible antes)
  if (!document.hidden) {
    verificarToken(); // Verifica si el token expiró mientras no miraban
  }
});

// ═══════════════════════════════════════════
// Función: Cerrar sesión
// Borra el token y recarga para volver al login
// ═══════════════════════════════════════════
function cerrarSesion() {
  if (confirm('¿Deseas cerrar sesión?')) {
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    tokenActual = null;
    rolActual = null;
    location.reload();
  }
}

// ═══════════════════════════════════════════
// Event Listener: Botón Cerrar Sesión
// ═══════════════════════════════════════════
document.getElementById('btnCerrarSesion').addEventListener('click', cerrarSesion);


// ═══════════════════════════════════════════════════════════════════
// SECCIÓN 2: MOSTRAR/OCULTAR ELEMENTOS SEGÚN ROL
// Controla la visibilidad de botones y formularios según si es admin
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════
// Función: Mostrar/ocultar interfaz según rol
// Controla visibilidad de elementos según admin/integrante
// ═══════════════════════════════════════════
function mostrarInterfazSegunRol(rol) {
  // Mostrar header y secciones generales
  document.getElementById('header').style.display = 'flex';
  document.getElementById('seccionFiltros').style.display = 'block';
  document.getElementById('seccionTabla').style.display = 'block';

  if (rol === 'admin') {
    // ADMIN: Ve TODO (formulario, editar, eliminar, descargar)
    document.getElementById('seccionFormulario').style.display = 'block';
    document.getElementById('btnToggleForm').style.display = 'inline-block';
    document.getElementById('contenedorForm').classList.add('oculto');

    // Mostrar botones de editar/eliminar
    mostrarBotonesAccion(true);
  } else if (rol === 'integrante') {
    // INTEGRANTE: Solo ve agenda + descarga contrato (sin agregar/editar/eliminar)
    document.getElementById('seccionFormulario').style.display = 'block';
    document.getElementById('btnToggleForm').style.display = 'none';
    document.getElementById('contenedorForm').classList.add('oculto');

    // Ocultar botones de editar/eliminar
    mostrarBotonesAccion(false);
  }
}

// ═══════════════════════════════════════════
// Función: Mostrar/ocultar botones de acción
// Controla visibilidad de ✏️ y 🗑️ en tabla/tarjetas
// ═══════════════════════════════════════════
function mostrarBotonesAccion(mostrar) {
  // En tabla desktop
  document.querySelectorAll('.btn-editar, .btn-eliminar').forEach(btn => {
    btn.style.display = mostrar ? 'inline-block' : 'none';
  });

  // En tarjetas móvil
  document.querySelectorAll('.btn-editar-tarjeta, .btn-eliminar-tarjeta').forEach(btn => {
    btn.style.display = mostrar ? 'block' : 'none';
  });
}


// ═══════════════════════════════════════════════════════════════════
// SECCIÓN 3: GESTIÓN DE EVENTOS
// (Todo el código existente se mantiene igual)
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════
// Objeto campos: Define qué campos tiene cada evento
// ═══════════════════════════════════════════
const campos = {
  fecha_evento: { label: 'Fecha del evento', tipo: 'date' },
  hora_inicio: { label: 'Hora inicio', tipo: 'time' },
  hora_fin: { label: 'Hora fin', tipo: 'time' },
  lugar: { label: 'Lugar', tipo: 'text' },
  tipo_evento: { label: 'Tipo de evento', tipo: 'select' },
  responsable: { label: 'Responsable', tipo: 'text' },
  estado: { label: 'Estado', tipo: 'select' },
  costo_total: { label: 'Costo total', tipo: 'number' },
  fecha_registro: { label: 'Fecha de registro', tipo: 'date' },
  notas: { label: 'Notas', tipo: 'textarea' }
};

// ═══════════════════════════════════════════
// Variable de edición: almacena ID del evento siendo editado
// ═══════════════════════════════════════════
let eventoEnEdicion = null;

// ═══════════════════════════════════════════
// Función: Limpiar formulario
// Resetea todos los campos a vacío
// ═══════════════════════════════════════════
function limpiarFormulario() {
  document.getElementById('formEvento').reset();
  document.getElementById('tituloForm').textContent = 'Nuevo Evento';
  eventoEnEdicion = null;
}

// ═══════════════════════════════════════════
// Event Listener: Botón toggle formulario
// ═══════════════════════════════════════════
document.getElementById('btnToggleForm').addEventListener('click', () => {
  const contenedor = document.getElementById('contenedorForm');
  contenedor.classList.toggle('oculto');
  if (!contenedor.classList.contains('oculto')) {
    limpiarFormulario();
  }
});

// ═══════════════════════════════════════════
// Event Listener: Botón cancelar formulario
// ═══════════════════════════════════════════
document.getElementById('btnCancelar').addEventListener('click', () => {
  document.getElementById('contenedorForm').classList.add('oculto');
  limpiarFormulario();
});

// ═══════════════════════════════════════════
// Event Listener: Submit formulario
// Crea o edita evento según corresponda
// ═══════════════════════════════════════════
document.getElementById('formEvento').addEventListener('submit', async (e) => {
  e.preventDefault();

  // Recopilar datos del formulario
  const datos = {};
  Object.keys(campos).forEach(campo => {
    const elemento = document.getElementById(campo);
    datos[campo] = elemento.value || null;
  });

  try {
    // Obtener token para las peticiones
    const token = localStorage.getItem('token');
    
    let response;

    if (eventoEnEdicion) {
      // EDITAR evento existente - con Authorization header
      response = await fetch(`/api/eventos/${eventoEnEdicion}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(datos)
      });
    } else {
      // CREAR nuevo evento - con Authorization header
      response = await fetch('/api/eventos', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(datos)
      });
    }

    if (response.ok) {
      const mensaje = eventoEnEdicion ? 'Evento actualizado' : 'Evento creado';
      mostrarToast(mensaje, 'exito');
      document.getElementById('contenedorForm').classList.add('oculto');
      limpiarFormulario();
      cargarEventos();
    } else {
      mostrarToast('Error al guardar evento', 'error');
    }
  } catch (err) {
    mostrarToast('Error: ' + err.message, 'error');
  }
});

// ═══════════════════════════════════════════
// Función: Cargar todos los eventos desde API
// Renderiza AMBAS vistas (tabla + tarjetas)
// CSS decide cuál mostrar según el ancho
// ═══════════════════════════════════════════
async function cargarEventos() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/eventos', {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });

    // Si recibimos 401, token expiró
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('rol');
      location.reload();
      return;
    }

    const eventos = await response.json();

    // Renderizar AMBAS vistas con los MISMOS eventos
    // Tabla para desktop, tarjetas para móvil
    // CSS media queries deciden cuál mostrar
    renderizarTablaDesktop(eventos);
    renderizarTarjetas(eventos);

    // Actualizar contador de resultados
    document.getElementById('contadorResultados').textContent = `${eventos.length} evento(s) encontrado(s)`;
  } catch (err) {
    mostrarToast('Error cargando eventos: ' + err.message, 'error');
  }
}

// ═══════════════════════════════════════════
// Función: Renderizar tarjetas (móvil)
// Crea tarjetas expandibles para vista móvil
// ═══════════════════════════════════════════
function renderizarTarjetas(eventos) {
  const contenedor = document.querySelector('.tarjetas-contenedor');
  contenedor.innerHTML = '';

  eventos.forEach(evento => {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta';

    // Header de la tarjeta
    const header = document.createElement('div');
    header.className = 'tarjeta-header';
    header.innerHTML = `
      <span class="tarjeta-fecha">${evento.fecha_evento}</span>
      <span class="estado-badge estado-${evento.estado}">${evento.estado}</span>
    `;

    // Contenido siempre visible
    const contenido = document.createElement('div');
    contenido.className = 'tarjeta-linea';
    contenido.innerHTML = `
      <span class="tarjeta-linea-label">Horario:</span>
      <span class="tarjeta-linea-valor">${evento.hora_inicio} - ${evento.hora_fin}</span>
    `;

    const lugar = document.createElement('div');
    lugar.className = 'tarjeta-linea';
    lugar.innerHTML = `
      <span class="tarjeta-linea-label">Lugar:</span>
      <span class="tarjeta-linea-valor">${evento.lugar}</span>
    `;

    const responsable = document.createElement('div');
    responsable.className = 'tarjeta-linea';
    responsable.innerHTML = `
      <span class="tarjeta-linea-label">Responsable:</span>
      <span class="tarjeta-linea-valor">${evento.responsable}</span>
    `;

    // Contenido expandible
    const expandible = document.createElement('div');
    expandible.className = 'tarjeta-contenido-expandible';
    expandible.innerHTML = `
      <div class="tarjeta-linea">
        <span class="tarjeta-linea-label">Tipo:</span>
        <span class="tarjeta-linea-valor">${evento.tipo_evento}</span>
      </div>
      <div class="tarjeta-linea">
        <span class="tarjeta-linea-label">Costo:</span>
        <span class="tarjeta-linea-valor">${evento.costo_total ? '$' + evento.costo_total : '—'}</span>
      </div>
      <div class="tarjeta-linea">
        <span class="tarjeta-linea-label">F. Registro:</span>
        <span class="tarjeta-linea-valor">${evento.fecha_registro || '—'}</span>
      </div>
      <div class="tarjeta-linea">
        <span class="tarjeta-linea-label">Notas:</span>
        <span class="tarjeta-linea-valor">${evento.notas || '—'}</span>
      </div>
    `;

    // Botones
    const botones = document.createElement('div');
    botones.className = 'tarjeta-botones';
    botones.innerHTML = `
      <button class="tarjeta-btn-vermas" onclick="toggleExpandir(this)">Ver más ▼</button>
      <div class="tarjeta-btn-acciones">
        <button class="btn-editar-tarjeta" onclick="editarEvento('${evento._id}')" style="display: ${rolActual === 'admin' ? 'block' : 'none'}">✏️ Editar</button>
        <button class="btn-eliminar-tarjeta" onclick="eliminarEvento('${evento._id}')" style="display: ${rolActual === 'admin' ? 'block' : 'none'}">🗑️ Eliminar</button>
      </div>
    `;

    tarjeta.appendChild(header);
    tarjeta.appendChild(contenido);
    tarjeta.appendChild(lugar);
    tarjeta.appendChild(responsable);
    tarjeta.appendChild(expandible);
    tarjeta.appendChild(botones);

    contenedor.appendChild(tarjeta);
  });
}

// ═══════════════════════════════════════════
// Función: Toggle expandir tarjeta
// Muestra/oculta contenido expandible
// ═══════════════════════════════════════════
function toggleExpandir(boton) {
  const expandible = boton.parentElement.previousElementSibling;
  expandible.classList.toggle('expandida');

  if (expandible.classList.contains('expandida')) {
    boton.textContent = 'Ver menos ▲';
  } else {
    boton.textContent = 'Ver más ▼';
  }
}

// ═══════════════════════════════════════════
// Función: Renderizar tabla (desktop)
// Crea tabla con scroll horizontal
// ═══════════════════════════════════════════
function renderizarTablaDesktop(eventos) {
  const tbody = document.getElementById('cuerpoTabla');
  tbody.innerHTML = '';

  eventos.forEach(evento => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="col-fija">${evento.fecha_evento}</td>
      <td class="col-fija">${evento.hora_inicio}</td>
      <td class="col-fija">${evento.hora_fin}</td>
      <td class="col-fija">${evento.lugar}</td>
      <td class="col-fija"><span class="estado-badge estado-${evento.estado}">${evento.estado}</span></td>
      <td>${evento.tipo_evento}</td>
      <td>${evento.responsable}</td>
      <td>${evento.costo_total ? '$' + evento.costo_total : '—'}</td>
      <td>${evento.fecha_registro || '—'}</td>
      <td>${evento.notas || '—'}</td>
      <td>
        <button class="btn-editar" onclick="editarEvento('${evento._id}')" style="display: ${rolActual === 'admin' ? 'inline-block' : 'none'}">✏️</button>
        <button class="btn-eliminar" onclick="eliminarEvento('${evento._id}')" style="display: ${rolActual === 'admin' ? 'inline-block' : 'none'}">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ═══════════════════════════════════════════
// Función: Editar evento
// Carga datos en formulario para editar
// ═══════════════════════════════════════════
async function editarEvento(id) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/eventos/${id}`, {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });

    // Si recibimos 401, token expiró
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('rol');
      location.reload();
      return;
    }

    const evento = await response.json();

    // Llenar formulario con datos
    Object.keys(campos).forEach(campo => {
      const elemento = document.getElementById(campo);
      if (elemento) {
        elemento.value = evento[campo] || '';
      }
    });

    // Cambiar título y mostrar formulario
    document.getElementById('tituloForm').textContent = 'Editar Evento';
    document.getElementById('contenedorForm').classList.remove('oculto');
    eventoEnEdicion = id;

    // Scroll al formulario
    document.getElementById('contenedorForm').scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    mostrarToast('Error cargando evento: ' + err.message, 'error');
  }
}

// ═══════════════════════════════════════════
// Función: Eliminar evento
// Pide confirmación antes de eliminar
// ═══════════════════════════════════════════
async function eliminarEvento(id) {
  if (!confirm('¿Deseas eliminar este evento?')) return;

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/eventos/${id}`, { 
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });

    // Si recibimos 401, token expiró
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('rol');
      location.reload();
      return;
    }

    if (response.ok) {
      mostrarToast('Evento eliminado', 'exito');
      cargarEventos();
    } else {
      mostrarToast('Error eliminando evento', 'error');
    }
  } catch (err) {
    mostrarToast('Error: ' + err.message, 'error');
  }
}

// ═══════════════════════════════════════════
// Event Listener: Botón Filtrar
// Filtra eventos y renderiza AMBAS vistas
// ═══════════════════════════════════════════
document.getElementById('btnFiltrar').addEventListener('click', async () => {
  const fecha = document.getElementById('filtro_fecha').value;
  const estado = document.getElementById('filtro_estado').value;
  const responsable = document.getElementById('filtro_responsable').value;

  try {
    let url = '/api/eventos/buscar?';
    const params = [];

    if (fecha) params.push(`fecha_evento=${fecha}`);
    if (estado) params.push(`estado=${estado}`);
    if (responsable) params.push(`responsable=${responsable}`);

    url += params.join('&');

    const token = localStorage.getItem('token');
    const response = await fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('rol');
      location.reload();
      return;
    }

    const eventos = await response.json();

    // Renderizar AMBAS vistas con los eventos filtrados
    // CSS media queries deciden cuál mostrar
    renderizarTablaDesktop(eventos);
    renderizarTarjetas(eventos);

    document.getElementById('contadorResultados').textContent = `${eventos.length} evento(s) encontrado(s)`;
  } catch (err) {
    mostrarToast('Error filtrando: ' + err.message, 'error');
  }
});

// ═══════════════════════════════════════════
// Event Listener: Botón Limpiar Filtros
// Borra fecha, estado y responsable
// ═══════════════════════════════════════════
document.getElementById('btnLimpiar').addEventListener('click', () => {
  // Limpiar campo de fecha
  document.getElementById('filtro_fecha').value = '';
  
  // Resetear select de estado a "Todos"
  document.getElementById('filtro_estado').value = '';
  
  // Limpiar campo de responsable
  document.getElementById('filtro_responsable').value = '';
  
  // Mostrar mensaje de confirmación
  mostrarToast('Filtros limpiados', 'exito');
});

document.getElementById('btnVerTodos').addEventListener('click', cargarEventos);

// ═══════════════════════════════════════════
// Función: Mostrar notificación flotante (toast)
// ═══════════════════════════════════════════
function mostrarToast(mensaje, tipo) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${tipo}`;
  toast.textContent = mensaje;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-salida');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ═══════════════════════════════════════════
// AL CARGAR LA PÁGINA
// Verifica si hay token y muestra la interfaz
// ═══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  verificarToken();
});