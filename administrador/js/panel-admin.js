import { cargar_data_archivo, validar_usuario } from "../assets/js/comunes.js";
// ======================================
// panel-admin.js
// ======================================

// Inicializa los datos y valida sesión del usuario admin
async function inicializar_vista() {
  try {
    await cargar_data_archivo("data/usuarios.json", "usuarios");
    await cargar_data_archivo("data/medicos.json", "medicos");
    await cargar_data_archivo("data/obras_sociales.json", "obras_sociales");
    await cargar_data_archivo("data/especialidades.json", "especialidades");
    await validar_usuario();
  } catch (error) {
    console.error("Error al inicializar la vista del panel admin:", error);
  }
}

// Ejecutar automáticamente al cargar la página
document.addEventListener("DOMContentLoaded", inicializar_vista);
