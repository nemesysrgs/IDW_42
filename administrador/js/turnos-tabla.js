import { cargar_data_archivo, obtener_datos, validar_usuario } from "../../assets/js/comunes.js";

let turnos = [];
let medicos = [];
let modalTurno, modalEliminar;
let modoEdicion = false;
let idAEliminar = null;

let turnosAnteriores = false;
let medicoSeleccionado = "todos";
let selectMedico = null
let selectMedicoModal = null
let checkboxAnteriores = null
let selectHora = null
let fechaInput = null

document.addEventListener("DOMContentLoaded", async() => {
  modalTurno = new bootstrap.Modal(document.getElementById("modalTurno"));
  modalEliminar = new bootstrap.Modal(document.getElementById("modalEliminar"));
  selectMedicoModal = document.getElementById("medico");
  selectMedico = document.getElementById("select-medico");
  checkboxAnteriores = document.getElementById("checkbox-anteriores")
  selectHora = document.getElementById("hora");
  fechaInput = document.getElementById("fecha");
  checkboxAnteriores.addEventListener("change", toggle_turnos_anteriores);
  selectMedico.addEventListener("change", filtrar_medicos);


  document
    .getElementById("btn-agregar")
    .addEventListener("click", abrir_modal_agregar);
  document
    .getElementById("btnGuardar")
    .addEventListener("click", guardar_turno);
  document
    .getElementById("btnConfirmarEliminar")
    .addEventListener("click", confirmar_eliminar);

  if (fechaInput) {
    fechaInput.addEventListener("change", validar_fecha_hora_tiempo_real);
  }

  if (selectHora) {
    cargar_select_horas(selectHora);
    selectHora.addEventListener("change", validar_fecha_hora_tiempo_real);
  }

  validar_usuario();

  const medicosData = await cargar_data_archivo("data/medicos.json", "medicos");
  const dataGuardada = await cargar_data_archivo("data/turnos.json", "turnos");

  medicos = obtener_datos("medicos").data || medicosData.data || [];
  turnos = obtener_datos("turnos").data || dataGuardada.data;
  cargar_turnos();
  cargar_select_medicos( selectMedico, false )
});


function cargar_turnos() {
  try {
      mostrar_turnos();
  } catch (error) {
    console.error("Error cargando turnos:", error);
    mostrar_toast("Error al cargar los turnos.", "danger");
  }
}

// seccion de filtros
function cargar_select_medicos( selector, modal = true ){
  if ( modal ) selector.innerHTML = '<option value="">Seleccione un médico</option>';
  else selector.innerHTML = '<option value="todos">Mostrar todos</option>';
  medicos.forEach(medico => {
    const option = document.createElement("option")
    const nombreMedico = `${medico.apellido}, ${medico.nombre}`
    option.value = medico.id
    option.innerHTML = nombreMedico
    selector.appendChild(option)
  });

}

function cargar_select_horas(selector) {
  if (!selector) return;
  selector.innerHTML = '<option value="">Seleccione un horario</option>';

  const crearOpciones = (inicioHora, inicioMinutos, finHora, finMinutos) => {
    const opciones = [];
    let hora = inicioHora;
    let minutos = inicioMinutos;

    while (hora < finHora || (hora === finHora && minutos <= finMinutos)) {
      const horaStr = String(hora).padStart(2, "0");
      const minutosStr = String(minutos).padStart(2, "0");
      opciones.push(`${horaStr}:${minutosStr}`);

      minutos += 30;
      if (minutos >= 60) {
        minutos = 0;
        hora++;
      }
    }
    return opciones;
  };

  const horariosManana = crearOpciones(8, 0, 12, 30);
  const horariosTarde = crearOpciones(14, 0, 20, 0);
  [...horariosManana, ...horariosTarde].forEach((hora) => {
    const option = document.createElement("option");
    option.value = hora;
    option.textContent = hora;
    selector.appendChild(option);
  });
}

function obtener_reservas_local() {
  const reservasRaw = obtener_datos("reservas");
  if (Array.isArray(reservasRaw)) {
    return { lista: reservasRaw, contenedor: null };
  }
  if (reservasRaw && typeof reservasRaw === "object" && Array.isArray(reservasRaw.data)) {
    return { lista: reservasRaw.data, contenedor: reservasRaw };
  }
  return { lista: [], contenedor: reservasRaw };
}

function guardar_reservas_local(contenedor, lista) {
  if (contenedor && typeof contenedor === "object" && Array.isArray(contenedor.data)) {
    contenedor.data = lista;
    localStorage.setItem("reservas", JSON.stringify(contenedor));
  } else {
    localStorage.setItem("reservas", JSON.stringify(lista));
  }
}

