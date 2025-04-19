// frontend/assets/login.js

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loginForm");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nombre = document.getElementById("nombre").value.trim();
      const clave = document.getElementById("clave").value;

      try {
        const response = await fetch("http://localhost:3005/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ nombre, clave }),
        });

        const data = await response.json();

        if (!response.ok) {
          alert(data.mensaje || "Error al iniciar sesión");
          return;
        }

        // Guardar el token y los datos del usuario
        localStorage.setItem("token", data.token);
        localStorage.setItem("usuario", JSON.stringify(data.usuario));

        // Redirigir al dashboard
        window.location.href = "index.html";
      } catch (error) {
        console.error("❌ Error en login:", error);
        alert("Error en el servidor");
      }
    });
  });
