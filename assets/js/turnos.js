import { carga_inicial, cargar_data_archivo, obtener_datos } from "./comunes.js";

// Utilidades
function a_fecha_iso(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${da}`;
}

function formatear_fecha_hora(iso) {
  const d = new Date(iso);
  const fecha = d.toLocaleDateString('es-AR', { weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit' });
  const hora = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  return `${fecha} ${hora}`;
}

function obtener_lista(variable) {
  const data = obtener_datos(variable);
  // Soporta tanto objetos con {data:[]} como arrays puros
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
}

// Estado
const estado = {
  tipoAtencion: 'particular',
  obraSocialId: null,
  especialidadId: null,
  medicoId: null,
  turnoId: null,
  fechaISO: null,
  horaISO: null,
  costo: 0,
  descuentoPorcentaje: 0
};

// Elementos UI
const paso1 = document.getElementById('paso-1');
const paso2 = document.getElementById('paso-2');
const paso3 = document.getElementById('paso-3');
const paso4 = document.getElementById('paso-4');
const paso5 = document.getElementById('paso-5');
const contObra = document.getElementById('contenedor-obra-social');
const selObra = document.getElementById('select_obra');
const selEspecialidad = document.getElementById('select_especialidad');
const selMedico = document.getElementById('select_medico');
const infoValor = document.getElementById('info_valor_consulta');
const proximoTurno = document.getElementById('proximo_turno');
const inputFecha = document.getElementById('input_fecha');
const selectHora = document.getElementById('select_hora');

const resTipo = document.getElementById('res_tipo');
const resObra = document.getElementById('res_obra');
const resEsp = document.getElementById('res_especialidad');
const resMed = document.getElementById('res_medico');
const resTurno = document.getElementById('res_turno');
const resCosto = document.getElementById('res_costo');
const resDesc = document.getElementById('res_descuento');
const resTotal = document.getElementById('res_total');

function mostrar_paso(step) {
  [paso1, paso2, paso3, paso4, paso5].forEach(s => s.style.display = 'none');
  step.style.display = '';
}

function cargar_obras(obras) {
  selObra.innerHTML = '<option value="">Seleccione...</option>';
  obras.filter(o => o.id !== 0).forEach(o => {
    const opt = document.createElement('option');
    opt.value = o.id;
    opt.textContent = o.nombre;
    selObra.appendChild(opt);
  });
}

function cargar_especialidades(especialidades) {
  selEspecialidad.innerHTML = '<option value="">Seleccione...</option>';
  especialidades.forEach(e => {
    const opt = document.createElement('option');
    opt.value = e.id;
    opt.textContent = e.nombre;
    selEspecialidad.appendChild(opt);
  });
}

function cargar_medicos(medicos, especialidadId, obraId, tipo) {
  selMedico.innerHTML = '<option value="">Seleccione...</option>';
  let filtrados = medicos.filter(m => Number(m.especialidad) === Number(especialidadId));
  if (tipo === 'obra_social' && obraId) {
    filtrados = filtrados.filter(m => (m.obras_sociales || []).includes(Number(obraId)));
  }
  filtrados.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = `${m.apellido}, ${m.nombre}`;
    opt.dataset.valor = m.valor_consulta ?? 0;
    selMedico.appendChild(opt);
  });
}

function calcular_descuento(tipoAtencion) {
  // Regla simple: 0% particular, 40% cualquier obra social
  return tipoAtencion === 'obra_social' ? 40 : 0;
}

function calcular_totales() {
  const total = Math.max(0, Math.round((estado.costo - (estado.costo * estado.descuentoPorcentaje / 100))));
  resCosto.textContent = Number(estado.costo).toLocaleString('es-AR');
  resDesc.textContent = estado.descuentoPorcentaje;
  resTotal.textContent = total.toLocaleString('es-AR');
}

function obtener_proximo_turno(turnos, medicoId) {
  const ahora = new Date();
  const candidatos = turnos
    .filter(t => t.id_medico === Number(medicoId) && t.disponible)
    .filter(t => new Date(t.fecha) >= ahora)
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  return candidatos[0] || null;
}

function renderizar_horarios_para_fecha(turnos, medicoId, fechaISO) {
  const slots = turnos
    .filter(t => t.id_medico === Number(medicoId) && t.disponible)
    .filter(t => a_fecha_iso(t.fecha) === fechaISO)
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  selectHora.innerHTML = '<option value="">Seleccione...</option>';
  if (slots.length === 0) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = 'No hay horarios disponibles';
    selectHora.appendChild(opt);
    return;
  }
  slots.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = new Date(s.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    opt.dataset.datetime = s.fecha;
    selectHora.appendChild(opt);
  });
}

function cargar_fechas_y_horarios(turnos, medicoId) {
  // setear min del date para hoy
  const hoy = new Date();
  const min = a_fecha_iso(hoy);
  inputFecha.min = min;
  // preseleccionar fecha del proximo turno si existe
  const prox = obtener_proximo_turno(turnos, medicoId);
  proximoTurno.style.display = prox ? '' : 'none';
  if (prox) {
    proximoTurno.textContent = `Próximo turno: ${formatear_fecha_hora(prox.fecha)}`;
    const dISO = a_fecha_iso(prox.fecha);
    inputFecha.value = dISO;
    renderizar_horarios_para_fecha(turnos, medicoId, dISO);
  } else {
    inputFecha.value = '';
    selectHora.innerHTML = '<option value="">Sin horarios</option>';
  }
}

async function inicializar_turnos() {
  // Preferir comunes.js
  await carga_inicial();
  // Asegurar turnos también
  await cargar_data_archivo("administrador/data/turnos.json", "turnos");

  const obras = obtener_lista('obras_sociales');
  const especialidades = obtener_lista('especialidades');
  const medicos = obtener_lista('medicos');
  const turnos = obtener_lista('turnos');

  cargar_obras(obras);
  cargar_especialidades(especialidades);

  // Paso 1: tipo de atención
  document.getElementById('tipo_particular').addEventListener('change', (e) => {
    if (e.target.checked) {
      estado.tipoAtencion = 'particular';
      contObra.style.display = 'none';
      estado.obraSocialId = null;
    }
  });
  document.getElementById('tipo_obra').addEventListener('change', (e) => {
    if (e.target.checked) {
      estado.tipoAtencion = 'obra_social';
      contObra.style.display = '';
    }
  });
  selObra.addEventListener('change', (e) => {
    estado.obraSocialId = e.target.value ? Number(e.target.value) : null;
  });
  document.getElementById('btn-next-1').addEventListener('click', () => {
    if (estado.tipoAtencion === 'obra_social' && !estado.obraSocialId) {
      alert('Seleccione una obra social.');
      return;
    }
    mostrar_paso(paso2);
  });

  // Paso 2
  document.getElementById('btn-back-2').addEventListener('click', () => mostrar_paso(paso1));
  document.getElementById('btn-next-2').addEventListener('click', () => {
    const espId = selEspecialidad.value;
    if (!espId) {
      alert('Seleccione una especialidad.');
      return;
    }
    estado.especialidadId = Number(espId);
    cargar_medicos(medicos, estado.especialidadId, estado.obraSocialId, estado.tipoAtencion);
    mostrar_paso(paso3);
  });

  // Paso 3
  document.getElementById('btn-back-3').addEventListener('click', () => mostrar_paso(paso2));
  selMedico.addEventListener('change', (e) => {
    const medicoId = e.target.value ? Number(e.target.value) : null;
    estado.medicoId = medicoId;
    if (medicoId) {
      const selected = medicos.find(m => m.id === medicoId);
      estado.costo = Number(selected?.valor_consulta ?? 0);
      estado.descuentoPorcentaje = calcular_descuento(estado.tipoAtencion);
      infoValor.style.display = '';
      infoValor.textContent = `Valor de la consulta: $${estado.costo.toLocaleString('es-AR')}`;
    } else {
      infoValor.style.display = 'none';
      estado.costo = 0;
    }
  });
  document.getElementById('btn-next-3').addEventListener('click', () => {
    if (!estado.medicoId) {
      alert('Seleccione un médico.');
      return;
    }
    cargar_fechas_y_horarios(turnos, estado.medicoId);
    mostrar_paso(paso4);
  });

  // Paso 4
  document.getElementById('btn-back-4').addEventListener('click', () => mostrar_paso(paso3));
  inputFecha.addEventListener('change', (e) => {
    const f = e.target.value;
    if (!f) return;
    // No permitir fechas anteriores a hoy
    const hoyISO = a_fecha_iso(new Date());
    if (f < hoyISO) {
      alert('No puede seleccionar una fecha anterior a hoy.');
      inputFecha.value = hoyISO;
      return;
    }
    renderizar_horarios_para_fecha(turnos, estado.medicoId, f);
  });
  document.getElementById('btn-next-4').addEventListener('click', () => {
    const fechaSel = inputFecha.value;
    const horaSelId = selectHora.value;
    if (!fechaSel || !horaSelId) {
      alert('Seleccione fecha y horario.');
      return;
    }
    const opt = selectHora.selectedOptions[0];
    const datetime = opt?.dataset?.datetime;
    estado.turnoId = Number(horaSelId);
    estado.fechaISO = fechaSel;
    estado.horaISO = datetime || null;

    // Completar resumen
    const obras = obtener_lista('obras_sociales');
    const especialidades = obtener_lista('especialidades');
    const medicosLista = obtener_lista('medicos');
    const obraNombre = obras.find(o => o.id === estado.obraSocialId)?.nombre || '-';
    const espNombre = especialidades.find(e => e.id === estado.especialidadId)?.nombre || '-';
    const medico = medicosLista.find(m => m.id === estado.medicoId);
    resTipo.textContent = estado.tipoAtencion === 'obra_social' ? 'Obra social' : 'Particular';
    resObra.textContent = estado.tipoAtencion === 'obra_social' ? obraNombre : '-';
    resEsp.textContent = espNombre;
    resMed.textContent = medico ? `${medico.apellido}, ${medico.nombre}` : '-';
    const fechaHoraTxt = estado.horaISO ? formatear_fecha_hora(estado.horaISO) : `${estado.fechaISO}`;
    resTurno.textContent = fechaHoraTxt;
    calcular_totales();
    mostrar_paso(paso5);
  });

  // Paso 5
  document.getElementById('btn-back-5').addEventListener('click', () => mostrar_paso(paso4));
  document.getElementById('btn-cancelar').addEventListener('click', () => {
    if (confirm('¿Desea cancelar el proceso?')) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      location.reload();
    }
  });
  document.getElementById('btn-confirmar').addEventListener('click', () => {
    const dni = document.getElementById('dni').value.trim();
    const nombre = document.getElementById('nombre').value.trim();
    const apellido = document.getElementById('apellido').value.trim();
    if (!dni || !nombre || !apellido) {
      alert('Complete DNI, nombre y apellido.');
      return;
    }
    alert('Reserva confirmada. Recibirá confirmación por email/whatsapp.');
    // Aquí se podría persistir en localStorage el turno tomado (disponible=false)
  });
}

inicializar_turnos();


