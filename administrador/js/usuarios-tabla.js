import { validar_usuario } from "../../assets/js/comunes.js";

let usuarios = [];

document.addEventListener("DOMContentLoaded", () => {
  validar_usuario();
  cargar_usuarios_dummy();
});

async function cargar_usuarios_dummy() {
  try {
    const resp = await fetch("https://dummyjson.com/users");
    const data = await resp.json();

    usuarios = data.users.map((u) => ({
      ...u,
      birthDate: u.birthDate ? u.birthDate.split("T")[0] : "",
    }));

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

    const imgSrc =
      user.image || "https://cdn-icons-png.flaticon.com/512/149/149071.png";

    tr.innerHTML = `
      <td>${user.id}</td>
      <td>
        <img 
          src="${imgSrc}" 
          class="rounded border" 
          width="50" 
          height="50"
          onerror="this.onerror=null;this.classList.remove('border');this.src='https://cdn-icons-png.flaticon.com/512/149/149071.png';"
        >
      </td>
      <td>${user.firstName}</td>
      <td>${user.lastName}</td>
      <td>${user.username || "-"}</td>
      <td>${user.email}</td>
      <td>${user.phone || "-"}</td>
      <td>${user.gender || "-"}</td>
      <td>${user.age || "-"}</td>
      <td>${user.birthDate || "-"}</td>
    `;
    tbody.appendChild(tr);
  });
}
