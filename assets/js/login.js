import { auth, getUserData } from "./auth.js"

let formulario = document.getElementById("inicio_sesion")
let div_error = document.getElementById("div_error")

if ( !localStorage.getItem("usuarios") ){
  fetch("administrador/data/usuarios.json")
  .then( promesa => promesa.json() )
  .then( usuarios_de_archivo =>{
    localStorage.setItem("usuarios",JSON.stringify(usuarios_de_archivo))
  })
}

if ( sessionStorage.getItem("access_token") ){
  let user_logueado = sessionStorage.getItem("access_token")
  if ( user_logueado ){
      try{
          const userData = await getUserData(user_logueado)
          console.log(userData.role)
          if ( userData.role != "admin" || userData.role != 'superadmin') location.href = "administrador/index.html"
          else location.href = "turnos.html"
      }catch(e){}
  }
}

function obtener_usuarios(){
  return JSON.parse(localStorage.getItem("usuarios")) || []
}

formulario.addEventListener("submit",async function ( event ){
    event.preventDefault()
    
    let inputs = formulario.querySelectorAll("input")
    let email = inputs[0].value
    let pass = inputs[1].value

    if ( email.trim().length == 0 || pass.trim().length == 0  ) {div_error.innerHTML = `<div class="alert alert-danger" role="alert">Todos los campos son requeridos</div>`}
    const usuarios = obtener_usuarios().data
    try {
        const user = await auth(email, pass)
        sessionStorage.setItem("access_token",user.accessToken)
        sessionStorage.setItem("username",user.username)
        const userData = await getUserData(user.accessToken)
        if ( userData.role == "admin" ||userData.role == "superadmin") location.href = "administrador/index.html"
        else location.href = "turnos.html"
    } catch (error) {
        div_error.innerHTML = `<div class="alert alert-danger" role="alert">El usuario o la contraseña son incorrectas</div>`
        return
    }

})