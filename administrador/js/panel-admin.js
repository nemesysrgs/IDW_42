import { cargar_data_archivo, validar_usuario } from "../../assets/js/comunes.js";

async function inicializar_vista() {
  cargar_data_archivo("./data/turnos.json", "turnos");
  cargar_data_archivo("./data/medicos.json", "medicos");
  cargar_data_archivo("./data/especialidades.json", "especialidades");
  cargar_data_archivo("./data/obras_sociales.json", "obras_sociales");
  cargar_data_archivo("./data/reservas.json", "reservas");
  validar_usuario();
}

document.addEventListener("DOMContentLoaded", inicializar_vista);
