// frontend/assets/chart-config.js

let donutChart, barChart;

function crearDonutChart(finalizados, enProceso, pendientes) {
  const ctx = document.getElementById("chartDonut").getContext("2d");
  donutChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Finalizados", "En Proceso", "Pendientes"],
      datasets: [{
        data: [finalizados, enProceso, pendientes],
        backgroundColor: ["#28a745", "#ffc107", "#dc3545"],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" },
        tooltip: { callbacks: {
          label: function (ctx) {
            const total = finalizados + enProceso + pendientes;
            const porcentaje = ((ctx.raw / total) * 100).toFixed(1);
            return `${ctx.label}: ${ctx.raw} (${porcentaje}%)`;
          }
        }}
      }
    }
  });
}

function crearBarChart(vuelos) {
  const porUsuario = {};

  vuelos.forEach(v => {
    const user = v.usuario || "Sin Usuario";
    porUsuario[user] = (porUsuario[user] || 0) + parseFloat((v.finalizado || "0").replace('%',''));
  });

  const labels = Object.keys(porUsuario);
  const datos = Object.values(porUsuario);

  const ctx = document.getElementById("chartBar").getContext("2d");
  barChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "% Finalización",
        data: datos,
        backgroundColor: "#007bff"
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: value => value + "%"
          }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: {
          label: (ctx) => `${ctx.raw.toFixed(2)}%`
        }}
      }
    }
  });
}
