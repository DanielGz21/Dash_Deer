function tokenExpirado(token) {
  try {
    const [, payloadBase64] = token.split('.');
    const payload = JSON.parse(atob(payloadBase64));
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}
document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  document.getElementById("userNameDisplay").textContent = `👤 ${usuario.nombre} (${usuario.rol})`;

  if (!token || tokenExpirado(token)) {
    console.warn("Token inválido o expirado.");
    window.location.href = "login.html";
    return;
  }

  try {
    const response = await fetch("http://localhost:3005/api/vuelos", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.warn("⚠️ Sesión inválida, redirigiendo...");
        window.location.href = "login.html"; // redirige sin mostrar alerta
      }
      return;
    }

    const vuelos = await response.json();
    console.log("🛬 Vuelos recibidos:", vuelos);

    if (!Array.isArray(vuelos)) {
      console.error("❌ Los datos de vuelos no son válidos:", vuelos);
      return;
    }

    // KPIs
    const total = vuelos.length;
    const finalizados = vuelos.filter(v => v.estado === "FINALIZADO").length;
    const enProceso = vuelos.filter(v => v.estado === "EN PROCESO").length;
    const pendientes = vuelos.filter(v => v.estado.includes("PENDIENTE")).length;
    const avance = total > 0
      ? vuelos.reduce((s, v) => s + (parseFloat(v.finalizado?.replace('%', '') || 0)), 0) / total
      : 0;

    document.getElementById("totalVuelos").querySelector("strong").textContent = total;
    document.getElementById("finalizados").querySelector("strong").textContent = finalizados;
    document.getElementById("enProceso").querySelector("strong").textContent = enProceso;
    document.getElementById("pendientes").querySelector("strong").textContent = pendientes;
    document.getElementById("avanceGlobal").querySelector("strong").textContent = `${avance.toFixed(2)}%`;

    // Chart.js
    crearDonutChart(finalizados, enProceso, pendientes);
    crearBarChart(vuelos);

    // Tabla con DataTables
    const tbody = document.querySelector("#tablaVuelos tbody");
    vuelos.forEach(v => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${v.vuelo}</td><td>${v.lotes}</td><td>${v.porcentaje}</td><td>${v.total_has}</td>
        <td>${v.usuario}</td><td>${v.tipo_proceso}</td><td>${v.checkprocess}</td>
        <td>${v.procesados}</td><td>${v.finalizado}</td><td>${v.und}</td>
        <td>${v.pendientes}</td><td>${v.pendiente}</td><td>${v.estado}</td>
        <td>${usuario.rol === "administrador" ? "<button class='btn-delete'>🗑</button>" : "-"}</td>
      `;
      tbody.appendChild(tr);
    });

    $('#tablaVuelos').DataTable({
      dom: 'Bfrtip',
      buttons: ['excelHtml5', 'csvHtml5'],
      responsive: true,
      scrollX: true,
    });

    // Eventos de eliminar vuelo
    document.querySelectorAll(".btn-delete").forEach((btn, i) => {
      btn.addEventListener("click", async () => {
        const vuelo = vuelos[i];
        if (confirm(`¿Eliminar vuelo ${vuelo.vuelo}?`)) {
          await fetch(`http://localhost:3005/api/vuelos/${vuelo.id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          location.reload();
        }
      });
    });
  } catch (error) {
    console.error("❌ Error general:", error);
  }
});

function cerrarSesion() {
  localStorage.clear();
  window.location.href = "login.html";
}
