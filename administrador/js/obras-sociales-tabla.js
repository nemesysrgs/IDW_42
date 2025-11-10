import { validar_usuario, cargar_data_archivo, obtener_datos } from "../../assets/js/comunes.js";

let obrasSociales = [];
let modalObraSocial, modalEliminar;
let modoEdicion = false;
let idAEliminar = null;

document.addEventListener("DOMContentLoaded", () => {
  modalObraSocial = new bootstrap.Modal(document.getElementById("modalObraSocial"));
  modalEliminar = new bootstrap.Modal(document.getElementById("modalEliminar"));

  document
    .getElementById("btn-agregar")
    .addEventListener("click", abrir_modal_agregar);
  document
    .getElementById("btnGuardar")
    .addEventListener("click", guardar_obra_social);
  document
    .getElementById("btnConfirmarEliminar")
    .addEventListener("click", confirmar_eliminar);

  validar_usuario();
  cargar_obras_sociales();
});

async function cargar_obras_sociales() {
  try {
    const datosLocalStorage = localStorage.getItem("obras_sociales");
    
    if (datosLocalStorage) {
      const data = JSON.parse(datosLocalStorage);
      obrasSociales = data.data || [];
    } else {

      const dataCargada = await cargar_data_archivo("data/obras_sociales.json", "obras_sociales");
      if (dataCargada) {
        obrasSociales = dataCargada.data || [];
      } else {
  
        const data = obtener_datos("obras_sociales");
        obrasSociales = data.data || [];
      }
    }

    mostrar_obras_sociales();
  } catch (error) {
    console.error("Error cargando obras sociales:", error);
  }
}

function truncar_descripcion(descripcion, maxLength = 20) {
  if (!descripcion) return "-";
  if (descripcion.length <= maxLength) return descripcion;
  return descripcion.substring(0, maxLength) + "...";
}

function mostrar_obras_sociales() {
  const tbody = document.querySelector("#tabla_obras_sociales tbody");
  tbody.innerHTML = "";

  obrasSociales.forEach((obraSocial) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${obraSocial.id}</td>
      <td>${obraSocial.nombre || "-"}</td>
      <td>${truncar_descripcion(obraSocial.descripcion)}</td>
      <td class="text-center">
        <button class="btn btn-sm btn-primary me-1" onclick="abrir_modal_editar(${
          obraSocial.id
        })">Editar</button>
        <button class="btn btn-sm btn-outline-danger btn-eliminar" onclick="abrir_modal_eliminar(${
          obraSocial.id
        })">Eliminar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function abrir_modal_agregar() {
  modoEdicion = false;
  document.getElementById("formObraSocial").reset();
  document.getElementById("obraSocialId").value = "";
  document.getElementById("modalObraSocialLabel").textContent = "Agregar Obra Social";
  document.getElementById("alertaValidacion").classList.add("d-none");
  modalObraSocial.show();
}

function abrir_modal_editar(id) {
  modoEdicion = true;
  const obraSocial = obrasSociales.find((o) => o.id === id);
  if (!obraSocial) return;

  document.getElementById("obraSocialId").value = obraSocial.id;
  document.getElementById("nombre").value = obraSocial.nombre || "";
  document.getElementById("descripcion").value = obraSocial.descripcion || "";

  document.getElementById("modalObraSocialLabel").textContent = "Editar Obra Social";
  document.getElementById("alertaValidacion").classList.add("d-none");
  modalObraSocial.show();
}

function guardar_obra_social() {
  const id = parseInt(document.getElementById("obraSocialId").value);
  const nombre = document.getElementById("nombre").value.trim();
  const descripcion = document.getElementById("descripcion").value.trim();

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
  let datosCompletos = obtener_datos("obras_sociales");

  if (!datosCompletos || !datosCompletos.proximo) {
    datosCompletos = {
      proximo: obrasSociales.length > 0 ? Math.max(...obrasSociales.map((o) => o.id)) + 1 : 0,
      data: obrasSociales
    };
  }

  if (modoEdicion) {
    const obraSocial = obrasSociales.find((o) => o.id === id);
    if (obraSocial) {
      obraSocial.nombre = nombre;
      obraSocial.descripcion = descripcion;
    }
  } else {
    const proximoId = datosCompletos.proximo || (obrasSociales.length > 0 ? Math.max(...obrasSociales.map((o) => o.id)) + 1 : 0);

    obrasSociales.push({
      id: proximoId,
      nombre: nombre,
      descripcion: descripcion,
    });

    datosCompletos.proximo = proximoId + 1;
  }
  datosCompletos.data = obrasSociales;
  localStorage.setItem("obras_sociales", JSON.stringify(datosCompletos));

  mostrar_obras_sociales();
  mostrar_toast(
    modoEdicion
      ? "Obra social actualizada correctamente"
      : "Obra social agregada correctamente",
    "success"
  );
  modalObraSocial.hide();
}

function abrir_modal_eliminar(id) {
  idAEliminar = id;
  modalEliminar.show();
}

function confirmar_eliminar() {
  obrasSociales = obrasSociales.filter((o) => o.id !== idAEliminar);

  let datosCompletos = obtener_datos("obras_sociales");

  if (!datosCompletos || !datosCompletos.proximo) {
    datosCompletos = {
      proximo: obrasSociales.length > 0 ? Math.max(...obrasSociales.map((o) => o.id)) + 1 : 0,
      data: obrasSociales
    };
  }
  
  datosCompletos.data = obrasSociales;
  localStorage.setItem("obras_sociales", JSON.stringify(datosCompletos));

  mostrar_obras_sociales();
  mostrar_toast("Obra social eliminada correctamente", "danger");
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

