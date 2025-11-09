let usuarios = [];
let modalUsuario, modalEliminar;
let modoEdicion = false;
let idAEliminar = null;

document.addEventListener("DOMContentLoaded", () => {
  modalUsuario = new bootstrap.Modal(document.getElementById("modalUsuario"));
  modalEliminar = new bootstrap.Modal(document.getElementById("modalEliminar"));

  // Evita que se escriban letras en el teléfono
  document.getElementById("phone").addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/[^0-9+\-()\s]/g, "");
  });

  document
    .getElementById("btn-agregar")
    .addEventListener("click", abrir_modal_agregar);
  document
    .getElementById("btnGuardar")
    .addEventListener("click", guardar_usuario);
  document
    .getElementById("btnConfirmarEliminar")
    .addEventListener("click", confirmar_eliminar);

  validar_usuario();
  cargar_usuarios_dummy();
});

async function cargar_usuarios_dummy() {
  try {
    const resp = await fetch("https://dummyjson.com/users");
    const data = await resp.json();

    usuarios = data.users
      .map((u) => ({
        ...u,
        birthDate: u.birthDate ? u.birthDate.split("T")[0] : "",
      }))
      .filter((u) => u.role === "user");

    mostrar_usuarios();
  } catch (error) {
    console.error("Error cargando usuarios:", error);
  }
}

function mostrar_usuarios() {
  const tbody = document.querySelector("#tabla_usuarios tbody");
  tbody.innerHTML = "";

  usuarios.forEach((user) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${user.id}</td>
      <td><img src="${user.image}" class="rounded" width="50" height="50"></td>
      <td>${user.firstName}</td>
      <td>${user.lastName}</td>
      <td>${user.email}</td>
      <td>${user.phone || "-"}</td>
      <td>${user.age || "-"}</td>
      <td>${user.gender || "-"}</td>
      <td>${user.birthDate || "-"}</td>
      <td class="text-center">
        <button class="btn btn-sm btn-primary me-1" onclick="abrir_modal_editar(${
          user.id
        })">Editar</button>
        <button class="btn btn-sm btn-outline-danger btn-eliminar" onclick="abrir_modal_eliminar(${
          user.id
        })">Eliminar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function abrir_modal_agregar() {
  modoEdicion = false;
  document.getElementById("formUsuario").reset();
  document.getElementById("userId").value = "";
  document.getElementById("modalUsuarioLabel").textContent = "Agregar Usuario";
  document.getElementById("alertaValidacion").classList.add("d-none");
  modalUsuario.show();
}

function abrir_modal_editar(id) {
  modoEdicion = true;
  const user = usuarios.find((u) => u.id === id);
  if (!user) return;

  document.getElementById("userId").value = user.id;
  document.getElementById("image").value = user.image || "";
  document.getElementById("firstName").value = user.firstName || "";
  document.getElementById("lastName").value = user.lastName || "";
  document.getElementById("email").value = user.email || "";
  document.getElementById("phone").value = user.phone || "";
  document.getElementById("age").value = user.age || "";
  document.getElementById("gender").value = user.gender || "";

  // 🧩 Normaliza la fecha (YYYY-MM-DD)
  let fechaFormateada = "";
  if (user.birthDate) {
    const partes = user.birthDate.split("-");
    if (partes.length === 3) {
      const [y, m, d] = partes;
      fechaFormateada = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
  }
  document.getElementById("birthDate").value = fechaFormateada;

  document.getElementById("modalUsuarioLabel").textContent = "Editar Usuario";
  document.getElementById("alertaValidacion").classList.add("d-none");
  modalUsuario.show();
}

function guardar_usuario() {
  const id = parseInt(document.getElementById("userId").value);
  const image = document.getElementById("image").value.trim();
  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const age = document.getElementById("age").value.trim();
  const gender = document.getElementById("gender").value;
  const birthDate = document.getElementById("birthDate").value;

  const alerta = document.getElementById("alertaValidacion");
  const alertaTexto = document.getElementById("alertaTexto");

  alerta.classList.add("d-none");
  alertaTexto.innerHTML = "";

  let errores = [];

  // 📋 Validaciones obligatorias
  if (!firstName) errores.push("El nombre es obligatorio.");
  if (!lastName) errores.push("El apellido es obligatorio.");
  if (!email) errores.push("El email es obligatorio.");
  if (!phone) errores.push("El teléfono es obligatorio.");
  if (!age) errores.push("La edad es obligatoria.");
  if (!gender) errores.push("El género es obligatorio.");
  if (!birthDate) errores.push("La fecha de nacimiento es obligatoria.");

  // 📧 Validación email
  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !regexEmail.test(email)) errores.push("El email no es válido.");

  // 📞 Validación teléfono
  const regexTelefono = /^[0-9+\-()\s]*$/;
  if (phone && !regexTelefono.test(phone))
    errores.push("El teléfono contiene caracteres inválidos.");

  // 🔢 Validación edad
  if (age && (isNaN(age) || age < 0))
    errores.push("La edad debe ser un número válido mayor o igual a 0.");

  // ⚠️ Mostrar alerta si hay errores
  if (errores.length > 0) {
    alertaTexto.innerHTML =
      "<strong>Revisa los campos:</strong><br>• " + errores.join("<br>• ");
    alerta.classList.remove("d-none");
    return;
  }

  const ageNum = age ? parseInt(age) : null;

  if (modoEdicion) {
    const user = usuarios.find((u) => u.id === id);
    if (user) {
      Object.assign(user, {
        image,
        firstName,
        lastName,
        email,
        phone,
        age: ageNum,
        gender,
        birthDate,
      });
    }
  } else {
    const nuevo_id = usuarios.length
      ? Math.max(...usuarios.map((u) => u.id)) + 1
      : 1;

    usuarios.push({
      id: nuevo_id,
      image: image || "https://dummyjson.com/icon/default/128",
      firstName,
      lastName,
      email,
      phone,
      age: ageNum,
      gender,
      birthDate,
      role: "user",
    });
  }

  mostrar_usuarios();
  mostrar_toast(
    modoEdicion
      ? "Usuario actualizado correctamente"
      : "Usuario agregado correctamente",
    "success"
  );
  modalUsuario.hide();
}

function abrir_modal_eliminar(id) {
  idAEliminar = id;
  modalEliminar.show();
}

function confirmar_eliminar() {
  usuarios = usuarios.filter((u) => u.id !== idAEliminar);
  mostrar_usuarios();
  mostrar_toast("Usuario eliminado correctamente", "danger");
  modalEliminar.hide();
}

function mostrar_toast(mensaje, tipo = "success") {
  const toastEl = document.getElementById("toastNotificacion");
  const toastBody = document.getElementById("toastMensaje");

  toastBody.textContent = mensaje;

  // Cambia color según tipo
  toastEl.className = `toast align-items-center text-bg-${tipo} border-0`;

  // ⏱️ Duración del toast: 3000ms = 3 segundos
  const toast = new bootstrap.Toast(toastEl, { delay: 3500 });
  toast.show();
}
