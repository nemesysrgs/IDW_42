import {
  validar_usuario,
  cargar_data_archivo,
  obtener_datos,
} from "../../assets/js/comunes.js";

let medicos = [];
let especialidades = [];
let obrasSociales = [];
let modalMedico, modalEliminar;
let modoEdicion = false;
let idAEliminar = null;
let toast;

document.addEventListener("DOMContentLoaded", async () => {
  modalMedico = new bootstrap.Modal(document.getElementById("modalMedico"));
  modalEliminar = new bootstrap.Modal(document.getElementById("modalEliminar"));

  const toastEl = document.getElementById("toastMedico");
  toast = new bootstrap.Toast(toastEl);

  document
    .getElementById("btn-agregar")
    .addEventListener("click", abrir_modal_agregar);
  document
    .getElementById("btnGuardar")
    .addEventListener("click", guardar_medico);
  document
    .getElementById("btnConfirmarEliminar")
    .addEventListener("click", confirmar_eliminar);

  await validar_usuario();
  await cargar_datos_base(); // Cargar especialidades y obras sociales
  await cargar_medicos(); // Cargar médicos
});

async function cargar_datos_base() {
  try {
    const espData = await cargar_data_archivo(
      "data/especialidades.json",
      "especialidades"
    );
    const obrasData = await cargar_data_archivo(
      "data/obras_sociales.json",
      "obras_sociales"
    );

    especialidades =
      espData?.data || obtener_datos("especialidades").data || [];
    obrasSociales =
      obrasData?.data || obtener_datos("obras_sociales").data || [];
  } catch (error) {
    console.error("Error cargando datos base:", error);
    mostrar_toast("Error al cargar especialidades/obras sociales", "danger");
  }
}

async function cargar_medicos() {
  try {
    const guardados = localStorage.getItem("medicos");
    if (guardados) {
      const dataGuardada = JSON.parse(guardados);
      if (Array.isArray(dataGuardada) && dataGuardada.length > 0) {
        medicos = dataGuardada;
        mostrar_medicos();
        return;
      }
    }

    const resp = await fetch("data/medicos.json");
    const data = await resp.json();
    medicos = data.data || [];
    localStorage.setItem("medicos", JSON.stringify(medicos));

    mostrar_medicos();
  } catch (error) {
    console.error("Error cargando médicos:", error);
    mostrar_toast("Error al cargar los datos.", "danger");
  }
}

