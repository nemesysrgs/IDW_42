import { carga_inicial, decodificarImagenBase64, obtener_datos, obtenerImagenMedico } from "./comunes.js"

const prof_container = document.getElementById("profesionales_container")
const div_obras_sociales = document.getElementById("obras_sociales")


async function cargar_profesionales(){
    
    let medicos = await obtener_datos("medicos").data
    let obras_sociales = await obtener_datos("obras_sociales").data
    let especialidades = await obtener_datos("especialidades").data

    medicos.forEach( (medico, index) => {
        let article = document.createElement("article")
        article.classList.add("col-12","col-sm-6","col-lg-3")
        let especialidad = especialidades.filter( esp => medico.especialidad.includes(esp.id) )
        let obra_social = obras_sociales.filter( os => medico.obras_sociales.includes(os.id) )
        const medicoImg = obtenerImagenMedico(medico)
        article.innerHTML =  ` 
        <div class="card h-100 text-center shadow-sm">
            <img src="${medicoImg}" alt="Foto de ${medico.apellido}, ${medico.nombre}" class="card-img-top img-fluid" />
            <div class="card-body">
                <h2 class="card-title">${medico.apellido}, ${medico.nombre} </h2>
                <p class="card-text">
                    ${especialidad.map(e=>`<span>${e.nombre}</span>`).join(", ")}
                </p>
                <p><a href="ver_profesional.html?id=${medico.id}" target="_blank">ver más</a></p>
                <p><small>(MN: ${medico.matricula})</small></p>
            </div>
        </div>
        `
        prof_container.appendChild(article)
    })
}

async function cargar_obras_sociales(){
    
    let obras_sociales = await obtener_datos("obras_sociales").data
    obras_sociales.filter((os)=>os.id > 0).forEach( (obraSocial) => {
        let div = document.createElement("div")
        div.classList.add("col-6","col-sm-4","col-md-3","col-lg-2","col-xl-1")
        const imgSrc = decodificarImagenBase64(obraSocial.image);
        div.innerHTML =  ` 
          <a href="#obras-sociales" class="d-block text-center">
            <img src="${imgSrc}" class="img-fluid p-2" alt="imagen de ${obraSocial.nombre}" title="${obraSocial.nombre}" />
          </a>
        `
        div_obras_sociales.appendChild(div)
    })
}

async function inicializar_vista(){
    await carga_inicial()
    cargar_profesionales()
    cargar_obras_sociales()
}
inicializar_vista()