function eliminar_reservas_de_turno(turnoId) {
  if (turnoId === undefined || turnoId === null) return;
  const { lista, contenedor } = obtener_reservas_local();
  if (!Array.isArray(lista) || lista.length === 0) return;
  const turnoIdNumber = Number(turnoId);
  const reservasFiltradas = lista.filter(
    (reserva) => Number(reserva?.id_turno) !== turnoIdNumber
  );
  if (reservasFiltradas.length === lista.length) return;
  guardar_reservas_local(contenedor, reservasFiltradas);
}

function toggle_turnos_anteriores() {
  if (checkboxAnteriores.checked) {
    turnosAnteriores = true;
  } else {
    turnosAnteriores = false;
  }
  mostrar_turnos();
}

function filtrar_medicos(){
  medicoSeleccionado = selectMedico.value
  mostrar_turnos();
}

//carga de turnos en la tabla
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


  let turnosFiltrados = turnos.filter((turno) => {
    const fechaTurno = turno.fecha || turno.fecha_hora;
    if (!fechaTurno) return false;

    const fecha = new Date(fechaTurno);
    const ahora = new Date();

    return turnosAnteriores ? fecha < ahora : fecha >= ahora;
  });

  if ( medicoSeleccionado != "todos" ){
    turnosFiltrados = turnosFiltrados.filter((turno) => Number(turno.id_medico) === Number(medicoSeleccionado));
  }


  turnosFiltrados.sort((a, b) => {
    const fechaA = new Date(a.fecha || a.fecha_hora);
    const fechaB = new Date(b.fecha || b.fecha_hora);
    return fechaA - fechaB;
  });
  turnosFiltrados.forEach((turno) => {
    const medico = medicos.find((m) => m.id === Number(turno.id_medico));
    const nombreMedico = medico 
      ? `${medico.apellido}, ${medico.nombre}` 
      : "Médico no encontrado";

    const fechaTurno = turno.fecha || turno.fecha_hora;
    if (!fechaTurno) return;
    const fechaHora = new Date(fechaTurno);
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
        ${ (new Date(fechaTurno) >= new Date()) ? `<button class="btn btn-sm btn-primary me-1" onclick="abrir_modal_editar(${
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

function validar_horario_permitido(horaSeleccionada) {
  if (!horaSeleccionada) return false;

  const [hora, minutos] = horaSeleccionada.split(":").map(Number);
  const horaDecimal = hora + minutos / 60;
  const enRangoManana = horaDecimal >= 8.0 && horaDecimal <= 12.5;
  const enRangoTarde = horaDecimal >= 14.0 && horaDecimal <= 20.0;

  return enRangoManana || enRangoTarde;
}

function validar_fecha_hora_tiempo_real() {
  if (!fechaInput || !selectHora) return;

  const fecha = fechaInput.value;
  const hora = selectHora.value;
  const alerta = document.getElementById("alertaValidacion");
  const alertaTexto = document.getElementById("alertaTexto");

  if (!fecha || !hora) {
    alerta.classList.add("d-none");
    fechaInput.classList.remove("is-invalid");
    selectHora.classList.remove("is-invalid");
    return;
  }

  const fechaSeleccionada = new Date(`${fecha}T${hora}`);
  const ahora = new Date();

  if (!validar_horario_permitido(hora)) {
    alertaTexto.innerHTML =
      "<strong>Horario no permitido:</strong><br>• Los horarios permitidos son de 8:00 a 12:30 y de 14:00 a 20:00.";
    alerta.classList.remove("d-none");
    selectHora.classList.add("is-invalid");
    return;
  }

  if (fechaSeleccionada < ahora) {
    alertaTexto.innerHTML =
      "<strong>Horario no permitido:</strong><br>• La fecha y hora no pueden ser en el pasado.";
    alerta.classList.remove("d-none");
    fechaInput.classList.add("is-invalid");
    selectHora.classList.add("is-invalid");
    return;
  }

  alerta.classList.add("d-none");
  fechaInput.classList.remove("is-invalid");
  selectHora.classList.remove("is-invalid");
}

function abrir_modal_agregar() {
  modoEdicion = false;
  document.getElementById("formTurno").reset();
  document.getElementById("turnoId").value = "";
  document.getElementById("modalTurnoLabel").textContent = "Agregar Turno";
  document.getElementById("alertaValidacion").classList.add("d-none");
  if (fechaInput) fechaInput.classList.remove("is-invalid");
  if (selectHora) selectHora.classList.remove("is-invalid");
  
  cargar_select_medicos( selectMedicoModal );
  cargar_select_horas(selectHora);
  modalTurno.show();
}

function abrir_modal_editar(id) {
  modoEdicion = true;
  const turno = turnos.find((t) => t.id === id);
  if (!turno) return;

  cargar_select_medicos( selectMedicoModal );
  cargar_select_horas(selectHora);
  document.getElementById("turnoId").value = turno.id;
  document.getElementById("medico").value = turno.id_medico;
  const fechaTurno = turno.fecha || turno.fecha_hora;
  if (fechaTurno) {
    const fechaHora = new Date(fechaTurno);
    const fechaLocal = new Date(fechaHora.getTime() - fechaHora.getTimezoneOffset() * 60000);
    if (fechaInput) fechaInput.value = fechaLocal.toISOString().slice(0, 10);
    if (selectHora) selectHora.value = fechaLocal.toISOString().slice(11, 16);
  } else {
    if (fechaInput) fechaInput.value = "";
    if (selectHora) selectHora.value = "";
  }
  document.getElementById("disponible").checked = turno.disponible || false;
  document.getElementById("modalTurnoLabel").textContent = "Editar Turno";
  const alerta = document.getElementById("alertaValidacion");
  if (alerta) alerta.classList.add("d-none");
  if (fechaInput) fechaInput.classList.remove("is-invalid");
  if (selectHora) selectHora.classList.remove("is-invalid");

  validar_fecha_hora_tiempo_real();
  
  modalTurno.show();
}

function guardar_turno() {
  const _turnos = obtener_datos("turnos");
  const id = parseInt(document.getElementById("turnoId").value);
  const medicoId = parseInt(document.getElementById("medico").value);
  const fecha = fechaInput ? fechaInput.value : "";
  const horaSeleccionada = selectHora ? selectHora.value : "";
  const disponible = document.getElementById("disponible").checked;

  const alerta = document.getElementById("alertaValidacion");
  const alertaTexto = document.getElementById("alertaTexto");
  alerta.classList.add("d-none");
  alertaTexto.innerHTML = "";

  let errores = [];

  if (!medicoId || isNaN(medicoId)) {
    errores.push("Debe seleccionar un médico.");
  }
  if (!fecha) {
    errores.push("La fecha es obligatoria.");
  }
  if (!horaSeleccionada) {
    errores.push("La hora es obligatoria.");
  }

  let fechaCompleta = null;
  if (fecha && horaSeleccionada) {
    fechaCompleta = new Date(`${fecha}T${horaSeleccionada}`);
    const ahora = new Date();

    if (isNaN(fechaCompleta.getTime())) {
      errores.push("La fecha y hora seleccionadas no son válidas.");
    }

    if (fechaCompleta < ahora) {
      errores.push("La fecha y hora no pueden ser en el pasado.");
    }

    if (!validar_horario_permitido(horaSeleccionada)) {
      errores.push("Los horarios permitidos son de 8:00 a 12:30 y de 14:00 a 20:00.");
    }
    
    const conflicto = turnos.some((turno) => {
      if (turno.id === id) return false; 
      if (Number(turno.id_medico) !== Number(medicoId)) return false;

      const fechaExistente = turno.fecha || turno.fecha_hora;
      if (!fechaExistente) return false;

      const fechaTurno = new Date(fechaExistente);
      return fechaTurno.getTime() === fechaCompleta.getTime();
    });

    if (conflicto) {
      errores.push("El médico ya tiene un turno en el mismo horario seleccionado.");
    }
  }

  
  if (errores.length > 0) {
    alertaTexto.innerHTML =
      "<strong>Revisa los campos:</strong><br>• " + errores.join("<br>• ");
    alerta.classList.remove("d-none");
    return;
  }

  const fechaISO = fechaCompleta.toISOString();

  if (modoEdicion) {
    const turno = turnos.find((t) => t.id === id);
    if (turno) {
      Object.assign(turno, {
        id_medico: medicoId,
        fecha: fechaISO,
        fecha_hora: fechaISO,
        disponible: disponible,
      });
      if (disponible) {
        eliminar_reservas_de_turno(id);
      }
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

    _turnos.proximo = proximoId + 1;

    turnos.push({
      id: proximoId,
      id_medico: medicoId,
      fecha: fechaISO,
      fecha_hora: fechaISO,
      disponible: disponible,
    });
  }

  _turnos.data = turnos;
  localStorage.setItem("turnos", JSON.stringify(_turnos));

  mostrar_turnos();
  mostrar_toast(
    modoEdicion ? "Turno actualizado correctamente" : "Turno agregado correctamente",
    "success"
  );
  modalTurno.hide();

  if (!modoEdicion) {
    setTimeout(() => window.location.reload(), 500);
  }
}


function abrir_modal_eliminar(id) {
  idAEliminar = id;
  modalEliminar.show();
}

function confirmar_eliminar() {
  const _turnos = obtener_datos("turnos");
  const turnoId = idAEliminar;
  turnos = turnos.filter((t) => t.id !== idAEliminar);
  _turnos.data = turnos;
  localStorage.setItem("turnos", JSON.stringify(_turnos));
  eliminar_reservas_de_turno(turnoId);
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

