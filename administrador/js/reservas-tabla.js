import { validar_usuario, cargar_data_archivo, obtener_datos } from "../../assets/js/comunes.js";

let reservas = [];
let medicos = [];
let especialidades = [];
let obrasSociales = [];

document.addEventListener("DOMContentLoaded", async () => {
  validar_usuario();
  await cargar_datos_base();
  cargar_reservas();
});

async function cargar_datos_base() {
  try {
    await cargar_data_archivo("./data/turnos.json", "turnos");
    await cargar_data_archivo("./data/medicos.json", "medicos");
    await cargar_data_archivo("./data/especialidades.json", "especialidades");
    await cargar_data_archivo("./data/obras_sociales.json", "obras_sociales");
    await cargar_data_archivo("./data/reservas.json", "reservas");

    medicos = obtener_datos("medicos");
    //console.log("medicos", medicos)

    especialidades = obtener_datos("especialidades").data;
    //console.log("medicos", medicos)

    obrasSociales = obtener_datos("obras_sociales").data;
    //console.log("medicos", medicos)

    reservas = obtener_datos("reservas");
    //console.log("medicos", medicos)

  } catch (error) {
    console.error("Error cargando datos base:", error);
    mostrar_toast("Error al cargar los datos base.", "danger");
  }
}

async function cargar_reservas() {
  try {

    if ( reservas.length > 0) {
      mostrar_reservas();
      return;
    }

    reservas = [];
    mostrar_reservas();
  } catch (error) {
    console.error("Error cargando reservas:", error);
    mostrar_toast("Error al cargar las reservas.", "danger");
    reservas = [];
    mostrar_reservas();
  }
}

function formatear_fecha_hora(iso) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const fecha = d.toLocaleDateString("es-AR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    const hora = d.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit"
    });
    return `${fecha} ${hora}`;
  } catch (error) {
    return iso;
  }
}

function formatear_fecha(iso) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("es-AR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
  } catch (error) {
    return iso;
  }
}

function obtener_nombre_medico(idMedico) {
  if (!idMedico) return "-";
  const medico = medicos.find((m) => m.id == idMedico);
  console.log(medicos, idMedico);
  return medico ? `${medico.apellido}, ${medico.nombre}` : `ID: ${idMedico}`;
}

function obtener_nombre_especialidad(idEspecialidad) {
  if (!idEspecialidad) return "-";
  const especialidad = especialidades.find((e) => e.id === Number(idEspecialidad));
  return especialidad ? especialidad.nombre : `ID: ${idEspecialidad}`;
}

function obtener_nombre_obra_social(idObraSocial) {
  if (!idObraSocial) return "-";
  const obra = obrasSociales.find((o) => o.id === Number(idObraSocial));
  return obra ? obra.nombre : `ID: ${idObraSocial}`;
}

function mostrar_reservas() {
  const tbody = document.querySelector("#tabla_reservas tbody");
  tbody.innerHTML = "";

  if (reservas.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="12" class="text-center text-muted">No hay reservas registradas</td>
      </tr>
    `;
    return;
  }

  reservas.forEach((reserva) => {
    const tr = document.createElement("tr");
    
    const nombreMedico = obtener_nombre_medico(reserva.id_medico);
    const nombreEspecialidad = obtener_nombre_especialidad(reserva.especialidad_id);
    const nombreObraSocial = reserva.tipo_atencion === "obra_social" 
      ? obtener_nombre_obra_social(reserva.obra_social_id) 
      : "-";
    const tipoAtencion = reserva.tipo_atencion === "obra_social" ? "Obra Social" : "Particular";
    const fechaHora = formatear_fecha_hora(reserva.fecha);
    const fechaCreacion = formatear_fecha(reserva.creado_en);
    
    tr.innerHTML = `
      <td>${reserva.id }</td>
      <td>${reserva.nombre_apellido}</td>
      <td>${reserva.dni}</td>
      <td>${nombreMedico}</td>
      <td>${nombreEspecialidad}</td>
      <td>${nombreObraSocial}</td>
      <td>${tipoAtencion}</td>
      <td>${fechaHora}</td>
      <td>$${Number(reserva.costo || 0).toLocaleString("es-AR")}</td>
      <td>${reserva.descuento_porcentaje || 0}%</td>
      <td><strong>$${Number(reserva.total || 0).toLocaleString("es-AR")}</strong></td>
      <td>${fechaCreacion}</td>
    `;
    tbody.appendChild(tr);
  });
}

function mostrar_toast(mensaje, tipo = "success") {
  const toastEl = document.getElementById("toastNotificacion");
  const toastBody = document.getElementById("toastMensaje");

  toastBody.textContent = mensaje;
  toastEl.className = `toast align-items-center text-bg-${tipo} border-0`;
  const toast = new bootstrap.Toast(toastEl, { delay: 3500 });
  toast.show();
}

