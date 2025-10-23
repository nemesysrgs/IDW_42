async function cargar_data_archivo( archivo, variable ){
    if ( !localStorage.getItem(variable) ){
        const data = await fetch(`${archivo}`)
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

function cerrar_sesion( admin = false){
    localStorage.removeItem("usuario_logueado")
    if( admin ) location.href = "../index.html";
    location.href = "index.html";
}

async function carga_inicial(){
    await cargar_data_archivo("administrador/data/usuarios.json", "usuarios")
    await cargar_data_archivo("administrador/data/medicos.json", "medicos")
    await cargar_data_archivo("administrador/data/obras_sociales.json", "obras_sociales")
    await cargar_data_archivo("administrador/data/especialidades.json", "especialidades")
}

carga_inicial()