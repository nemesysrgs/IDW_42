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

  const imagenInput = document.getElementById("imagen");
  if (imagenInput) {
    imagenInput.addEventListener("change", handleImagenChange);
  }

  await validar_usuario();
  await cargar_datos_base();
  await cargar_medicos();
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

    renderizar_checkboxes();
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

function obtenerImagenMedico(medico) {
  const base64Defecto =
    "data:image/png;base64,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";

  if (medico.image && medico.image.data) {
    return decodificarImagenBase64(medico.image);
  }

  return base64Defecto;
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

    const imgSrc = obtenerImagenMedico(m);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${m.id}</td>
      <td>${m.matricula}</td>
      <td>
        <img 
          src="${imgSrc}" 
          alt="Foto de ${m.nombre}" 
          class="border" 
          width="60" 
          height="60"
        >
      </td>
      <td>${m.nombre}</td>
      <td>${m.apellido}</td>
      <td>${espNombres}</td>
      <td>${obrasNombres}</td>
      <td>$${m.valor_consulta.toLocaleString()}</td>
      <td class="text-start small">${m.descripcion || "-"}</td>
      <td>
        <button class="btn btn-sm btn-primary me-1" onclick="abrir_modal_editar(${
          m.id
        })">Editar</button>
        <button class="btn btn-sm btn-outline-danger" onclick="abrir_modal_eliminar(${
          m.id
        })">Eliminar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function abrir_modal_agregar() {
  modoEdicion = false;
  document.getElementById("formMedico").reset();
  document.getElementById("medicoId").value = "";
  document.getElementById("previewImagen").style.display = "none";
  document.getElementById("previewImagen").src = "";
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
  document.getElementById("valor_consulta").value = m.valor_consulta;
  
  document.getElementById("imagen").value = "";
  
  const preview = document.getElementById("previewImagen");
  if (m.image && m.image.data) {
    preview.src = decodificarImagenBase64(m.image);
    preview.style.display = "block";
  } else {
    preview.style.display = "none";
    preview.src = "";
  }

  document
    .querySelectorAll("#contenedor-especialidades input[type='checkbox']")
    .forEach((chk) => (chk.checked = false));
  document
    .querySelectorAll("#contenedor-obras input[type='checkbox']")
    .forEach((chk) => (chk.checked = false));

  (m.especialidad || []).forEach((idEsp) => {
    const chk = document.getElementById(`esp_${idEsp}`);
    if (chk) chk.checked = true;
  });

  (m.obras_sociales || []).forEach((idObs) => {
    const chk = document.getElementById(`obs_${idObs}`);
    if (chk) chk.checked = true;
  });

  actualizar_resumen_especialidades();
  actualizar_resumen_obras();

  document.getElementById("modalMedicoLabel").textContent = "Editar Médico";
  modalMedico.show();
}

async function guardar_medico() {
  const id = parseInt(document.getElementById("medicoId").value);
  const matriculaInput = document.getElementById("matricula");
  const apellidoInput = document.getElementById("apellido");
  const nombreInput = document.getElementById("nombre");
  const valorConsultaInput = document.getElementById("valor_consulta");
  const descripcionInput = document.getElementById("descripcion");
  const imagenInput = document.getElementById("imagen");

  const matricula = parseInt(matriculaInput.value);
  const apellido = apellidoInput.value.trim();
  const nombre = nombreInput.value.trim();
  const descripcion = descripcionInput.value.trim();
  const especialidad = Array.from(
    document.querySelectorAll("#contenedor-especialidades input:checked")
  ).map((chk) => parseInt(chk.value));

  const obras_sociales = Array.from(
    document.querySelectorAll("#contenedor-obras input:checked")
  ).map((chk) => parseInt(chk.value));

  const valor_consulta = parseFloat(valorConsultaInput.value);

  const campos = [
    matriculaInput,
    apellidoInput,
    nombreInput,
    valorConsultaInput,
  ];

  campos.forEach((el) => el.classList.remove("is-invalid"));

  const errores = [];

  if (!matricula) {
    errores.push("La matrícula es obligatoria.");
    matriculaInput.classList.add("is-invalid");
  }
  if (!apellido) {
    errores.push("El apellido es obligatorio.");
    apellidoInput.classList.add("is-invalid");
  }
  if (!nombre) {
    errores.push("El nombre es obligatorio.");
    nombreInput.classList.add("is-invalid");
  }
  if (isNaN(valor_consulta)) {
    errores.push("El valor de consulta es obligatorio.");
    valorConsultaInput.classList.add("is-invalid");
  }
  if (especialidad.length === 0)
    errores.push("Debe seleccionar al menos una especialidad.");
  if (obras_sociales.length === 0)
    errores.push("Debe seleccionar al menos una obra social.");

  if (errores.length > 0) {
    mostrar_alerta_formulario(errores, "warning");
    return;
  }

  let image = null;
  const file = imagenInput.files[0];

  if (file) {
    image = await convertirArchivoABase64(file);
  } else if (modoEdicion) {
    const medicoExistente = medicos.find((x) => x.id === id);
    if (medicoExistente?.image && medicoExistente.image.data) {
      image = medicoExistente.image;
    } else if (medicoExistente?.imagen && typeof medicoExistente.imagen === "string" && medicoExistente.imagen.startsWith("data:image")) {
      const partes = medicoExistente.imagen.split(",");
      const mimePart = partes[0].match(/data:([^;]+)/);
      if (mimePart && partes[1]) {
        image = {
          mime: mimePart[1],
          data: partes[1]
        };
      }
    }
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
      image,
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
      image,
      valor_consulta,
    });

    mostrar_toast("Médico agregado correctamente.", "success");
  }

  localStorage.setItem("medicos", JSON.stringify(medicos));
  mostrar_medicos();
  modalMedico.hide();
}