function mostrar_medicos() {
  const tbody = document.querySelector("#tabla_medicos tbody");
  tbody.innerHTML = "";

  medicos.forEach((m) => {
    const espNombres = (m.especialidad || [])
      .map((id) => {
        const e = especialidades.find((x) => x.id === id);
        return e ? e.nombre : `ID ${id}`;
      })
      .join(", ");

    const obrasNombres = (m.obras_sociales || [])
      .map((id) => {
        const o = obrasSociales.find((x) => x.id === id);
        return o ? o.nombre : `ID ${id}`;
      })
      .join(", ");

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${m.id}</td>
      <td>${m.matricula}</td>
      <td>
        <img 
          src="${
            m.imagen && m.imagen.startsWith("http")
              ? m.imagen
              : m.imagen || "../assets/img/no-image.png"
          }" 
          alt="Foto de ${m.nombre}" 
          class="rounded-circle border" 
          width="55" 
          height="55"
        >
      </td>
      <td>${m.nombre}</td>
      <td>${m.apellido}</td>
      <td>${espNombres}</td>
      <td>${obrasNombres}</td>
      <td>$${m.valor_consulta.toLocaleString()}</td>
      <td class="text-start small">${m.descripcion || "-"}</td>
      <td>
        <button 
          class="btn btn-sm btn-primary me-1" 
          onclick="abrir_modal_editar(${m.id})"
        >Editar</button>
        <button 
          class="btn btn-sm btn-outline-danger" 
          onclick="abrir_modal_eliminar(${m.id})"
        >Eliminar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function abrir_modal_agregar() {
  modoEdicion = false;
  document.getElementById("formMedico").reset();
  document.getElementById("medicoId").value = "";
  document.getElementById("modalMedicoLabel").textContent = "Agregar Médico";
  modalMedico.show();
}

function abrir_modal_editar(id) {
  modoEdicion = true;
  const m = medicos.find((x) => x.id === id);
  if (!m) return;

  document.getElementById("medicoId").value = m.id;
  document.getElementById("matricula").value = m.matricula;
  document.getElementById("apellido").value = m.apellido;
  document.getElementById("nombre").value = m.nombre;
  document.getElementById("descripcion").value = m.descripcion;
  document.getElementById("especialidad").value = Array.isArray(m.especialidad)
    ? m.especialidad.join(", ")
    : m.especialidad;
  document.getElementById("obras_sociales").value = Array.isArray(
    m.obras_sociales
  )
    ? m.obras_sociales.join(", ")
    : m.obras_sociales;
  document.getElementById("imagen").value = m.imagen;
  document.getElementById("valor_consulta").value = m.valor_consulta;

  document.getElementById("modalMedicoLabel").textContent = "Editar Médico";
  modalMedico.show();
}

function guardar_medico() {
  const id = parseInt(document.getElementById("medicoId").value);
  const matricula = parseInt(document.getElementById("matricula").value);
  const apellido = document.getElementById("apellido").value.trim();
  const nombre = document.getElementById("nombre").value.trim();
  const descripcion = document.getElementById("descripcion").value.trim();
  const especialidad = document
    .getElementById("especialidad")
    .value.split(",")
    .map((n) => parseInt(n.trim()))
    .filter((n) => !isNaN(n));
  const obras_sociales = document
    .getElementById("obras_sociales")
    .value.split(",")
    .map((n) => parseInt(n.trim()))
    .filter((n) => !isNaN(n));
  const imagen = document.getElementById("imagen").value.trim();
  const valor_consulta = parseFloat(
    document.getElementById("valor_consulta").value
  );

  if (!matricula || !apellido || !nombre || isNaN(valor_consulta)) {
    mostrar_toast("Por favor completá los campos obligatorios.", "danger");
    return;
  }

  if (modoEdicion) {
    const m = medicos.find((x) => x.id === id);
    Object.assign(m, {
      matricula,
      apellido,
      nombre,
      especialidad,
      descripcion,
      obras_sociales,
      imagen,
      valor_consulta,
    });
    mostrar_toast("Médico actualizado correctamente.", "success");
  } else {
    const nuevo_id = medicos.length
      ? Math.max(...medicos.map((m) => m.id)) + 1
      : 1;
    medicos.push({
      id: nuevo_id,
      matricula,
      apellido,
      nombre,
      especialidad,
      descripcion,
      obras_sociales,
      imagen,
      valor_consulta,
    });
    mostrar_toast("Médico agregado correctamente.", "success");
  }

  localStorage.setItem("medicos", JSON.stringify(medicos));
  mostrar_medicos();
  modalMedico.hide();
}

function abrir_modal_eliminar(id) {
  idAEliminar = id;
  modalEliminar.show();
}

function confirmar_eliminar() {
  medicos = medicos.filter((m) => m.id !== idAEliminar);
  localStorage.setItem("medicos", JSON.stringify(medicos));
  mostrar_medicos();
  modalEliminar.hide();
  mostrar_toast("Médico eliminado correctamente.", "danger");
}

function mostrar_toast(mensaje, tipo = "success") {
  const toastEl = document.getElementById("toastMedico");
  toastEl.classList.remove("text-bg-success", "text-bg-danger");
  toastEl.classList.add(
    tipo === "danger" ? "text-bg-danger" : "text-bg-success"
  );
  document.getElementById("toastMensajeMedico").textContent = mensaje;
  toast.show();
}

window.abrir_modal_editar = abrir_modal_editar;
window.abrir_modal_eliminar = abrir_modal_eliminar;
