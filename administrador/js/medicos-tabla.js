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
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAQAAABKc7NnAAAAOklEQVR42u3PMQEAAAgDIN8/9K3hAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwB8GkgAB5oQq2wAAAABJRU5ErkJggg==";

  if (medico.image && medico.image.data) {
    return decodificarImagenBase64(medico.image);
  }

  if (medico.imagen) {
    if (
      medico.imagen.startsWith("http") ||
      medico.imagen.startsWith("data:image")
    )
      return medico.imagen;
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
          onerror="this.onerror=null; this.src='img/icons/usuario-desconocido.png'; this.classList.remove('border');"
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
  document.getElementById("imagen").value = m.imagen;
  document.getElementById("valor_consulta").value = m.valor_consulta;

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
  const imagenURL = imagenInput.value.trim();

  if (imagenURL && imagenURL.startsWith("http")) {
    image = await convertirURLaBase64(imagenURL);
  } else if (modoEdicion) {
    const medicoExistente = medicos.find((x) => x.id === id);
    image = medicoExistente?.image || medicoExistente?.imagen || null;
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
    console.warn("⚠️ No se encontró el toast en el DOM");
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

async function convertirURLaBase64(url) {
  try {
    const resp = await fetch(url);
    const blob = await resp.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(",")[1];
        resolve({ mime: blob.type, data: base64 });
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error al convertir URL a Base64:", error);
    return null;
  }
}

function mostrarPreviewImagen(valor) {
  const preview = document.getElementById("previewImagen");
  if (!preview) return;

  if (!valor) {
    preview.style.display = "none";
    preview.src = "";
    return;
  }

  if (valor.startsWith("http")) {
    preview.src = valor;
    preview.style.display = "block";
  } else if (valor.startsWith("data:image")) {
    preview.src = valor;
    preview.style.display = "block";
  } else {
    preview.style.display = "none";
  }
}

window.abrir_modal_editar = abrir_modal_editar;
window.abrir_modal_eliminar = abrir_modal_eliminar;