document.addEventListener("DOMContentLoaded", () => {
  const inputs = document.querySelectorAll(
    "#formMedico input, #formMedico textarea"
  );
  inputs.forEach((input) => {
    input.addEventListener("input", () => {
      input.classList.remove("is-invalid");
    });
  });
});

function limpiar_formulario_medico() {
  const form = document.getElementById("formMedico");
  if (form) form.reset();

  const preview = document.getElementById("previewImagen");
  if (preview) {
    preview.style.display = "none";
    preview.src = "";
  }

  const alerta = document.getElementById("alertaMedico");
  if (alerta) {
    alerta.classList.add("d-none");
    alerta.classList.remove(
      "show",
      "alert-warning",
      "alert-danger",
      "alert-success"
    );
  }

  const inputs = form.querySelectorAll(".is-invalid");
  inputs.forEach((input) => input.classList.remove("is-invalid"));
}

document.addEventListener("DOMContentLoaded", () => {
  const modalEl = document.getElementById("modalMedico");
  modalEl.addEventListener("hidden.bs.modal", () => {
    limpiar_formulario_medico();
  });
});

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
  const toastBody = document.getElementById("toastMensajeMedico");

  if (!toastEl || !toastBody) {
    console.warn("No se encontró el toast en el DOM");
    alert(mensaje);
    return;
  }

  toastEl.classList.remove("text-bg-success", "text-bg-danger");
  toastEl.classList.add(
    tipo === "danger" ? "text-bg-danger" : "text-bg-success"
  );

  toastBody.textContent = mensaje;

  const toast = new bootstrap.Toast(toastEl, { delay: 3500 });
  toast.show();
}

function renderizar_checkboxes() {
  const contEsp = document.getElementById("contenedor-especialidades");
  const contObs = document.getElementById("contenedor-obras");

  contEsp.innerHTML = especialidades
    .map(
      (e) => `
      <div class="form-check">
        <input class="form-check-input" type="checkbox" value="${e.id}" id="esp_${e.id}">
        <label class="form-check-label" for="esp_${e.id}">
          ${e.nombre}
        </label>
      </div>
    `
    )
    .join("");

  contObs.innerHTML = obrasSociales
    .map(
      (o) => `
      <div class="form-check">
        <input class="form-check-input" type="checkbox" value="${o.id}" id="obs_${o.id}">
        <label class="form-check-label" for="obs_${o.id}">
          ${o.nombre}
        </label>
      </div>
    `
    )
    .join("");

  document
    .querySelectorAll("#contenedor-especialidades input[type='checkbox']")
    .forEach((chk) =>
      chk.addEventListener("change", actualizar_resumen_especialidades)
    );

  document
    .querySelectorAll("#contenedor-obras input[type='checkbox']")
    .forEach((chk) => chk.addEventListener("change", actualizar_resumen_obras));

  actualizar_resumen_especialidades();
  actualizar_resumen_obras();
}

function actualizar_resumen_especialidades() {
  const seleccionadas = Array.from(
    document.querySelectorAll("#contenedor-especialidades input:checked")
  ).map((chk) => {
    const esp = especialidades.find((e) => e.id === parseInt(chk.value));
    return esp ? esp.nombre : "";
  });

  const resumen = document.getElementById("resumen-especialidades");
  resumen.textContent =
    seleccionadas.length > 0
      ? "Seleccionadas: " + seleccionadas.join(", ")
      : "Ninguna seleccionada";
}

function actualizar_resumen_obras() {
  const seleccionadas = Array.from(
    document.querySelectorAll("#contenedor-obras input:checked")
  ).map((chk) => {
    const obs = obrasSociales.find((o) => o.id === parseInt(chk.value));
    return obs ? obs.nombre : "";
  });

  const resumen = document.getElementById("resumen-obras");
  resumen.textContent =
    seleccionadas.length > 0
      ? "Seleccionadas: " + seleccionadas.join(", ")
      : "Ninguna seleccionada";
}

function mostrar_alerta_formulario(mensajes, tipo = "warning") {
  const alerta = document.getElementById("alertaMedico");
  const texto = document.getElementById("mensajeAlertaMedico");

  if (!alerta || !texto) return;

  alerta.classList.remove(
    "alert-success",
    "alert-danger",
    "alert-warning",
    "d-none",
    "show"
  );

  alerta.classList.add(`alert-${tipo}`, "show");

  if (Array.isArray(mensajes)) {
    texto.innerHTML =
      "<strong>Revisa los campos:</strong><br>• " + mensajes.join("<br>• ");
  } else {
    texto.textContent = mensajes;
  }

  alerta.classList.remove("d-none");
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

function decodificarImagenBase64(imageObj) {
  if (!imageObj || !imageObj.data) return "../assets/img/no-image.png";
  return `data:${imageObj.mime};base64,${imageObj.data}`;
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

    if (file.size > maxSize) {
      mostrar_toast("La imagen es demasiado grande. Máximo 5MB.", "danger");
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
