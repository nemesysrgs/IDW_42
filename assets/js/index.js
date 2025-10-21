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
                <p><small>(mat. ${medico.matricula})</small></p>
            </div>
        </div>
        `
        prof_container.appendChild(article)
    })
}
cargar_profesionales()


/* medico
<article class="col-12 col-sm-6 col-lg-3">
  <div class="card h-100 text-center shadow-sm">
    <img
      src="assets/img/gustavo_soria.png"
      alt="Gustavo Soria"
      class="card-img-top img-fluid"
    />
    <div class="card-body">
      <h2 class="card-title">Gustavo Soria</h2>
      <p class="card-text">
        <span>Proctólogo</span>,
        <span>Urólogo</span>
      </p>
    </div>
  </div>
</article> */

/* obra social
<div class="col-6 col-sm-4 col-md-3 col-lg-2 col-xl-1">
  <a href="#obras-sociales" class="d-block text-center">
    <img
      src="assets/img/obras-sociales/ospjn.png"
      class="img-fluid p-2"
      alt="OSPJN"
      title="OSPJN"
    />
  </a>
</div> */