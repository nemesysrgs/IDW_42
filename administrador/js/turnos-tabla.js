import { validar_usuario } from "../../assets/js/comunes.js";

let turnos = [];
let medicos = [];
let modalTurno, modalEliminar;
let modoEdicion = false;
let idAEliminar = null;

document.addEventListener("DOMContentLoaded", () => {
  modalTurno = new bootstrap.Modal(document.getElementById("modalTurno"));
  modalEliminar = new bootstrap.Modal(document.getElementById("modalEliminar"));

  document
    .getElementById("btn-agregar")
    .addEventListener("click", abrir_modal_agregar);
  document
    .getElementById("btnGuardar")
    .addEventListener("click", guardar_turno);
  document
    .getElementById("btnConfirmarEliminar")
    .addEventListener("click", confirmar_eliminar);

  document
    .getElementById("fechaHora")
    .addEventListener("change", validar_horario_tiempo_real);

  validar_usuario();
  cargar_medicos();
  cargar_turnos();
});

async function cargar_medicos() {
  try {
    const guardados = localStorage.getItem("medicos");
    if (guardados) {
      const dataGuardada = JSON.parse(guardados);
      if (Array.isArray(dataGuardada) && dataGuardada.length > 0) {
        medicos = dataGuardada;
        return;
      }
    }

    const resp = await fetch("data/medicos.json");
    const data = await resp.json();
    medicos = data.data || [];
    localStorage.setItem("medicos", JSON.stringify(medicos));
  } catch (error) {
    console.error("Error cargando médicos:", error);
  }
}

function cargar_turnos() {
  try {
    const guardados = localStorage.getItem("turnos");
    if (guardados) {
      const dataGuardada = JSON.parse(guardados);
      if (dataGuardada && dataGuardada.data && Array.isArray(dataGuardada.data)) {
        turnos = dataGuardada.data;
        mostrar_turnos();
        return;
      }
    }

    const estructuraInicial = {
      proximo: 1,
      data: []
    };
    localStorage.setItem("turnos", JSON.stringify(estructuraInicial));
    turnos = [];
    mostrar_turnos();
  } catch (error) {
    console.error("Error cargando turnos:", error);
    mostrar_toast("Error al cargar los turnos.", "danger");
  }
}

function guardar_turnos() {
  try {
    const guardados = localStorage.getItem("turnos");
    let estructura = {
      proximo: 1,
      data: []
    };

    if (guardados) {
      const dataGuardada = JSON.parse(guardados);
      if (dataGuardada && dataGuardada.proximo !== undefined) {
        estructura.proximo = dataGuardada.proximo;
      }
    }

    estructura.data = turnos;
    
    if (turnos.length > 0) {
      const maxId = Math.max(...turnos.map(t => t.id));
      estructura.proximo = maxId + 1;
    }

    localStorage.setItem("turnos", JSON.stringify(estructura));
  } catch (error) {
    console.error("Error guardando turnos:", error);
    mostrar_toast("Error al guardar los turnos.", "danger");
  }
}

function mostrar_turnos() {
  const tbody = document.querySelector("#tabla_turnos tbody");
  tbody.innerHTML = "";

  if (turnos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-muted">No hay turnos registrados</td>
      </tr>
    `;
    return;
  }

  turnos.forEach((turno) => {
    const medico = medicos.find((m) => m.id === Number(turno.id_medico));
    const nombreMedico = medico 
      ? `${medico.nombre} ${medico.apellido}` 
      : "Médico no encontrado";

    const fechaHora = new Date(turno.fecha);
    const fechaFormateada = fechaHora.toLocaleDateString("es-AR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    const horaFormateada = fechaHora.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit"
    });

    const disponible = turno.disponible ? "Sí" : "No";
    const badgeClass = turno.disponible ? "badge bg-success" : "badge bg-danger";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${turno.id}</td>
      <td>${nombreMedico}</td>
      <td>${fechaFormateada} ${horaFormateada}</td>
      <td><span class="${badgeClass}">${disponible}</span></td>
      <td class="text-center">
        ${ (new Date(turno.fecha) >= new Date()) ? `<button class="btn btn-sm btn-primary me-1" onclick="abrir_modal_editar(${
          turno.id
        })">Editar</button>
        <button class="btn btn-sm btn-outline-danger btn-eliminar" onclick="abrir_modal_eliminar(${
          turno.id
        })">Eliminar</button>` : ''}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function cargar_select_medicos() {
  const selectMedico = document.getElementById("medico");
  selectMedico.innerHTML = '<option value="">Seleccione un médico</option>';

  medicos.forEach((medico) => {
    const option = document.createElement("option");
    option.value = medico.id;
    option.textContent = `${medico.nombre} ${medico.apellido}`;
    selectMedico.appendChild(option);
  });
}

function validar_horario_permitido(fechaHora) {
  if (!fechaHora) return false;

  const fecha = new Date(fechaHora);
  const hora = fecha.getHours();
  const minutos = fecha.getMinutes();
  const horaDecimal = hora + minutos / 60;
  const enRangoManana = horaDecimal >= 8.0 && horaDecimal <= 12.5;
  const enRangoTarde = horaDecimal >= 16.0 && horaDecimal <= 20.0;

  return enRangoManana || enRangoTarde;
}

