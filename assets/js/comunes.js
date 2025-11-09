import { getUserData } from "./auth.js"

export async function cargar_data_archivo( archivo, variable ){
    if ( !localStorage.getItem(variable) ){
        const data = await fetch(`${archivo}`)
        const data_archivo = await data.json() 
        localStorage.setItem(variable,JSON.stringify(data_archivo))
        return data_archivo
    }
}

export function obtener_datos( variable ){
    return JSON.parse(localStorage.getItem(variable)) || []
}

export async function validar_usuario(){
    let user_logueado = sessionStorage.getItem("access_token")
    if ( user_logueado ){
        try{
            const userData = await getUserData(user_logueado)
            console.log(userData.role)
            if ( userData.role != "admin" && userData.role != 'moderator') location.href = "../index.html"
        }catch(e){
            cerrar_sesion()
        }
    }else location.href = "../index.html"
}

export function cerrar_sesion( admin = false){
    sessionStorage.removeItem("access_token")
    sessionStorage.removeItem("username")
    if( admin ) location.href = "../index.html";
    location.href = "index.html";
}

export async function carga_inicial(){
    await cargar_data_archivo("administrador/data/medicos.json", "medicos")
    await cargar_data_archivo("administrador/data/obras_sociales.json", "obras_sociales")
    await cargar_data_archivo("administrador/data/especialidades.json", "especialidades")
}

window.cerrar_sesion = cerrar_sesion