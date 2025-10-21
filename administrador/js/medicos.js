async function load_data( archivo, variable ){
    if ( !localStorage.getItem(variable) ){
        const data = await fetch(`data/${archivo}`)
        const data_archivo = await data.json() 
        localStorage.setItem(variable,JSON.stringify(data_archivo))
    }
}

function obtener_datos( variable ){
    return JSON.parse(localStorage.getItem(variable)) || []
}

function validar_usuario(){
    if ( localStorage.getItem("usuario_logueado") ){
        let user_logueado = localStorage.getItem("usuario_logueado")
        let usuarios = obtener_datos("usuarios").data
        const existe = usuarios.filter( usuario => usuario.email == user_logueado )
        if ( existe[0].tipo != "admin") location.href = "../index.html"
    }else location.href = "../index.html"
}

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
            <button type="button" class="btn btn-outline-warning boton-editar" data-id="${index}"><i class="fa-solid fa-edit"></i></button>
            <button type="button" class="btn btn-outline-danger boton-borrar" data-id="${index}"><i class="fa-solid fa-trash-can"></i></button>
        </td>
        `
        tabla_medicos.appendChild(tr)
    })
}

async function carga_inicial(){
    await load_data("usuarios.json", "usuarios")
    await load_data("medicos.json", "medicos")
    await load_data("obras_sociales.json", "obras_sociales")
    await load_data("especialidades.json", "especialidades")
    await validar_usuario()
    actualizar_tabla()
}

carga_inicial()