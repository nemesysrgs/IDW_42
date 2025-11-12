import { carga_inicial, cargar_data_archivo, obtener_datos } from "./comunes.js";

function convertir_fecha(date) {
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
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
}
function normalizar_turno(turno) {
  if (!turno || typeof turno !== 'object') return null;
  const medicoIdRaw = turno.id_medico ?? turno.medico_id ?? turno.medicoId ?? turno.idMedico ?? turno.medico;
  const medicoId = medicoIdRaw !== undefined && medicoIdRaw !== null && medicoIdRaw !== '' ? Number(medicoIdRaw) : null;
  const fecha =
    turno.fecha ??
    turno.fecha_hora ??
    turno.fechaHora ??
    turno.datetime ??
    turno.fechaISO ??
    null;
  const disponible = turno.disponible !== undefined ? Boolean(turno.disponible) : true;
  return {
    ...turno,
    id_medico: medicoId,
    fecha,
    disponible
  };
}
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
const encabezado = document.getElementById('reserva-encabezado');
const paso1 = document.getElementById('paso-1');
const paso2 = document.getElementById('paso-2');
const paso3 = document.getElementById('paso-3');
const paso4 = document.getElementById('paso-4');
const paso5 = document.getElementById('paso-5');
const paso6 = document.getElementById('paso-6');
const contObra = document.getElementById('contenedor-obra-social');
const selObra = document.getElementById('select_obra');
const selEspecialidad = document.getElementById('select_especialidad');
const selMedico = document.getElementById('select_medico');
const infoValor = document.getElementById('info_valor_consulta');
const proximoTurno = document.getElementById('proximo_turno');
const proximoTurnoTexto = document.getElementById('proximo_turno_texto');
const aceptarTurnoBtn = document.getElementById('aceptar_turno');
const inputFecha = document.getElementById('input_fecha');
const selectHora = document.getElementById('select_hora');
let turnosNormalizados = [];

const resTipo = document.getElementById('res_tipo');
const resObra = document.getElementById('res_obra');
const resEsp = document.getElementById('res_especialidad');
const resMed = document.getElementById('res_medico');
const resTurno = document.getElementById('res_turno');
const resCosto = document.getElementById('res_costo');
const resDesc = document.getElementById('res_descuento');
const resTotal = document.getElementById('res_total');

const confId = document.getElementById('conf_id');
const confPaciente = document.getElementById('conf_paciente');
const confDni = document.getElementById('conf_dni');
const confTipo = document.getElementById('conf_tipo');
const confObra = document.getElementById('conf_obra');
const confEspecialidad = document.getElementById('conf_especialidad');
const confMedico = document.getElementById('conf_medico');
const confTurno = document.getElementById('conf_turno');
const confCosto = document.getElementById('conf_costo');
const confDescuento = document.getElementById('conf_descuento');
const confTotal = document.getElementById('conf_total');

function mostrar_paso(step) {
  [paso1, paso2, paso3, paso4, paso5, paso6].forEach(s => s.style.display = 'none');
  step.style.display = '';
}

function cargar_obras_sociales(obras) {
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
  
  
  let filtradosPorEspecialidad = medicos.filter(m => Number(m.especialidad) === Number(especialidadId));
  
  
  if (filtradosPorEspecialidad.length === 0) {
    return { encontrados: false, motivo: 'especialidad' };
  }
  
  
  let filtrados = filtradosPorEspecialidad;
  if (tipo === 'obra_social' && obraId) {
    filtrados = filtradosPorEspecialidad.filter(m => (m.obras_sociales || []).includes(Number(obraId)));
    
    
    if (filtrados.length === 0) {
      return { encontrados: false, motivo: 'obra_social' };
    }
  }
  
  if (filtrados.length === 0) {
    return { encontrados: false, motivo: 'condiciones' };
  }
  
  
  filtrados.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = `${m.apellido}, ${m.nombre}`;
    opt.dataset.valor = m.valor_consulta ?? 0;
    selMedico.appendChild(opt);
  });
  
  return { encontrados: true, motivo: null };
}

function calcular_descuento(tipoAtencion, obraSocialId, obras) {
  if (tipoAtencion !== 'obra_social') return 0;
  const obra = (obras || []).find(o => o.id === Number(obraSocialId));
  return Number(obra?.porcentaje ?? 0);
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
    .filter(t => {
      if (!t.fecha) return false;
      const fechaTurno = new Date(t.fecha);
      return !Number.isNaN(fechaTurno.getTime()) && fechaTurno >= ahora;
    })
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  return candidatos[0] || null;
}

