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

function filtrarEstado(estado, boton) {
  filtroEstado = estado;
  soloPrioritarias = false;

  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.classList.remove("active");
  });

  if (boton) {
    boton.classList.add("active");
  }

  renderMapa();
}

function filtrarPrioritarias(boton) {
  soloPrioritarias = true;
  filtroEstado = "todos";

  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.classList.remove("active");
  });

  if (boton) {
    boton.classList.add("active");
  }

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
    "id": 1,
    "escuela": "1",
    "nombre": "JOSE PEDRO RAMIREZ",
    "direccion": "J.P Varela y Roman Guerra",
    "localidad": "MALDONADO",
    "departamento": "Maldonado",
    "tipo": "Práctica - HP",
    "telefono": "42223751",
    "lat": -34.904264,
    "lng": -54.956523,
    "estado": "rojo",
    "prioritaria": false,
    "fechaCoordinada": "",
    "fechaRealizada": "",
    "charlistas": "",
    "alumnos": 0,
    "imagenGrupo": "",
    "imagenFormulario": "",
    "observaciones": ""
  },
  {
    "id": 2,
    "escuela": "2",
    "nombre": "JOSE PEDRO VARELA",
    "direccion": "Michellini y 25 de mayo",
    "localidad": "MALDONADO",
    "departamento": "Maldonado",
    "tipo": "Práctica - HP",
    "telefono": "42222210",
    "lat": -34.909583,
    "lng": -54.960656,
    "estado": "amarillo",
    "prioritaria": false,
    "fechaCoordinada": "2026-04-11 10:30",
    "fechaRealizada": "",
    "charlistas": "",
    "alumnos": 0,
    "imagenGrupo": "",
    "imagenFormulario": "",
    "observaciones": ""
  },
  {
    "id": 3,
    "escuela": "3",
    "nombre": "JUAN DE DIOS CURBELO",
    "direccion": "Maldonado y 25 de agosto",
    "localidad": "SAN CARLOS",
    "departamento": "Maldonado",
    "tipo": "Urbana Común",
    "telefono": "42669223",
    "lat": -34.791116,
    "lng": -54.913969,
    "estado": "rojo",
    "prioritaria": false,
    "fechaCoordinada": "",
    "fechaRealizada": "",
    "charlistas": "",
    "alumnos": 0,
    "imagenGrupo": "",
    "imagenFormulario": "",
    "observaciones": ""
  },
  {
    "id": 5,
    "escuela": "5",
    "nombre": "ALEJANDRO Y SAMUEL LAFONE",
    "direccion": "Gorlero y 23 El corral",
    "localidad": "PUNTA DEL",
    "departamento": "Maldonado",
    "tipo": "Tiempo Extendido",
    "telefono": "42441838",
    "lat": -34.963389,
    "lng": -54.94486,
    "estado": "rojo",
    "prioritaria": false,
    "fechaCoordinada": "",
    "fechaRealizada": "",
    "charlistas": "",
    "alumnos": 0,
    "imagenGrupo": "",
    "imagenFormulario": "",
    "observaciones": ""
  },
  {
    "id": 7,
    "escuela": "7",
    "nombre": "GRAL. JOSE DE SAN MARTIN",
    "direccion": "Batlle y Ordoñez y Acevedo",
    "localidad": "MALDONADO",
    "departamento": "Maldonado",
    "tipo": "Urbana Común",
    "telefono": "42223066",
    "lat": -34.896185,
    "lng": -54.953225,
    "estado": "rojo",
    "prioritaria": true,
    "fechaCoordinada": "",
    "fechaRealizada": "",
    "charlistas": "",
    "alumnos": 0,
    "imagenGrupo": "",
    "imagenFormulario": "",
    "observaciones": ""
  },
  {
    "id": 8,
    "escuela": "8",
    "nombre": "JOSE ENRIQUE RODO",
    "direccion": "Carlos Reyles y Alvariza",
    "localidad": "SAN CARLOS",
    "departamento": "Maldonado",
    "tipo": "Práctica - HP",
    "telefono": "42669112",
    "lat": -34.793638,
    "lng": -54.921409,
    "estado": "rojo",
    "prioritaria": false,
    "fechaCoordinada": "",
    "fechaRealizada": "",
    "charlistas": "",
    "alumnos": 0,
    "imagenGrupo": "",
    "imagenFormulario": "",
    "observaciones": ""
  },
  {
    "id": 10,
    "escuela": "10",
    "nombre": "CAYETANO SILVA",
    "direccion": "E. Rodó y Lavagna",
    "localidad": "SAN CARLOS",
    "departamento": "Maldonado",
    "tipo": "Tiempo Completo",
    "telefono": "42669384",
    "lat": -34.7921,
    "lng": -54.934678,
    "estado": "rojo",
    "prioritaria": false,
    "fechaCoordinada": "",
    "fechaRealizada": "",
    "charlistas": "",
    "alumnos": 0,
    "imagenGrupo": "",
    "imagenFormulario": "",
    "observaciones": ""
  },
  {
    "id": 13,
    "escuela": "13",
    "nombre": "VIRREY PEDRO DE CEVALLOS",
    "direccion": "Araújo y Gonzalez Olaza",
    "localidad": "SAN CARLOS",
    "departamento": "Maldonado",
    "tipo": "Urbana Común",
    "telefono": "42669645",
    "lat": -34.783383,
    "lng": -54.923925,
    "estado": "rojo",
    "prioritaria": false,
    "fechaCoordinada": "",
    "fechaRealizada": "",
    "charlistas": "",
    "alumnos": 0,
    "imagenGrupo": "",
    "imagenFormulario": "",
    "observaciones": ""
  },
  {
    "id": 19,
    "escuela": "19",
    "nombre": "MTRA. RAQUEL RODRIGUEZ CANALE",
    "direccion": "Los destinos e Hidalgo",
    "localidad": "LA BARRA",
    "departamento": "Maldonado",
    "tipo": "Tiempo Completo",
    "telefono": "42770342",
    "lat": -34.913302,
    "lng": -54.860816,
    "estado": "rojo",
    "prioritaria": false,
    "fechaCoordinada": "",
    "fechaRealizada": "",
    "charlistas": "",
    "alumnos": 0,
    "imagenGrupo": "",
    "imagenFormulario": "",
    "observaciones": ""
  },
  {
    "id": 21,
    "escuela": "21",
    "nombre": "JUAN ZORRILLA DE SAN MARTIN",
    "direccion": "Salto y Porto Alegre",
    "localidad": "PUNTA DEL ESTE",
    "departamento": "Maldonado",
    "tipo": "Tiempo Completo",
    "telefono": "42483368",
    "lat": -34.939879,
    "lng": -54.931078,
    "estado": "amarillo",
    "prioritaria": true,
    "fechaCoordinada": "2026-05-04T11:00",
    "fechaRealizada": "",
    "charlistas": "",
    "alumnos": 27,
    "imagenGrupo": "",
    "imagenFormulario": "",
    "observaciones": ""
  },
  {
    "id": 24,
    "escuela": "24",
    "nombre": "MTRO. CANDIDO VILLAR",
    "direccion": "R104 y cmno escuela",
    "localidad": "SAN CARLOS",
    "departamento": "Maldonado",
    "tipo": "Tiempo Completo",
    "telefono": "42667987",
    "lat": -34.796402,
    "lng": -54.867143,
    "estado": "rojo",
    "prioritaria": false,
    "fechaCoordinada": "",
    "fechaRealizada": "",
    "charlistas": "",
    "alumnos": 0,
    "imagenGrupo": "",
    "imagenFormulario": "",
    "observaciones": ""
  },
  {
    "id": 25,
    "escuela": "25",
    "nombre": "GRAL. LEONARDO OLIVERA",
    "direccion": "Reconquista y Rincón",
    "localidad": "SAN CARLOS",
    "departamento": "Maldonado",
    "tipo": "Urbana Común",
    "telefono": "43669666",
    "lat": -34.794697,
    "lng": -54.927975,
    "estado": "rojo",
    "prioritaria": false,
    "fechaCoordinada": "",
    "fechaRealizada": "",
    "charlistas": "",
    "alumnos": 0,
    "imagenGrupo": "",
    "imagenFormulario": "",
    "observaciones": ""
  },
  {
    "id": 37,
    "escuela": "37",
    "nombre": "FRANCISCO PIRIA",
    "direccion": "Celedonio Rojas y Maua",
    "localidad": "PIRIÁPOLIS",
    "departamento": "Maldonado",
    "tipo": "Urbana Común",
    "telefono": "44322805",
    "lat": -34.845214,
    "lng": -55.266951,
    "estado": "rojo",
    "prioritaria": false,
    "fechaCoordinada": "",
    "fechaRealizada": "",
    "charlistas": "",
    "alumnos": 0,
    "imagenGrupo": "",
    "imagenFormulario": "",
    "observaciones": ""
  },
  {
    "id": 45,
    "escuela": "45",
    "nombre": "DR. ALFONSO LAMAS",
    "direccion": "Calle 66 y 41",
    "localidad": "PLAYA VERDE",
    "departamento": "Maldonado",
    "tipo": "Rural",
    "telefono": "44223968",
    "lat": -34.824755,
    "lng": -55.30442,
    "estado": "rojo",
    "prioritaria": false,
    "fechaCoordinada": "",
    "fechaRealizada": "",
    "charlistas": "",
    "alumnos": 0,
    "imagenGrupo": "",
    "imagenFormulario": "",
    "observaciones": ""
  },
  {
    "id": 50,
    "escuela": "50",
    "nombre": "MAESTRO ANTONIO CAMACHO",
    "direccion": "San Fernando y Paysandú",
    "localidad": "MALDONADO",
    "departamento": "Maldonado",
    "tipo": "Aprender",
    "telefono": "42227793",
    "lat": -34.906029,
    "lng": -54.94193,
    "estado": "rojo",
    "prioritaria": false,
    "fechaCoordinada": "",
    "fechaRealizada": "",
    "charlistas": "",
    "alumnos": 0,
    "imagenGrupo": "",
    "imagenFormulario": "",
    "observaciones": ""
  },
  {
    "id": 52,
    "escuela": "52",
    "nombre": "ELENA MARROCHE DE MUSSIO",
    "direccion": "Sanabria y Reconquista",
    "localidad": "PIRIÁPOLIS",
    "departamento": "Maldonado",
    "tipo": "Urbana Común",
    "telefono": "44322222",
    "lat": -34.863286,
    "lng": -55.271744,
    "estado": "rojo",
    "prioritaria": false,
    "fechaCoordinada": "",
    "fechaRealizada": "",
    "charlistas": "",
    "alumnos": 0,
    "imagenGrupo": "",
    "imagenFormulario": "",
    "observaciones": ""
  },
  {
    "id": 53,
    "escuela": "53",
    "nombre": "VILLA CHIAPPARA",
    "direccion": "Ejido y Valin",
    "localidad": "SAN CARLOS",
    "departamento": "Maldonado",
    "tipo": "Urbana Común",
    "telefono": "42669639",
    "lat": -34.787751,
    "lng": -54.908924,
    "estado": "rojo",
    "prioritaria": true,
    "fechaCoordinada": "",
    "fechaRealizada": "",
    "charlistas": "",
    "alumnos": 0,
    "imagenGrupo": "",
    "imagenFormulario": "",
    "observaciones": ""
  },
  {
    "id": 56,
    "escuela": "56",
    "nombre": "CLEMENTE ESTABLE",
    "direccion": "Melendez casi Sorata",
    "localidad": "VILLA DELI",
    "departamento": "Maldonado",
    "tipo": "Tiempo Completo",
    "telefono": "42222246",
    "lat": -34.89064,
    "lng": -54.978965,
    "estado": "rojo",
    "prioritaria": false,
    "fechaCoordinada": "",
    "fechaRealizada": "",
    "charlistas": "",
    "alumnos": 0,
    "imagenGrupo": "",
    "imagenFormulario": "",
    "observaciones": ""
  },
  {
    "id": 66,
    "escuela": "66",
    "nombre": "DIONISIO DIAZ",
    "direccion": "Ruta 39",
    "localidad": "CANTERAS DE MARELLI",
    "departamento": "Maldonado",
    "tipo": "Tiempo Completo",
    "telefono": "42232114",
    "lat": -34.84584,
    "lng": -54.942381,
    "estado": "rojo",
    "prioritaria": false,
    "fechaCoordinada": "",
    "fechaRealizada": "",
    "charlistas": "",
    "alumnos": 0,
    "imagenGrupo": "",
    "imagenFormulario": "",
    "observaciones": ""
  },
  {
    "id": 69,
    "escuela": "69",
    "nombre": null,
    "direccion": "R73 y R71",
    "localidad": "LAS FLORES",
    "departamento": "Maldonado",
    "tipo": "Tiempo Completo",
    "telefono": "44380704",
    "lat": -34.793106,
    "lng": -55.324777,
    "estado": "rojo",
    "prioritaria": false,
    "fechaCoordinada": "",
    "fechaRealizada": "",
    "charlistas": "",
    "alumnos": 0,
    "imagenGrupo": "",
    "imagenFormulario": "",
    "observaciones": ""
  },
  {
    "id": 79,
    "escuela": "79",
    "nombre": "ROSALÍA DE CASTRO",
    "direccion": "José de San Martín y Sucre",
    "localidad": "MALDONADO",
    "departamento": "Maldonado",
    "tipo": "Especiales",
    "telefono": "42222166",
    "lat": -34.914732,
    "lng": -54.951452,
    "estado": "rojo",
    "prioritaria": false,
    "fechaCoordinada": "",
    "fechaRealizada": "",
    "charlistas": "",
    "alumnos": 0,
    "imagenGrupo": "",
    "imagenFormulario": "",
    "observaciones": ""
  },
  {
    "id": 82,
    "escuela": "82",
    "nombre": "JUANA DE IBARBOUROU",
    "direccion": "Av Cachimba del Rey y Yerbal",
    "localidad": "MALDONADO",
    "departamento": "Maldonado",
    "tipo": "Práctica - HP",
    "telefono": "42225990",
    "lat": -34.91434,
    "lng": -54.950139,
    "estado": "rojo",
    "prioritaria": false,
    "fechaCoordinada": "",
    "fechaRealizada": "",
    "charlistas": "",
    "alumnos": 0,
    "imagenGrupo": "",
    "imagenFormulario": "",
    "observaciones": ""
  },
  {
    "id": 84,
    "escuela": "84",
    "nombre": " (escuela de sordos)",
    "direccion": "José de San Martín",
    "localidad": "MALDONADO",
    "departamento": "Maldonado",
    "tipo": "Especiales",
    "telefono": "42221423",
    "lat": -34.914688,
    "lng": -54.950614,
    "estado": "rojo",
    "prioritaria": false,
    "fechaCoordinada": "",
    "fechaRealizada": "",
    "charlistas": "",
    "alumnos": 0,
    "imagenGrupo": "",
    "imagenFormulario": "",
    "observaciones": ""
  },
  {
    "id": 93,
    "escuela": "93",
    "nombre": null,
    "direccion": "Av de los Gauchos y Paysandú",
    "localidad": "MALDONADO",
    "departamento": "Maldonado",
    "tipo": "Práctica - HP",
    "telefono": "42238528",
    "lat": -34.906103,
    "lng": -54.943629,
    "estado": "rojo",
    "prioritaria": false,
    "fechaCoordinada": "",
    "fechaRealizada": "",
    "charlistas": "",
    "alumnos": 0,
    "imagenGrupo": "",
    "imagenFormulario": "",
    "observaciones": ""
  },
  {
    "id": 95,
    "escuela": "95",
    "nombre": "ESPAÑA",
    "direccion": "Caracara y Meboipe",
    "localidad": "MALDONADO",
    "departamento": "Maldonado",
    "tipo": "Aprender",
    "telefono": "42237848 / 42238040",
    "lat": -34.897614,
    "lng": -54.938278,
    "estado": "rojo",
    "prioritaria": false,
    "fechaCoordinada": "",
    "fechaRealizada": "",
    "charlistas": "",
    "alumnos": 0,
    "imagenGrupo": "",
    "imagenFormulario": "",
    "observaciones": ""
  },
  {
    "id": 96,
    "escuela": "96",
    "nombre": "JUAN JOSE MUÑOZ",
    "direccion": "Cerro Punta Ballena ",
    "localidad": "MALDONADO",
    "departamento": "Maldonado",
    "tipo": "Aprender",
    "telefono": "42238556",
    "lat": -34.879486,
    "lng": -54.979419,
    "estado": "rojo",
    "prioritaria": false,
    "fechaCoordinada": "",
    "fechaRealizada": "",
    "charlistas": "",
    "alumnos": 0,
    "imagenGrupo": "",
    "imagenFormulario": "",
    "observaciones": ""
  },
  {
    "id": 97,
    "escuela": "97",
    "nombre": "TACUABÉ",
    "direccion": "Rincón y Varela",
    "localidad": "MALDONADO",
    "departamento": "Maldonado",
    "tipo": "Práctica - HP",
    "telefono": "42227704",
    "lat": -34.904031,
    "lng": -54.955673,
    "estado": "rojo",
    "prioritaria": false,
    "fechaCoordinada": "",
    "fechaRealizada": "",
    "charlistas": "",
    "alumnos": 0,
    "imagenGrupo": "",
    "imagenFormulario": "",
    "observaciones": ""
  },
  {
    "id": 98,
    "escuela": "98",
    "nombre": "ISLAS CANARIAS",
    "direccion": "Seijo y Campana",
    "localidad": "SAN CARLOS",
    "departamento": "Maldonado",
    "tipo": "Urbana Común",
    "telefono": "42668190",
    "lat": -34.79899,
    "lng": -54.924468,
    "estado": "rojo",
    "prioritaria": false,
    "fechaCoordinada": "",
    "fechaRealizada": "",
    "charlistas": "",
    "alumnos": 0,
    "imagenGrupo": "",
    "imagenFormulario": "",
    "observaciones": ""
  },
  {
    "id": 99,
    "escuela": "99",
    "nombre": "",
    "direccion": "De la Virgen y Tahilandia",
    "localidad": "MALDONADO",
    "departamento": "Maldonado",
    "tipo": "Urbana Común",
    "telefono": "42236809",
    "lat": -34.917063,
    "lng": -54.945946,
    "estado": "verde",
    "prioritaria": false,
    "fechaCoordinada": "",
    "fechaRealizada": "2026-04-23T13:30",
    "charlistas": "Maximo, Natalia, Vanessa",
    "alumnos": 28,
    "imagenGrupo": "",
    "imagenFormulario": "",
    "observaciones": ""
  },
  {
    "id": 104,
    "escuela": "104",
    "nombre": null,
    "direccion": "Rimini y Foggia",
    "localidad": "MALDONADO",
    "departamento": "Maldonado",
    "tipo": "Urbana Común",
    "telefono": "42249272",
    "lat": -34.897439,
    "lng": -54.967014,
    "estado": "rojo",
    "prioritaria": false,
    "fechaCoordinada": "",
    "fechaRealizada": "",
    "charlistas": "",
    "alumnos": 0,
    "imagenGrupo": "",
    "imagenFormulario": "",
    "observaciones": ""
  },
  {
    "id": 106,
    "escuela": "106",
    "nombre": null,
    "direccion": "17 de junio y central",
    "localidad": "MALDONADO",
    "departamento": "Maldonado",
    "tipo": "Tiempo Completo",
    "telefono": "42248734",
    "lat": -34.890357,
    "lng": -54.959377,
    "estado": "rojo",
    "prioritaria": false,
    "fechaCoordinada": "",
    "fechaRealizada": "",
    "charlistas": "",
    "alumnos": 0,
    "imagenGrupo": "",
    "imagenFormulario": "",
    "observaciones": ""
  },
  {
    "id": 107,
    "escuela": "107",
    "nombre": "ESCUELA",
    "direccion": "Sierra de las Cañas y Cerro del Penitente",
    "localidad": "CERRO PELA",
    "departamento": "Maldonado",
    "tipo": "Tiempo Completo",
    "telefono": "42230037",
    "lat": -34.883589,
    "lng": -54.971492,
    "estado": "rojo",
    "prioritaria": false,
    "fechaCoordinada": "",
    "fechaRealizada": "",
    "charlistas": "",
    "alumnos": 0,
    "imagenGrupo": "",
    "imagenFormulario": "",
    "observaciones": ""
  },
  {
    "id": 108,
    "escuela": "108",
    "nombre": null,
    "direccion": "Los Gladiolos y Costanera",
    "localidad": "LA CAPUERA",
    "departamento": "Maldonado",
    "tipo": "Aprender",
    "telefono": "42559422",
    "lat": -34.862079,
    "lng": -55.133235,
    "estado": "rojo",
    "prioritaria": false,
    "fechaCoordinada": "",
    "fechaRealizada": "",
    "charlistas": "",
    "alumnos": 0,
    "imagenGrupo": "",
    "imagenFormulario": "",
    "observaciones": ""
  },
  {
    "id": 113,
    "escuela": "113",
    "nombre": null,
    "direccion": "Jose Mautone",
    "localidad": "SAN CARLOS",
    "departamento": "Maldonado",
    "tipo": "Tiempo Completo",
    "telefono": "42669446",
    "lat": -34.781288,
    "lng": -54.915867,
    "estado": "rojo",
    "prioritaria": false,
    "fechaCoordinada": "",
    "fechaRealizada": "",
    "charlistas": "",
    "alumnos": 0,
    "imagenGrupo": "",
    "imagenFormulario": "",
    "observaciones": ""
  },
  {
    "id": 1777482998573,
    "escuela": "87",
    "nombre": "Turno tarde esc 87",
    "direccion": "Simon del Pino ",
    "localidad": "Maldonado",
    "departamento": "Maldonado",
    "tipo": "",
    "telefono": "42231347 ",
    "lat": -34.898319,
    "lng": -54.94473,
    "estado": "verde",
    "prioritaria": false,
    "fechaCoordinada": "",
    "fechaRealizada": "2026-04-17T13:30",
    "charlistas": "Agustín, Natalia, Vanessa",
    "alumnos": 36,
    "imagenGrupo": "",
    "imagenFormulario": "",
    "observaciones": "2 GRUPOS"
  },
  {
    "id": 1777483063053,
    "escuela": "91",
    "nombre": "Turno mañana esc 91",
    "direccion": "Simón del Pino ",
    "localidad": "Maldonado",
    "departamento": "Maldonado",
    "tipo": "",
    "telefono": "4223 1347",
    "lat": -34.89855,
    "lng": -54.945,
    "estado": "rojo",
    "prioritaria": false,
    "fechaCoordinada": "",
    "fechaRealizada": "",
    "charlistas": "",
    "alumnos": 0,
    "imagenGrupo": "",
    "imagenFormulario": "",
    "observaciones": ""
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
