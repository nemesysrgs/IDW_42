let tabla_medicos = document.querySelector("#tabla_medicos tbody")

function actualizar_tabla(){
    tabla_medicos.innerHTML = "";
    let medicos = obtener_datos("medicos").data
    let obras_sociales = obtener_datos("obras_sociales").data
    let especialidades = obtener_datos("especialidades").data

    medicos.forEach( (medico, index) => {
        let tr = document.createElement("tr")
        let especialidad = especialidades.filter( esp => medico.especialidad.includes(esp.id) )
        let obra_social = obras_sociales.filter( os => medico.obras_sociales.includes(os.id) )
        tr.innerHTML =  ` 
        <td class="d-none d-md-block"><img src="${medico.imagen}" width="80px" class="img-thumbnail" alt="Foto de ${medico.apellido}, ${medico.nombre}"></td>
        <td>${medico.apellido}, ${medico.nombre}</td>
        <td>${medico.matricula}</td>
        <td>${especialidad.map(e=>`<span class="badge bg-secondary">${e.nombre}</span>`).join(", ")}</td>
        <td>
            ${ obra_social.slice(0,3).map(os=>`<span class="badge bg-secondary">${os.nombre}</span>`).join(", ")}
            ${ obra_social.length - 3 > 0 ? `<span class="badge bg-secondary cursor-pointer" title="${obra_social.slice(3).map(os=>`${os.nombre}`).join(", ")}"> ... ${ (obra_social.length - 3)} más</span>` : "" }
            
        </td>
        <td>
            <button type="button" onclick="editar_medico(${index})" class="btn btn-outline-warning boton-editar" data-id="${index}"><i class="fa-solid fa-edit"></i></button>
            <button type="button" onclick="borrar_medico(${index})" class="btn btn-outline-danger boton-borrar" data-id="${index}"><i class="fa-solid fa-trash-can"></i></button>
        </td>
        `
        tabla_medicos.appendChild(tr)
    })
}

async function inicializar_vista(){
    await carga_inicial()
    await validar_usuario()
    actualizar_tabla()
}

inicializar_vista()