function renderizar_horarios_para_fecha(turnos, medicoId, fechaISO) {
  const slots = turnos
    .filter(t => t.id_medico === Number(medicoId))
    .filter(t => t.fecha && convertir_fecha(t.fecha) === fechaISO)
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  selectHora.innerHTML = '<option value="">Seleccione...</option>';
  if (slots.length === 0) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = 'No hay horarios disponibles';
    selectHora.appendChild(opt);
    return;
  }
  const hoyISO = convertir_fecha(new Date());
  const ahora = new Date();
  let primerDisponibleId = null;
  slots.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = new Date(s.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    opt.dataset.datetime = s.fecha;
    const esMismoDiaHoy = fechaISO === hoyISO;
    const esPasadoHoy = esMismoDiaHoy && (new Date(s.fecha) <= ahora);
    const noDisponible = !s.disponible;
    opt.disabled = esPasadoHoy || noDisponible;
    if (!opt.disabled && primerDisponibleId === null) {
      primerDisponibleId = s.id;
    }
    selectHora.appendChild(opt);
  });
  if (estado.turnoSugeridoId) {
    const opcionSugerida = Array.from(selectHora.options).find(o => Number(o.value) === Number(estado.turnoSugeridoId) && !o.disabled);
    if (opcionSugerida) {
      selectHora.value = String(estado.turnoSugeridoId);
      return;
    }
  }
  if (primerDisponibleId) {
    selectHora.value = String(primerDisponibleId);
  }
}

function cargar_fechas_y_horarios(turnos, medicoId) {
  const hoy = new Date();
  const min = convertir_fecha(hoy);
  inputFecha.min = min;
  const prox = obtener_proximo_turno(turnos, medicoId);
  proximoTurno.style.display = prox ? '' : 'none';
  if (prox) {
    estado.turnoSugeridoId = prox.id;
    if (proximoTurnoTexto) {
      proximoTurnoTexto.textContent = prox.fecha ? `Próximo turno: ${formatear_fecha_hora(prox.fecha)}` : '';
    }
    const fecha = convertir_fecha(prox.fecha);
    inputFecha.value = fecha;
    renderizar_horarios_para_fecha(turnos, medicoId, fecha);
  } else {
    inputFecha.value = '';
    selectHora.innerHTML = '<option value="">Sin horarios</option>';
  }
}