function validar_horario_tiempo_real() {
  const fechaHoraInput = document.getElementById("fechaHora");
  const fechaHora = fechaHoraInput.value;
  const alerta = document.getElementById("alertaValidacion");
  const alertaTexto = document.getElementById("alertaTexto");

  if (!fechaHora) {
    alerta.classList.add("d-none");
    return;
  }

  if (!validar_horario_permitido(fechaHora)) {
    alertaTexto.innerHTML =
      "<strong>Horario no permitido:</strong><br>• Los horarios permitidos son de 8:00 a 12:30 y de 16:00 a 20:00.";
    alerta.classList.remove("d-none");
    fechaHoraInput.classList.add("is-invalid");
  } else {
    alerta.classList.add("d-none");
    fechaHoraInput.classList.remove("is-invalid");
  }
}

function abrir_modal_agregar() {
  modoEdicion = false;
  document.getElementById("formTurno").reset();
  document.getElementById("turnoId").value = "";
  document.getElementById("modalTurnoLabel").textContent = "Agregar Turno";
  document.getElementById("alertaValidacion").classList.add("d-none");
  document.getElementById("fechaHora").classList.remove("is-invalid");
  
  cargar_select_medicos();
  modalTurno.show();
}

function abrir_modal_editar(id) {
  modoEdicion = true;
  const turno = turnos.find((t) => t.id === id);
  if (!turno) return;

  cargar_select_medicos();

  document.getElementById("turnoId").value = turno.id;
  document.getElementById("medico").value = turno.id_medico;

  const fechaHora = new Date(turno.fecha);
  const fechaLocal = new Date(fechaHora.getTime() - fechaHora.getTimezoneOffset() * 60000);
  document.getElementById("fechaHora").value = fechaLocal.toISOString().slice(0, 16);
  
  document.getElementById("disponible").checked = turno.disponible || false;

  document.getElementById("modalTurnoLabel").textContent = "Editar Turno";
  document.getElementById("alertaValidacion").classList.add("d-none");
  document.getElementById("fechaHora").classList.remove("is-invalid");

  validar_horario_tiempo_real();
  
  modalTurno.show();
}

function guardar_turno() {
  const id = parseInt(document.getElementById("turnoId").value);
  const medicoId = parseInt(document.getElementById("medico").value);
  const fechaHora = document.getElementById("fechaHora").value;
  const disponible = document.getElementById("disponible").checked;

  const alerta = document.getElementById("alertaValidacion");
  const alertaTexto = document.getElementById("alertaTexto");

  alerta.classList.add("d-none");
  alertaTexto.innerHTML = "";

  let errores = [];
  if (!medicoId || isNaN(medicoId)) {
    errores.push("Debe seleccionar un médico.");
  }
  if (!fechaHora) {
    errores.push("La fecha y hora son obligatorias.");
  }
  if (fechaHora) {
    const fechaSeleccionada = new Date(fechaHora);
    const ahora = new Date();
    if (fechaSeleccionada < ahora) {
      errores.push("La fecha y hora no pueden ser en el pasado.");
    }

    if (!validar_horario_permitido(fechaHora)) {
      errores.push("Los horarios permitidos son de 8:00 a 12:30 y de 16:00 a 20:00.");
    }
  }
  if (errores.length > 0) {
    alertaTexto.innerHTML =
      "<strong>Revisa los campos:</strong><br>• " + errores.join("<br>• ");
    alerta.classList.remove("d-none");
    return;
  }

  if (modoEdicion) {
    const turno = turnos.find((t) => t.id === id);
    if (turno) {
      Object.assign(turno, {
        id_medico: medicoId,
        fecha_hora: fechaHora,
        disponible: disponible,
      });
    }
  } else {
    const guardados = localStorage.getItem("turnos");
    let proximoId = 1;
    if (guardados) {
      const dataGuardada = JSON.parse(guardados);
      if (dataGuardada && dataGuardada.proximo) {
        proximoId = dataGuardada.proximo;
      } else if (turnos.length > 0) {
        proximoId = Math.max(...turnos.map((t) => t.id)) + 1;
      }
    } else if (turnos.length > 0) {
      proximoId = Math.max(...turnos.map((t) => t.id)) + 1;
    }

    turnos.push({
      id: proximoId,
      id_medico: medicoId,
      fecha_hora: fechaHora,
      disponible: disponible,
    });
  }

  guardar_turnos();
  mostrar_turnos();
  mostrar_toast(
    modoEdicion
      ? "Turno actualizado correctamente"
      : "Turno agregado correctamente",
    "success"
  );
  modalTurno.hide();
}

function abrir_modal_eliminar(id) {
  idAEliminar = id;
  modalEliminar.show();
}

function confirmar_eliminar() {
  turnos = turnos.filter((t) => t.id !== idAEliminar);
  guardar_turnos();
  mostrar_turnos();
  mostrar_toast("Turno eliminado correctamente", "danger");
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

