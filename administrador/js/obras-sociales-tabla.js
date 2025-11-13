import { validar_usuario, cargar_data_archivo, obtener_datos, decodificarImagenBase64 } from "../../assets/js/comunes.js";

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

  const imagenInput = document.getElementById("imagen");
  if (imagenInput) {
    imagenInput.addEventListener("change", handleImagenChange);
  }

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
    let imagenHTML = "";
    if (obraSocial.image && obraSocial.image.data) {
      const imgSrc = decodificarImagenBase64(obraSocial.image);
      imagenHTML = `
        <img 
          src="${imgSrc}" 
          alt="Logo de ${obraSocial.nombre}" 
          class="border" 
          width="60" 
          height="60"
          style="object-fit: cover; border-radius: 4px;"
        >
      `;
    } else {
      imagenHTML = `
        <span class="text-danger small fw-bold">
          Sin imagen
        </span>
      `;
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${obraSocial.id}</td>
      <td>${imagenHTML}</td>
      <td>${obraSocial.nombre || "-"}</td>
      <td>${obraSocial.porcentaje !== undefined ? obraSocial.porcentaje + "%" : "-"}</td>
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
  document.getElementById("previewImagen").style.display = "none";
  document.getElementById("previewImagen").src = "";
  document.getElementById("imagen").required = true;
  document.getElementById("modalObraSocialLabel").textContent = "Agregar Obra Social";
  const alerta = document.getElementById("alertaValidacion");
  if (alerta) {
    alerta.classList.add("d-none");
  }
  modalObraSocial.show();
}

function abrir_modal_editar(id) {
  modoEdicion = true;
  const obraSocial = obrasSociales.find((o) => o.id === id);
  if (!obraSocial) return;

  document.getElementById("obraSocialId").value = obraSocial.id;
  document.getElementById("nombre").value = obraSocial.nombre || "";
  document.getElementById("porcentaje").value = obraSocial.porcentaje !== undefined ? obraSocial.porcentaje : "";
  document.getElementById("descripcion").value = obraSocial.descripcion || "";
  document.getElementById("imagen").value = "";
  document.getElementById("imagen").required = false;
  
  const preview = document.getElementById("previewImagen");
  if (obraSocial.image && obraSocial.image.data) {
    preview.src = decodificarImagenBase64(obraSocial.image);
    preview.style.display = "block";
  } else {
    preview.style.display = "none";
    preview.src = "";
  }

  document.getElementById("modalObraSocialLabel").textContent = "Editar Obra Social";
  const alerta = document.getElementById("alertaValidacion");
  if (alerta) {
    alerta.classList.add("d-none");
  }
  modalObraSocial.show();
}

async function guardar_obra_social() {
  const id = parseInt(document.getElementById("obraSocialId").value);
  const nombre = document.getElementById("nombre").value.trim();
  const porcentajeStr = document.getElementById("porcentaje").value.trim();
  const descripcion = document.getElementById("descripcion").value.trim();
  const imagenInput = document.getElementById("imagen");

  const alerta = document.getElementById("alertaValidacion");
  const alertaTexto = document.getElementById("alertaTexto");

  if (alerta) {
    alerta.classList.add("d-none");
  }
  if (alertaTexto) {
    alertaTexto.innerHTML = "";
  }

  let errores = [];
  if (!nombre) errores.push("El nombre es obligatorio.");
  
  if (!porcentajeStr) {
    errores.push("El porcentaje es obligatorio.");
  } else {
    const porcentaje = parseFloat(porcentajeStr);
    if (isNaN(porcentaje) || porcentaje < 0 || porcentaje > 100) {
      errores.push("El porcentaje debe ser un número entre 0 y 100.");
    }
  }

  const file = imagenInput.files[0];
  let image = null;

  if (modoEdicion) {
    if (file) {
      if (!file.type.startsWith("image/")) {
        errores.push("El archivo debe ser una imagen válida (JPG, PNG).");
      } else if (file.size > 1024 * 1024) {
        errores.push("La imagen es demasiado grande. Máximo 1MB.");
      } else {
        image = await convertirArchivoABase64(file);
      }
    } else {
      const obraSocialExistente = obrasSociales.find((o) => o.id === id);
      if (obraSocialExistente?.image && obraSocialExistente.image.data) {
        image = obraSocialExistente.image;
      } else {
        errores.push("La imagen es obligatoria.");
      }
    }
  } else {
    if (!file) {
      errores.push("La imagen es obligatoria.");
    } else {
      if (!file.type.startsWith("image/")) {
        errores.push("El archivo debe ser una imagen válida (JPG, PNG).");
      } else if (file.size > 1024 * 1024) {
        errores.push("La imagen es demasiado grande. Máximo 1MB.");
      } else {
        image = await convertirArchivoABase64(file);
      }
    }
  }
  
  if (errores.length > 0) {
    if (alertaTexto) {
      alertaTexto.innerHTML =
        "<strong>Revisa los campos:</strong><br>• " + errores.join("<br>• ");
    }
    if (alerta) {
      alerta.classList.remove("d-none");
    }
    return;
  }

  const porcentaje = parseFloat(porcentajeStr);
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
      obraSocial.porcentaje = porcentaje;
      obraSocial.descripcion = descripcion;
      obraSocial.image = image;
    }
  } else {
    const proximoId = datosCompletos.proximo || (obrasSociales.length > 0 ? Math.max(...obrasSociales.map((o) => o.id)) + 1 : 0);

    obrasSociales.push({
      id: proximoId,
      nombre: nombre,
      porcentaje: porcentaje,
      descripcion: descripcion,
      image: image,
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

async function convertirArchivoABase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(",")[1];
      const mime = file.type;
      resolve({ mime, data: base64 });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

function handleImagenChange(event) {
  const file = event.target.files[0];
  const preview = document.getElementById("previewImagen");
  
  if (!preview) return;

  if (file) {
    if (!file.type.startsWith("image/")) {
      mostrar_toast("Por favor, selecciona un archivo de imagen válido.", "danger");
      event.target.value = "";
      preview.style.display = "none";
      preview.src = "";
      return;
    }

    if (file.size > 1024 * 1024) {
      mostrar_toast("La imagen es demasiado grande. Máximo 1MB.", "danger");
      event.target.value = "";
      preview.style.display = "none";
      preview.src = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      preview.src = e.target.result;
      preview.style.display = "block";
    };
    reader.onerror = function() {
      mostrar_toast("Error al cargar la imagen.", "danger");
      preview.style.display = "none";
    };
    reader.readAsDataURL(file);
  } else {
    preview.style.display = "none";
    preview.src = "";
  }
}

window.abrir_modal_editar = abrir_modal_editar;
window.abrir_modal_eliminar = abrir_modal_eliminar;

