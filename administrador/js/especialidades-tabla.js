import { validar_usuario, cargar_data_archivo, obtener_datos } from "../../assets/js/comunes.js";

let especialidades = [];
let modalEspecialidad, modalEliminar;
let modoEdicion = false;
let idAEliminar = null;

document.addEventListener("DOMContentLoaded", () => {
  modalEspecialidad = new bootstrap.Modal(document.getElementById("modalEspecialidad"));
  modalEliminar = new bootstrap.Modal(document.getElementById("modalEliminar"));

  document
    .getElementById("btn-agregar")
    .addEventListener("click", abrir_modal_agregar);
  document
    .getElementById("btnGuardar")
    .addEventListener("click", guardar_especialidad);
  document
    .getElementById("btnConfirmarEliminar")
    .addEventListener("click", confirmar_eliminar);

  validar_usuario();
  cargar_especialidades();
});

async function cargar_especialidades() {
  try {
    const datosLocalStorage = localStorage.getItem("especialidades");
    
    if (datosLocalStorage) {
      const data = JSON.parse(datosLocalStorage);
      especialidades = data.data || [];
    } else {
      const dataCargada = await cargar_data_archivo("data/especialidades.json", "especialidades");
      if (dataCargada) {
        especialidades = dataCargada.data || [];
      } else {
        const data = obtener_datos("especialidades");
        especialidades = data.data || [];
      }
    }

    mostrar_especialidades();
  } catch (error) {
    console.error("Error cargando especialidades:", error);
  }
}

function mostrar_especialidades() {
  const tbody = document.querySelector("#tabla_especialidades tbody");
  tbody.innerHTML = "";

  especialidades.forEach((especialidad) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${especialidad.id}</td>
      <td>${especialidad.nombre}</td>
      <td class="text-center">
        <button class="btn btn-sm btn-primary me-1" onclick="abrir_modal_editar(${
          especialidad.id
        })">Editar</button>
        <button class="btn btn-sm btn-outline-danger btn-eliminar" onclick="abrir_modal_eliminar(${
          especialidad.id
        })">Eliminar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function abrir_modal_agregar() {
  modoEdicion = false;
  document.getElementById("formEspecialidad").reset();
  document.getElementById("especialidadId").value = "";
  document.getElementById("modalEspecialidadLabel").textContent = "Agregar Especialidad";
  document.getElementById("alertaValidacion").classList.add("d-none");
  modalEspecialidad.show();
}

function abrir_modal_editar(id) {
  modoEdicion = true;
  const especialidad = especialidades.find((e) => e.id === id);
  if (!especialidad) return;

  document.getElementById("especialidadId").value = especialidad.id;
  document.getElementById("nombre").value = especialidad.nombre || "";

  document.getElementById("modalEspecialidadLabel").textContent = "Editar Especialidad";
  document.getElementById("alertaValidacion").classList.add("d-none");
  modalEspecialidad.show();
}

function guardar_especialidad() {
  const id = parseInt(document.getElementById("especialidadId").value);
  const nombre = document.getElementById("nombre").value.trim();

  const alerta = document.getElementById("alertaValidacion");
  const alertaTexto = document.getElementById("alertaTexto");

  alerta.classList.add("d-none");
  alertaTexto.innerHTML = "";

  let errores = [];

  if (!nombre) errores.push("El nombre es obligatorio.");

  if (errores.length > 0) {
    alertaTexto.innerHTML =
      "<strong>Revisa los campos:</strong><br>• " + errores.join("<br>• ");
    alerta.classList.remove("d-none");
    return;
  }

  let datosCompletos = obtener_datos("especialidades");
  
  if (!datosCompletos || !datosCompletos.proximo) {
    datosCompletos = {
      proximo: especialidades.length > 0 ? Math.max(...especialidades.map((e) => e.id)) + 1 : 0,
      data: especialidades
    };
  }

  if (modoEdicion) {
    const especialidad = especialidades.find((e) => e.id === id);
    if (especialidad) {
      especialidad.nombre = nombre;
    }
  } else {
    const proximoId = datosCompletos.proximo || (especialidades.length > 0 ? Math.max(...especialidades.map((e) => e.id)) + 1 : 0);

    especialidades.push({
      id: proximoId,
      nombre: nombre,
    });

    datosCompletos.proximo = proximoId + 1;
  }

  datosCompletos.data = especialidades;
  localStorage.setItem("especialidades", JSON.stringify(datosCompletos));

  mostrar_especialidades();
  mostrar_toast(
    modoEdicion
      ? "Especialidad actualizada correctamente"
      : "Especialidad agregada correctamente",
    "success"
  );
  modalEspecialidad.hide();
}

function abrir_modal_eliminar(id) {
  idAEliminar = id;
  modalEliminar.show();
}

function confirmar_eliminar() {
  especialidades = especialidades.filter((e) => e.id !== idAEliminar);
  
  let datosCompletos = obtener_datos("especialidades");
  
  if (!datosCompletos || !datosCompletos.proximo) {
    datosCompletos = {
      proximo: especialidades.length > 0 ? Math.max(...especialidades.map((e) => e.id)) + 1 : 0,
      data: especialidades
    };
  }
  
  datosCompletos.data = especialidades;
  localStorage.setItem("especialidades", JSON.stringify(datosCompletos));

  mostrar_especialidades();
  mostrar_toast("Especialidad eliminada correctamente", "danger");
  modalEliminar.hide();
}

function mostrar_toast(mensaje, tipo = "success") {
  const toastEl = document.getElementById("toastNotificacion");
  const toastBody = document.getElementById("toastMensaje");

  toastBody.textContent = mensaje;

  toastEl.className = `toast align-items-center text-bg-${tipo} border-0`;

  const toast = new bootstrap.Toast(toastEl, { delay: 3500 });
  toast.show();
}

window.abrir_modal_editar = abrir_modal_editar;
window.abrir_modal_eliminar = abrir_modal_eliminar;

