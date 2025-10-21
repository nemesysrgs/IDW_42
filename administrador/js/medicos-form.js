const error_container = document.querySelector("#error")
const form_container = document.getElementById("form-container")
const table_container = document.getElementById("table-container")
const formulario = document.querySelector("#formulario_medicos")
const busqueda_esp = document.getElementById("filtro-especialidad")
const busqueda_os = document.getElementById("filtro-osocial")
const inputFile = document.getElementById('formFile');
const retrato = document.getElementById('retrato');

let edicion = false
let no_img = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeD0iMCIgeT0iMCIgZmlsbD0iZ3JheSIgLz4KPC9zdmc+"
formulario.addEventListener("submit", ( event )=>{
    event.preventDefault()
    const medicos = obtener_datos("medicos");
    elementos = formulario.querySelectorAll("input[type='file'],input[type='text'],input[type='hidden']")
    const medicoObj = {
        id: ( edicion ) ? formulario.querySelector("input[name='id']").value : medicos.proximo,
        apellido: formulario.querySelector("input[name='apellido']").value,
        nombre: formulario.querySelector("input[name='nombre']").value,
        matricula: Number(formulario.querySelector("input[name='matricula']").value),
        valor_consulta: parseFloat(formulario.querySelector("input[name='valor_consulta']").value),
        especialidad: formulario.querySelector("input[name='especialidades']").value
                        ? formulario.querySelector("input[name='especialidades']").value.split(",").map(Number)
                        : [],
        obras_sociales: formulario.querySelector("input[name='osociales']").value
                        ? formulario.querySelector("input[name='osociales']").value.split(",").map(Number)
                        : [],
        imagen: retrato.src
    };
    if ( !medicoObj.apellido || !medicoObj.nombre ||  !medicoObj.matricula ||  !medicoObj.valor_consulta || !medicoObj.especialidad || !medicoObj.imagen ){
        error_container.innerHTML = "<div class='alert alert-warning'>Todos los campos marcados con <span class='text-danger'>*</span> son requeridos</div>"
        return;
    }
    if ( edicion ){
        medicos.data[edicion] = medicoObj;
    }else{
        medicos.data.push(medicoObj);
        medicos.proximo = medicos.proximo + 1;
    }
    reset_form()
    localStorage.setItem("medicos", JSON.stringify(medicos))
    actualizar_tabla()
});

function abrir_form(){
    form_container.classList.remove("d-none")
    table_container.classList.add("d-none")
    form_container.scrollIntoView();
}

function cerrar_form(){
    form_container.classList.add("d-none")
    table_container.classList.remove("d-none")
}

function reset_form(){
    formulario.reset();
    cerrar_form()
    retrato.src = no_img; 
    document.getElementById("input-especialidad-nombres").innerHTML = "Sin especialidad"
    document.getElementById("input-osocial-nombres").innerHTML = "Trabaja sin obra social"
    cargar_especialidades();
    cargar_obras_sociales();
}

/* agrego event listener en la busqueda de especialidades y obras sociales */
busqueda_esp.addEventListener("input", () => {
    const texto = busqueda_esp.value.toLowerCase();
    const especialidades = document.querySelectorAll(".check_esp");
    especialidades.forEach(esp => {
        const valor = esp.dataset.value.toLowerCase();
        if (!valor.includes(texto)) esp.classList.add("d-none");
        else  esp.classList.remove("d-none");
    });
});

busqueda_os.addEventListener("input", () => {
    const texto = busqueda_os.value.toLowerCase();
    const obras_sociales = document.querySelectorAll(".check_os");
    obras_sociales.forEach(os => {
        const valor = os.dataset.value.toLowerCase();
        if (!valor.includes(texto)) os.classList.add("d-none");
        else  os.classList.remove("d-none");
    });
});

/* cargo los elementos de especialidades */
async function cargar_especialidades() {
    const container = document.getElementById("esp_container");
    container.innerHTML = ""
    const especialidades = await obtener_datos("especialidades");
    especialidades.data.forEach((esp, index) => {
        const item = document.createElement("li");
        item.classList.add("check_esp");
        item.dataset.value = esp.nombre; 
        item.innerHTML = `
        <input class="form-check-input" type="checkbox" value="${esp.id}" name="especialidades">
        <label class="form-check-label" for="check-${index}">${esp.nombre}</label>
        `;
        container.appendChild(item);
        item.addEventListener('change',()=>{
            actualizar_input_especialidades()
        })
    });
}
function actualizar_input_especialidades() {
    const especialidades = document.querySelectorAll(".check_esp input[type='checkbox']");
    const nombres = document.getElementById("input-especialidad-nombres");
    const indices = document.getElementById("input-especialidad");
    const _nombres = [];
    const _indices = [];
    especialidades.forEach(chk => {
        if (chk.checked) {
        const li = chk.closest(".check_esp");
        _nombres.push(li.dataset.value); 
        _indices.push(chk.value);
        }
    });
    nombres.innerHTML = _nombres.join(", ");
    indices.value = _indices.join(",");
    if(_indices.length == 0) nombres.innerHTML = "Sin especialidad"
}

/* cargo elementos de obras sociales */
async function cargar_obras_sociales() {
    const container = document.getElementById("os_container");
    container.innerHTML = ""
    const obras_sociales = await obtener_datos("obras_sociales");
    obras_sociales.data.forEach((esp, index) => {
        const item = document.createElement("li");
        item.classList.add("check_os");
        item.dataset.value = esp.nombre; 
        item.innerHTML = `
        <input class="form-check-input" type="checkbox" value="${esp.id}" name="obras_sociales">
        <label class="form-check-label" for="check-${index}">${esp.nombre}</label>
        `;
        container.appendChild(item);
        item.addEventListener('change',()=>{
            actualizar_input_obras_sociales()
        })
    });
}

function actualizar_input_obras_sociales() {
    const obras_sociales = document.querySelectorAll(".check_os input[type='checkbox']");
    const nombres = document.getElementById("input-osocial-nombres");
    const indices = document.getElementById("input-osocial");
    const _nombres = [];
    const _indices = [];
    obras_sociales.forEach(chk => {
        if (chk.checked) {
        const li = chk.closest(".check_os");
        _nombres.push(li.dataset.value); 
        _indices.push(chk.value);
        }
    });
    nombres.innerHTML = _nombres.join(", ");
    indices.value = _indices.join(",");
    if(_indices.length == 0) nombres.innerHTML = "Trabaja sin obra social"
}

inputFile.addEventListener('change', () => {
    const file = inputFile.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            retrato.src = e.target.result; // base64
        };
        reader.readAsDataURL(file);
    }
});

cargar_especialidades();
cargar_obras_sociales();
