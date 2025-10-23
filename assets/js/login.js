let formulario = document.getElementById("inicio_sesion")
let div_error = document.getElementById("div_error")

if ( !localStorage.getItem("usuarios") ){
  fetch("administrador/data/usuarios.json")
  .then( promesa => promesa.json() )
  .then( usuarios_de_archivo =>{
    localStorage.setItem("usuarios",JSON.stringify(usuarios_de_archivo))
  })
}

if ( localStorage.getItem("usuario_logueado") ){
  let user_logueado = localStorage.getItem("usuario_logueado")
  let usuarios = obtener_usuarios().data
  const existe = usuarios.filter( usuario => usuario.email == user_logueado )
  if ( existe[0].tipo == "admin") location.href = "administrador/medicos.html"
  else location.href = "turnos.html"
}

function obtener_usuarios(){
  return JSON.parse(localStorage.getItem("usuarios")) || []
}

formulario.addEventListener("submit",function ( event ){
    event.preventDefault()
    
    let inputs = formulario.querySelectorAll("input")
    let email = inputs[0].value
    let pass = inputs[1].value

    if ( email.trim().length == 0 || pass.trim().length == 0  ) {div_error.innerHTML = `<div class="alert alert-danger" role="alert">Todos los campos son requeridos</div>`}

    let usuarios = obtener_usuarios().data
    const existe = usuarios.filter( usuario => usuario.email == email && usuario.pass == pass )
    console.log(existe)
    if ( existe.length == 0 ) { div_error.innerHTML = `<div class="alert alert-danger" role="alert">El usuario o la contraseña son incorrectas</div>` }


    localStorage.setItem("usuario_logueado",email)

    if ( existe[0].tipo == "admin") location.href = "administrador/medicos.html"
    else location.href = "turnos.html"
})