async function inicializar_turnos() {
  await carga_inicial();
  await cargar_data_archivo("administrador/data/turnos.json", "turnos");

  const obras = obtener_lista('obras_sociales');
  const especialidades = obtener_lista('especialidades');
  const medicos = obtener_lista('medicos');
  const turnos = obtener_lista('turnos');
  turnosNormalizados = turnos
    .map(normalizar_turno)
    .filter(t => t && t.id && t.fecha && t.id_medico !== null && !Number.isNaN(t.id_medico));

  cargar_obras_sociales(obras);
  cargar_especialidades(especialidades);

  document.getElementById('tipo_particular').addEventListener('change', (e) => {
    if (e.target.checked) {
      estado.tipoAtencion = 'particular';
      contObra.style.display = 'none';
      estado.obraSocialId = null;
      if (estado.especialidadId) {
        cargar_medicos(medicos, estado.especialidadId, null, 'particular');
        estado.medicoId = null;
        selMedico.value = '';
        infoValor.style.display = 'none';
      }
    }
  });
  document.getElementById('tipo_obra').addEventListener('change', (e) => {
    if (e.target.checked) {
      estado.tipoAtencion = 'obra_social';
      contObra.style.display = '';
      
      
      if (estado.especialidadId && estado.obraSocialId) {
        const resultado = cargar_medicos(medicos, estado.especialidadId, estado.obraSocialId, 'obra_social');
        if (!resultado.encontrados && resultado.motivo === 'obra_social') {
          const obra = obras.find(o => o.id === estado.obraSocialId);
          const especialidades = obtener_lista('especialidades');
          const especialidad = especialidades.find(e => e.id === estado.especialidadId);
          alert(`No hay médicos disponibles para la especialidad "${especialidad?.nombre || 'seleccionada'}" que atiendan con la obra social "${obra?.nombre || 'seleccionada'}".`);
        }
        
        estado.medicoId = null;
        selMedico.value = '';
        infoValor.style.display = 'none';
      }
    }
  });
  selObra.addEventListener('change', (e) => {
    estado.obraSocialId = e.target.value ? Number(e.target.value) : null;

    
    if (estado.especialidadId) {
        const resultado = cargar_medicos(medicos, estado.especialidadId, estado.obraSocialId, estado.tipoAtencion);
      if (!resultado.encontrados) {
        let mensaje = '';
        if (resultado.motivo === 'obra_social') {
          const obra = obras.find(o => o.id === estado.obraSocialId);
          const especialidades = obtener_lista('especialidades');
          const especialidad = especialidades.find(e => e.id === estado.especialidadId);
          mensaje = `No hay médicos disponibles para la especialidad "${especialidad?.nombre || 'seleccionada'}" que atiendan con la obra social "${obra?.nombre || 'seleccionada'}".`;
        } else if (resultado.motivo === 'especialidad') {
          const especialidades = obtener_lista('especialidades');
          const especialidad = especialidades.find(e => e.id === estado.especialidadId);
          mensaje = `No hay médicos disponibles para la especialidad "${especialidad?.nombre || 'seleccionada'}".`;
        } else {
          mensaje = 'No hay médicos disponibles con las condiciones seleccionadas.';
        }
        alert(mensaje);
      }
      
      estado.medicoId = null;
      selMedico.value = '';
      infoValor.style.display = 'none';
    }
  });
  document.getElementById('btn-next-1').addEventListener('click', () => {
    if (estado.tipoAtencion === 'obra_social' && !estado.obraSocialId) {
      alert('Seleccione una obra social.');
      return;
    }
    mostrar_paso(paso2);
  });

  document.getElementById('btn-back-2').addEventListener('click', () => mostrar_paso(paso1));
  document.getElementById('btn-next-2').addEventListener('click', () => {
    const espId = selEspecialidad.value;
    if (!espId) {
      alert('Seleccione una especialidad.');
      return;
    }
    estado.especialidadId = Number(espId);
    const resultado = cargar_medicos(medicos, estado.especialidadId, estado.obraSocialId, estado.tipoAtencion);
    
    if (!resultado.encontrados) {
      let mensaje = '';
      if (resultado.motivo === 'especialidad') {
        const especialidades = obtener_lista('especialidades');
        const especialidad = especialidades.find(e => e.id === estado.especialidadId);
        mensaje = `No hay médicos disponibles para la especialidad "${especialidad?.nombre || 'seleccionada'}".`;
      } else if (resultado.motivo === 'obra_social') {
        const obras = obtener_lista('obras_sociales');
        const obra = obras.find(o => o.id === estado.obraSocialId);
        const especialidades = obtener_lista('especialidades');
        const especialidad = especialidades.find(e => e.id === estado.especialidadId);
        mensaje = `No hay médicos disponibles para la especialidad "${especialidad?.nombre || 'seleccionada'}" que atiendan con la obra social "${obra?.nombre || 'seleccionada'}".`;
      } else {
        mensaje = 'No hay médicos disponibles con las condiciones seleccionadas.';
      }
      alert(mensaje);
      return;
    }
    
    mostrar_paso(paso3);
  });

  document.getElementById('btn-back-3').addEventListener('click', () => mostrar_paso(paso2));
  selMedico.addEventListener('change', (e) => {
    const medicoId = e.target.value ? Number(e.target.value) : null;
    estado.medicoId = medicoId;
    if (medicoId) {
      const selected = medicos.find(m => m.id === medicoId);
      estado.costo = Number(selected?.valor_consulta ?? 0);
      estado.descuentoPorcentaje = calcular_descuento(estado.tipoAtencion, estado.obraSocialId, obras);
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
    cargar_fechas_y_horarios(turnosNormalizados, estado.medicoId);
    mostrar_paso(paso4);
  });

  document.getElementById('btn-back-4').addEventListener('click', () => mostrar_paso(paso3));
  inputFecha.addEventListener('change', (e) => {
    const f = e.target.value;
    if (!f) return;

    const hoyISO = convertir_fecha(new Date());
    if (f < hoyISO) {
      alert('No puede seleccionar una fecha anterior a hoy.');
      inputFecha.value = hoyISO;
      return;
    }
    renderizar_horarios_para_fecha(turnosNormalizados, estado.medicoId, f);
  });
  if (aceptarTurnoBtn) {
    aceptarTurnoBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (!estado.turnoSugeridoId) return;
      const turno = turnosNormalizados.find(t => t.id === Number(estado.turnoSugeridoId));
      if (!turno) return;
      const fecha = convertir_fecha(turno.fecha);
      inputFecha.value = fecha;
      renderizar_horarios_para_fecha(turnosNormalizados, estado.medicoId, fecha);
    });
  }
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

    estado.descuentoPorcentaje = calcular_descuento(estado.tipoAtencion, estado.obraSocialId, obras);
    calcular_totales();
    mostrar_paso(paso5);
  });

  document.getElementById('btn-back-5').addEventListener('click', () => mostrar_paso(paso4));
  document.getElementById('btn-cancelar').addEventListener('click', () => {
    if (confirm('¿Desea cancelar el proceso?')) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      location.reload();
    }
  });


  const dniInput = document.getElementById("dni");
  const nombreInput = document.getElementById("nombre_apellido");
  const btnConfirmar = document.getElementById("btn-confirmar");
  btnConfirmar.disabled = true;
  // aca se van a eliminar los caracteres que no sean numeros del dni
  dniInput.addEventListener("input", function () {
    this.value = this.value.replace(/\D/g, "");
    validarCampos();
  });
  // aca valido nuevamente por que hay veces que la validacion anterior falla
  nombreInput.addEventListener("input", validarCampos);

  // con esta funcion me asegiro que el dni tenga maximo 8 digitos y el nombre tenga algo escrito
  function validarCampos() {
    const dniValido = /^\d{8}$/.test(dniInput.value); 
    const nombreValido = nombreInput.value.trim().length > 0;
    btnConfirmar.disabled = !(dniValido && nombreValido);
  }

  document.getElementById('btn-confirmar').addEventListener('click', () => {
    const dni = dniInput.value.trim()
    const nombreApellido = nombreInput.value.trim()

    if (!/^\d{8}$/.test(dni)) {
      alert('El DNI debe tener exactamente 8 números.');
      return;
    }
    if (!nombreApellido) {
      alert('Complete el campo Nombre y Apellido.');
      return;
    }

    const total = Math.max(0, Math.round((estado.costo - (estado.costo * estado.descuentoPorcentaje / 100))));
    const reservasRaw = localStorage.getItem('reservas');
    const reservas = reservasRaw ? JSON.parse(reservasRaw) : [];
    const nuevaReserva = {
      id: (reservas.at(-1)?.id ?? 0) + 1,
      id_turno: estado.turnoId,
      id_medico: estado.medicoId,
      fecha: estado.horaISO || estado.fechaISO,
      tipo_atencion: estado.tipoAtencion,
      obra_social_id: estado.obraSocialId,
      especialidad_id: estado.especialidadId,
      dni,
      nombre_apellido: nombreApellido,
      costo: estado.costo,
      descuento_porcentaje: estado.descuentoPorcentaje,
      total,
      creado_en: new Date().toISOString()
    };
    reservas.push(nuevaReserva);
    localStorage.setItem('reservas', JSON.stringify(reservas));
    const turnosLS = obtener_datos('turnos');
    const turnosArray = Array.isArray(turnosLS?.data) ? turnosLS.data
                      : (Array.isArray(turnosLS) ? turnosLS : []);
    const idx = turnosArray.findIndex(t => t.id === estado.turnoId);
    if (idx !== -1) {
      turnosArray[idx].disponible = false;
      if (Array.isArray(turnosLS?.data)) {
        localStorage.setItem('turnos', JSON.stringify({ ...turnosLS, data: turnosArray }));
      } else {
        localStorage.setItem('turnos', JSON.stringify(turnosArray));
      }
    }
    
    const obras = obtener_lista('obras_sociales');
    const especialidades = obtener_lista('especialidades');
    const medicosLista = obtener_lista('medicos');
    const obraNombre = obras.find(o => o.id === estado.obraSocialId)?.nombre || '-';
    const espNombre = especialidades.find(e => e.id === estado.especialidadId)?.nombre || '-';
    const medico = medicosLista.find(m => m.id === estado.medicoId);
    const fechaHoraTxt = estado.horaISO ? formatear_fecha_hora(estado.horaISO) : `${estado.fechaISO}`;

    confId.textContent = nuevaReserva.id;
    confPaciente.textContent = nombreApellido;
    confDni.textContent = dni;
    confTipo.textContent = estado.tipoAtencion === 'obra_social' ? 'Obra social' : 'Particular';
    confObra.textContent = estado.tipoAtencion === 'obra_social' ? obraNombre : '-';
    confEspecialidad.textContent = espNombre;
    confMedico.textContent = medico ? `${medico.apellido}, ${medico.nombre}` : '-';
    confTurno.textContent = fechaHoraTxt;
    confCosto.textContent = Number(estado.costo).toLocaleString('es-AR');
    confDescuento.textContent = estado.descuentoPorcentaje;
    confTotal.textContent = total.toLocaleString('es-AR');
    encabezado.classList.add("d-none")
    mostrar_paso(paso6);
  });
  
  document.getElementById('btn-nueva-reserva').addEventListener('click', () => {
    location.reload();
  });
}

inicializar_turnos();


