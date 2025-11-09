import { carga_inicial, obtener_datos } from "./comunes.js"

const prof_container = document.getElementById("profesionales_container")


async function cargar_profesionales(){
    let medicos = obtener_datos("medicos").data
    let obras_sociales = obtener_datos("obras_sociales").data
    let especialidades = obtener_datos("especialidades").data

    medicos.forEach( (medico, index) => {
        let article = document.createElement("article")
        article.classList.add("col-12","col-sm-6","col-lg-3")
        let especialidad = especialidades.filter( esp => medico.especialidad.includes(esp.id) )
        let obra_social = obras_sociales.filter( os => medico.obras_sociales.includes(os.id) )
        article.innerHTML =  ` 
        <div class="card h-100 text-center shadow-sm">
            <img src="${medico.imagen}" alt="Foto de ${medico.apellido}, ${medico.nombre}" class="card-img-top img-fluid" />
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

async function inicializar_vista(){
    await carga_inicial()
    cargar_profesionales()
}
inicializar_vista()

