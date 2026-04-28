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
}

function obtenerEscuelasFiltradas() {
  return escuelas.filter(e => {
    const pasaEstado = filtroEstado === "todos" || e.estado === filtroEstado;
    const pasaPrioritaria = !soloPrioritarias || e.prioritaria;
    return pasaEstado && pasaPrioritaria;
  });
}

function filtrarEstado(estado) {
  filtroEstado = estado;
  renderMapa();
}

function filtrarPrioritarias() {
  soloPrioritarias = !soloPrioritarias;
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

    <p><strong>Nombre:</strong><br>${e.nombre || "-"}</p>
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

function abrirModalAgregar() {
  document.getElementById("modalTitulo").innerText = "Agregar escuela";
  document.getElementById("formEscuela").reset();
  document.getElementById("editId").value = "";
  document.getElementById("modal").classList.remove("hidden");
}

function cerrarModal() {
  document.getElementById("modal").classList.add("hidden");
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

function editarEscuela(id) {
  const e = escuelas.find(x => x.id === id);
  if (!e) return;

  document.getElementById("modalTitulo").innerText = "Editar escuela";
  document.getElementById("editId").value = e.id;
  document.getElementById("escuela").value = e.escuela || "";
  document.getElementById("nombre").value = e.nombre || "";
  document.getElementById("direccion").value = e.direccion || "";
  document.getElementById("localidad").value = e.localidad || "";
  document.getElementById("departamento").value = e.departamento || "";
  document.getElementById("tipo").value = e.tipo || "";
  document.getElementById("telefono").value = e.telefono || "";
  document.getElementById("lat").value = e.lat || "";
  document.getElementById("lng").value = e.lng || "";
  document.getElementById("estado").value = e.estado || "rojo";
  document.getElementById("prioritaria").checked = Boolean(e.prioritaria);
  document.getElementById("fechaCoordinada").value = e.fechaCoordinada || "";
  document.getElementById("fechaRealizada").value = e.fechaRealizada || "";
  document.getElementById("charlistas").value = e.charlistas || "";
  document.getElementById("alumnos").value = e.alumnos || "";
  document.getElementById("imagenGrupo").value = e.imagenGrupo || "";
  document.getElementById("imagenFormulario").value = e.imagenFormulario || "";
  document.getElementById("observaciones").value = e.observaciones || "";

  document.getElementById("modal").classList.remove("hidden");
}

function coordinarEscuela(id) {
  const fecha = prompt("Ingresá fecha y hora de la charla. Ejemplo: 2026-05-10 14:00");
  if (!fecha) return;

  const e = escuelas.find(x => x.id === id);
  e.estado = "amarillo";
  e.fechaCoordinada = fecha;

  guardarLocal();
  actualizarTodo();
  mostrarDetalle(id);
}

function marcarRealizada(id) {
  const e = escuelas.find(x => x.id === id);

  const fecha = prompt("Fecha y hora realizada. Ejemplo: 2026-05-10 14:00");
  if (!fecha) return;

  const charlistas = prompt("¿Quiénes dieron la charla?");
  const alumnos = prompt("Cantidad de alumnos");

  e.estado = "verde";
  e.fechaRealizada = fecha;
  e.charlistas = charlistas || "";
  e.alumnos = Number(alumnos || 0);

  guardarLocal();
  actualizarTodo();
  mostrarDetalle(id);
}

function renderTabla() {
  const tbody = document.getElementById("tablaEscuelas");
  const buscar = document.getElementById("buscar")?.value?.toLowerCase() || "";

  const lista = escuelas.filter(e => {
    return JSON.stringify(e).toLowerCase().includes(buscar);
  });

  tbody.innerHTML = lista.map(e => `
    <tr onclick="mostrarDetalle(${e.id})">
      <td>${e.escuela}</td>
      <td>${e.nombre || "-"}</td>
      <td>${e.direccion || "-"}</td>
      <td>${e.tipo || "-"}</td>
      <td>${e.telefono || "-"}</td>
      <td><span class="badge ${e.estado}">${textoEstado(e.estado)}</span></td>
      <td>${e.prioritaria ? "Sí ⭐" : "No"}</td>
      <td>${formatearFecha(e.fechaCoordinada)}</td>
      <td>${formatearFecha(e.fechaRealizada)}</td>
      <td>${e.alumnos || "-"}</td>
      <td>
        <button onclick="event.stopPropagation(); editarEscuela(${e.id})">✏️</button>
        <button onclick="event.stopPropagation(); eliminarEscuela(${e.id})">🗑️</button>
      </td>
    </tr>
  `).join("");
}

function eliminarEscuela(id) {
  if (!confirm("¿Eliminar esta escuela?")) return;

  escuelas = escuelas.filter(e => e.id !== id);
  guardarLocal();
  actualizarTodo();
  cerrarDetalle();
}

function textoEstado(estado) {
  if (estado === "rojo") return "Sin coordinar";
  if (estado === "amarillo") return "Coordinada";
  if (estado === "verde") return "Realizada";
  return estado;
}

function formatearFecha(fecha) {
  if (!fecha) return "-";
  return fecha.replace("T", " ");
}

function actualizarStats() {
  document.getElementById("statTotal").innerText = escuelas.length;
  document.getElementById("statVerdes").innerText = escuelas.filter(e => e.estado === "verde").length;
  document.getElementById("statAmarillas").innerText = escuelas.filter(e => e.estado === "amarillo").length;
  document.getElementById("statRojas").innerText = escuelas.filter(e => e.estado === "rojo").length;
  document.getElementById("statPrioritarias").innerText = escuelas.filter(e => e.prioritaria).length;
  document.getElementById("statAlumnos").innerText = escuelas.reduce((acc, e) => acc + Number(e.alumnos || 0), 0);

  document.getElementById("resumenTexto").innerHTML = `
    <p><strong>Total de escuelas:</strong> ${escuelas.length}</p>
    <p><strong>Charlas realizadas:</strong> ${escuelas.filter(e => e.estado === "verde").length}</p>
    <p><strong>Charlas coordinadas:</strong> ${escuelas.filter(e => e.estado === "amarillo").length}</p>
    <p><strong>Sin coordinar:</strong> ${escuelas.filter(e => e.estado === "rojo").length}</p>
    <p><strong>Alumnos alcanzados:</strong> ${escuelas.reduce((acc, e) => acc + Number(e.alumnos || 0), 0)}</p>
  `;
}

function exportarJSON() {
  const data = JSON.stringify(escuelas, null, 2);
  document.getElementById("jsonPreview").value = data;

  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "escuelas.json";
  a.click();

  URL.revokeObjectURL(url);
}

function importarJSON(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function(e) {
    try {
      escuelas = JSON.parse(e.target.result);
      guardarLocal();
      actualizarTodo();
      alert("Datos importados correctamente.");
    } catch {
      alert("El archivo no tiene formato JSON válido.");
    }
  };

  reader.readAsText(file);
}

function borrarTodo() {
  if (!confirm("¿Seguro que querés borrar todas las escuelas guardadas?")) return;
  escuelas = [];
  guardarLocal();
  actualizarTodo();
  cerrarDetalle();
}

function cargarDatosDemo() {
  if (escuelas.length > 0) return;

  escuelas = [
    {
      id: 1,
      escuela: "25",
      nombre: "Escuela N° 25",
      direccion: "Av. Italia 1234",
      localidad: "Montevideo",
      departamento: "Montevideo",
      tipo: "Pública - Urbana",
      telefono: "2400 0000",
      lat: -34.881,
      lng: -56.12,
      estado: "rojo",
      prioritaria: true,
      fechaCoordinada: "",
      fechaRealizada: "",
      charlistas: "",
      alumnos: 0,
      imagenGrupo: "",
      imagenFormulario: "",
      observaciones: ""
    },
    {
      id: 2,
      escuela: "102",
      nombre: "Escuela N° 102",
      direccion: "Luis Alberto de Herrera 3456",
      localidad: "Montevideo",
      departamento: "Montevideo",
      tipo: "Pública - Urbana",
      telefono: "2487 6543",
      lat: -34.87,
      lng: -56.17,
      estado: "amarillo",
      prioritaria: false,
      fechaCoordinada: "2026-05-20 10:00",
      fechaRealizada: "",
      charlistas: "",
      alumnos: 0,
      imagenGrupo: "",
      imagenFormulario: "",
      observaciones: ""
    },
    {
      id: 3,
      escuela: "58",
      nombre: "Escuela N° 58",
      direccion: "Camino Maldonado 6789",
      localidad: "Ciudad de la Costa",
      departamento: "Canelones",
      tipo: "Pública - Rural",
      telefono: "4372 1122",
      lat: -34.82,
      lng: -55.98,
      estado: "verde",
      prioritaria: true,
      fechaCoordinada: "2026-04-15 09:00",
      fechaRealizada: "2026-04-15 09:30",
      charlistas: "Ana, Pablo y Lucía",
      alumnos: 120,
      imagenGrupo: "",
      imagenFormulario: "",
      observaciones: ""
    }
  ];

  guardarLocal();
}

function actualizarTodo() {
  renderMapa();
  renderTabla();
  actualizarStats();
}

cargarDatosDemo();
actualizarTodo();
