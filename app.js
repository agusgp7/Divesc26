let escuelas = JSON.parse(localStorage.getItem("escuelas")) || [];
let filtroEstado = "todos";
let soloPrioritarias = false;
let markers = [];

const map = L.map("map").setView([-34.9011, -56.1645], 11);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap"
}).addTo(map);

document.querySelectorAll(".nav").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));

    btn.classList.add("active");
    document.getElementById(btn.dataset.section).classList.add("active");

    setTimeout(() => map.invalidateSize(), 200);
  });
});

document.getElementById("formEscuela").addEventListener("submit", guardarEscuela);

function guardarLocal() {
  localStorage.setItem("escuelas", JSON.stringify(escuelas));
}

function crearIcono(estado, prioritaria) {
  const html = `
    <div class="pin ${estado} ${prioritaria ? "prioritaria" : ""}">
      <span>${prioritaria ? "★" : ""}</span>
    </div>
  `;

  return L.divIcon({
    html,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 32]
  });
}

function renderMapa() {
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  const visibles = obtenerEscuelasFiltradas();

  visibles.forEach(escuela => {
    const marker = L.marker([escuela.lat, escuela.lng], {
      icon: crearIcono(escuela.estado, escuela.prioritaria)
    }).addTo(map);

    marker.on("click", () => mostrarDetalle(escuela.id));
    markers.push(marker);
  });

  // 💥 Auto centrado
  if (markers.length > 0) {
    const group = L.featureGroup(markers);
    map.fitBounds(group.getBounds(), {
      padding: [40, 40],
      maxZoom: 12
    });
  }
}

function obtenerEscuelasFiltradas() {
  return escuelas.filter(e => {
    const pasaEstado = filtroEstado === "todos" || e.estado === filtroEstado;
    const pasaPrioritaria = !soloPrioritarias || e.prioritaria;
    return pasaEstado && pasaPrioritaria;
  });
}

// 🔥 FILTROS MEJORADOS
function filtrarEstado(estado, boton) {
  filtroEstado = estado;
  soloPrioritarias = false;

  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.classList.remove("active");
  });

  if (boton) boton.classList.add("active");

  renderMapa();
}

function filtrarPrioritarias(boton) {
  soloPrioritarias = true;
  filtroEstado = "todos";

  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.classList.remove("active");
  });

  if (boton) boton.classList.add("active");

  renderMapa();
}

function mostrarDetalle(id) {
  const e = escuelas.find(x => x.id === id);
  if (!e) return;

  const estadoTexto = {
    rojo: "Sin coordinar",
    amarillo: "Coordinada",
    verde: "Realizada"
  };

  let acciones = "";

  if (e.estado === "rojo") {
    acciones = `<button class="primary full" onclick="coordinarEscuela(${e.id})">Coordinar charla</button>`;
  }

  if (e.estado === "amarillo") {
    acciones = `<button class="primary full" onclick="marcarRealizada(${e.id})">Marcar como realizada</button>`;
  }

  document.getElementById("panelDetalle").innerHTML = `
    <button class="close" onclick="cerrarDetalle()">×</button>
    <h2>Escuela N° ${e.escuela}</h2>
    <p><span class="badge ${e.estado}">${estadoTexto[e.estado]}</span></p>
    ${e.prioritaria ? `<p><span class="badge prioritaria">⭐ Túnicas en Red</span></p>` : ""}

    <hr>

    <p><strong>Nombre:</strong><br>${e.nombre || "Sin nombre"}</p>
    <p><strong>Dirección:</strong><br>${e.direccion || "-"}</p>
    <p><strong>Localidad:</strong><br>${e.localidad || "-"}</p>
    <p><strong>Tipo:</strong><br>${e.tipo || "-"}</p>
    <p><strong>Teléfono:</strong><br>${e.telefono || "-"}</p>

    ${e.fechaCoordinada ? `<p><strong>Fecha coordinada:</strong><br>${formatearFecha(e.fechaCoordinada)}</p>` : ""}
    ${e.fechaRealizada ? `<p><strong>Fecha realizada:</strong><br>${formatearFecha(e.fechaRealizada)}</p>` : ""}
    ${e.charlistas ? `<p><strong>Charlistas:</strong><br>${e.charlistas}</p>` : ""}
    ${e.alumnos ? `<p><strong>Alumnos:</strong><br>${e.alumnos}</p>` : ""}

    ${e.imagenGrupo ? `<p><a href="${e.imagenGrupo}" target="_blank">Ver imagen del grupo</a></p>` : ""}
    ${e.imagenFormulario ? `<p><a href="${e.imagenFormulario}" target="_blank">Ver formulario firmado</a></p>` : ""}

    ${acciones}

    <button class="full" onclick="editarEscuela(${e.id})">Editar datos</button>
  `;
}

function cerrarDetalle() {
  document.getElementById("panelDetalle").innerHTML = `
    <button class="close" onclick="cerrarDetalle()">×</button>
    <h2>Seleccioná una escuela</h2>
    <p>Hacé clic en un pin del mapa o en una fila de la planilla.</p>
  `;
}

function guardarEscuela(event) {
  event.preventDefault();

  const idEdit = document.getElementById("editId").value;

  const escuela = {
    id: idEdit ? Number(idEdit) : Date.now(),
    escuela: document.getElementById("escuela").value,
    nombre: document.getElementById("nombre").value,
    direccion: document.getElementById("direccion").value,
    localidad: document.getElementById("localidad").value,
    departamento: document.getElementById("departamento").value,
    tipo: document.getElementById("tipo").value,
    telefono: document.getElementById("telefono").value,
    lat: Number(document.getElementById("lat").value),
    lng: Number(document.getElementById("lng").value),
    estado: document.getElementById("estado").value,
    prioritaria: document.getElementById("prioritaria").checked,
    fechaCoordinada: document.getElementById("fechaCoordinada").value,
    fechaRealizada: document.getElementById("fechaRealizada").value,
    charlistas: document.getElementById("charlistas").value,
    alumnos: Number(document.getElementById("alumnos").value || 0),
    imagenGrupo: document.getElementById("imagenGrupo").value,
    imagenFormulario: document.getElementById("imagenFormulario").value,
    observaciones: document.getElementById("observaciones").value
  };

  if (idEdit) {
    escuelas = escuelas.map(e => e.id === Number(idEdit) ? escuela : e);
  } else {
    escuelas.push(escuela);
  }

  guardarLocal();
  cerrarModal();
  actualizarTodo();
  mostrarDetalle(escuela.id);
}

// resto igual ↓↓↓
function editarEscuela(id) { /* igual */ }
function coordinarEscuela(id) { /* igual */ }
function marcarRealizada(id) { /* igual */ }
function renderTabla() { /* igual */ }
function eliminarEscuela(id) { /* igual */ }
function textoEstado(estado) { /* igual */ }
function formatearFecha(fecha) { /* igual */ }
function actualizarStats() { /* igual */ }
function exportarJSON() { /* igual */ }
function importarJSON(event) { /* igual */ }
function borrarTodo() { /* igual */ }
function cargarDatosDemo() { /* igual */ }

function actualizarTodo() {
  renderMapa();
  renderTabla();
  actualizarStats();
}

cargarDatosDemo();
actualizarTodo();
