import { carga_inicial, obtener_datos } from "./comunes.js";

function cargar_datos_medico(){
    const url_medico = window.location.href;
    const url = new URL(url_medico);
    const params = url.searchParams;
    const medicos = obtener_datos("medicos")
    
    if ( !params.get("id") || params.get("id") == "" ){
        window.location.href = "404.html"
    }
    const id = params.get("id");
    
    const _medico = medicos.data.filter(med => med.id === Number(id));
    
    if ( _medico.length === 0 ){
        window.location.href = "404.html"
    }
    
    const medico = _medico[0];
    const especialidad = obtener_datos("especialidades")
    const obras_sociales = obtener_datos("obras_sociales")
    document.getElementById("foto_medico").src = medico.imagen;
    document.getElementById("nombre").innerText = `${medico.apellido}, ${medico.nombre}`;
    document.getElementById("especialidades").innerText = medico.especialidad.map(espec_id => {
        const espec = especialidad.data.find(e => e.id === espec_id);
        return espec ? espec.nombre : "";
    }).join(", ");
    document.getElementById("matricula").innerHTML = `<strong>Matrícula:</strong> ${medico.matricula}`;
    document.getElementById("valor_consulta").innerHTML = `<strong>Valor Consulta:</strong> $${medico.valor_consulta}`;
    
    document.getElementById("obras_sociales").innerHTML = medico.obras_sociales.map(os_id => {
        const os = obras_sociales.data.find(e => e.id === os_id);
        return os ? `<span class='badge bg-fucsia'>${os.nombre}</span>` : "";
    }).join("");
    document.getElementById("descripcion").innerHTML = medico.descripcion;
    
}

async function inicializar_vista(){
    await carga_inicial()
    await cargar_datos_medico()
}

inicializar_vista()