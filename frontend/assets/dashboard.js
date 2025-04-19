// assets/dashboard.js

// DOM References
const body        = document.body;
const themeToggle = document.getElementById('themeToggle');
const loader      = document.getElementById('loader');
const tablaEl     = $('#tablaVuelos');

// Persisted Settings
const dateFormatKey = localStorage.getItem('dateFormat') || 'DD/MM/YYYY';
const pageLengthKey = parseInt(localStorage.getItem('pageLength') || '10', 10);

// Show/Hide Loader
const showLoader = () => loader.style.display = 'flex';
const hideLoader = () => loader.style.display = 'none';

// Socket.IO (global `io` from socket.io.min.js)
const socket = io('http://localhost:3005');

document.addEventListener('DOMContentLoaded', async () => {
  // 0) Theme Persistence
  const savedTheme = localStorage.getItem('theme') || 'light';
  body.classList.add(`theme-${savedTheme}`);
  const themeIcon = themeToggle.querySelector('i');
  if (savedTheme === 'dark') themeIcon.classList.replace('fa-moon', 'fa-sun');

  // 1) Toggle Light/Dark Mode
  themeToggle.addEventListener('click', () => {
    const isDark = body.classList.toggle('theme-dark');
    body.classList.toggle('theme-light');
    themeIcon.classList.toggle('fa-moon');
    themeIcon.classList.toggle('fa-sun');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });

  // 2) Authentication & Initial Fetch
  const token   = localStorage.getItem('token');
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }
  document.getElementById('userNameDisplay').textContent = `👤 ${usuario.nombre} (${usuario.rol})`;

  showLoader();
  let vuelos = [];
  try {
    const res = await fetch('http://localhost:3005/api/vuelos', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Fetch error');
    vuelos = await res.json();
  } catch (err) {
    Swal.fire('Error', 'No se pudo obtener los vuelos.', 'error');
    hideLoader();
    return;
  }

  // 3) DataTable Setup with inline editing
  const dt = tablaEl.DataTable({
    data: vuelos,
    language: {
      emptyTable:   "No hay datos disponibles",
      info:         "Mostrando _START_ a _END_ de _TOTAL_ vuelos",
      infoEmpty:    "Mostrando 0 a 0 de 0 vuelos",
      lengthMenu:   "Mostrar _MENU_ vuelos",
      loadingRecords: "Cargando...",
      processing:   "Procesando...",
      search:       "Buscar:",
      zeroRecords:  "No se encontraron coincidencias",
      paginate: {
        first:    "Primera",
        last:     "Última",
        next:     "Siguiente",
        previous: "Anterior"
      }
    },
    pageLength: pageLengthKey,
    lengthMenu: [10, 25, 50, 100],
    dom: 'Bfrtip',
    buttons: [
      { extend: 'excelHtml5', text: '<i class="fas fa-file-excel"></i> Excel' },
      { extend: 'csvHtml5',   text: '<i class="fas fa-file-csv"></i> CSV'   },
      { text: '<i class="fas fa-file-pdf"></i> PDF', action: exportPDF }
    ],
    responsive: true,
    scrollX: true,
    rowId: 'id',
    columns: [
      { data: 'vuelo' },
      { data: 'lotes' },
      { data: 'porcentaje', className: 'editable' },
      { data: 'total_has' },
      { data: 'usuario' },
      { data: 'tipo_proceso' },
      { data: 'checkprocess' },
      { data: 'procesados' },
      { data: 'finalizado', className: 'editable' },
      { data: 'und' },
      { data: 'pendientes' },
      { data: 'pendiente' },
      {
        data: 'estado',
        className: 'editable',
        render: function (data) {
          const estado = data?.toUpperCase() || '';
          let clase = 'estado-default';
          if (estado.includes('FINALIZADO')) clase = 'estado-finalizado';
          else if (estado.includes('PENDIENTE')) clase = 'estado-pendiente';
          else if (estado.includes('PROCESO')) clase = 'estado-proceso';
          return `<span class="estado-label ${clase}">${estado}</span>`;
        }
      },
      {
        data: null,
        orderable: false,
        render: () =>
          usuario.rol === 'administrador'
            ? `<button class='btn-delete'><i class='fas fa-trash-alt'></i></button>`
            : '-'
      }
    ],
    initComplete: () => {
      hideLoader();
      enableInlineEditing();
    },
    createdRow: function (row, data) {
      const estado = (data.estado || '').toUpperCase();

      if (estado.includes('FINALIZADO')) {
        $(row).addClass('fila-finalizado');
      } else if (estado.includes('PROCESO')) {
        $(row).addClass('fila-proceso');
      } else if (estado.includes('PENDIENTE')) {
        $(row).addClass('fila-pendiente');
      }
    }
  });

  // Inline editing handler
  function enableInlineEditing() {
    const opciones = {
      estado: ['EN PROCESO', 'FINALIZADO', 'PENDIENTE CURVAS', 'PENDIENTE CLASIFICACION'],
      tipo_proceso: ['CLASIFICACION', 'POR PROCESAR'],
      checkprocess: ['OK', 'PENDING']
    };

    const getClassFromValue = (campo, valor) => {
      const v = valor.toUpperCase();
      if (campo === 'estado') {
        if (v.includes('FINALIZADO')) return 'select-finalizado';
        if (v.includes('PENDIENTE')) return 'select-pendiente';
        if (v.includes('PROCESO')) return 'select-proceso';
      }
      if (campo === 'tipo_proceso' && v.includes('CLASIFICACION')) return 'select-clasificacion';
      if (campo === 'checkprocess' && v === 'OK') return 'select-ok';
      if (campo === 'checkprocess' && v === 'PENDING') return 'select-pending';
      return '';
    };

    tablaEl.find('tbody').on('click', 'td.editable', function () {
      if (usuario.rol !== 'administrador') return;

      const cell = dt.cell(this);
      const oldVal = cell.data();
      const col = dt.column(this).dataSrc();
      const $td = $(this);
      const rowData = dt.row(this.closest('tr')).data();

      if (opciones[col]) {
        const className = getClassFromValue(col, oldVal);
        const select = $(`<select class="select-editable ${className}">`);

        opciones[col].forEach(opt => {
          const icon = col === 'estado' ? (opt.includes('FINALIZADO') ? '✅' :
                                           opt.includes('PENDIENTE') ? '⏳' :
                                           opt.includes('PROCESO') ? '🔄' : '📝')
                      : col === 'tipo_proceso' ? '📋'
                      : col === 'checkprocess' && opt === 'OK' ? '✅' : '🕓';

          select.append($('<option>', {
            value: opt,
            text: `${icon} ${opt}`,
            selected: opt === oldVal
          }));
        });

        $td.html(select);
        select.focus();

        select.on('change blur', async function () {
          const newVal = $(this).val();
          if (newVal === oldVal) {
            $td.text(oldVal);
            return;
          }

          try {
            const payload = { [col]: newVal };
            const res = await fetch(`http://localhost:3005/api/vuelos/${rowData.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Update failed');

            cell.data(newVal).draw();
            toastr.success('✅ Campo actualizado');
            socket.emit('vuelo_editado', { id: rowData.id, campo: col, valor: newVal });

          } catch (err) {
            toastr.error('❌ Error al guardar');
            cell.data(oldVal).draw();
          }
        });

      } else {
        $td.attr('contenteditable', true).focus();

        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(this);
        sel.removeAllRanges();
        sel.addRange(range);

        $td.off('blur').on('blur', async () => {
          const newVal = $td.text().trim();
          $td.removeAttr('contenteditable');

          if (newVal === oldVal) return;

          try {
            const payload = { [col]: newVal };
            const res = await fetch(`http://localhost:3005/api/vuelos/${rowData.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Update failed');

            cell.data(newVal).draw();
            toastr.success('✅ Campo actualizado');
            socket.emit('vuelo_editado', { id: rowData.id, campo: col, valor: newVal });

          } catch (err) {
            toastr.error('❌ Error al guardar');
            cell.data(oldVal).draw();
          }
        });
      }
    });
  }


  // 4) Charts Setup
  const ctxAvance = document.getElementById('chartAvance').getContext('2d');
  const ctxComp   = document.getElementById('chartComparativa').getContext('2d');
  let chartAvance = null, chartComp = null;

  function updateCharts(data) {
    // prepare labels per dateFormatKey
    const agg = data.reduce((acc, v) => {
      const d  = new Date(v.fecha);
      const dd = String(d.getDate()).padStart(2,'0');
      const mm = String(d.getMonth()+1).padStart(2,'0');
      const yyyy = d.getFullYear();
      const lbl = dateFormatKey==='DD/MM/YYYY' ? `${dd}/${mm}/${yyyy}` : `${mm}/${dd}/${yyyy}`;
      acc[lbl] = (acc[lbl]||0) + (parseFloat(v.finalizado)||0);
      return acc;
    }, {});
    const labels = Object.keys(agg), vals = Object.values(agg);

    const opts = {
      maintainAspectRatio: false,
      plugins: {
        legend: { labels:{ font:{size:14}, padding:20 } },
        tooltip:{ padding:10, titleFont:{size:14,weight:'600'}, bodyFont:{size:13}, cornerRadius:6 }
      },
      scales:{ x:{ ticks:{font:{size:12},color:getComputedStyle(document.documentElement).getPropertyValue('--text-dark')}, grid:{display:false} },
               y:{ ticks:{font:{size:12},color:getComputedStyle(document.documentElement).getPropertyValue('--text-dark')}, grid:{color:'#ddd',borderDash:[4,4]} } }
    };

    // Line chart
    if (chartAvance) {
      chartAvance.data  = { labels, datasets:[{ label:'Avance diario', data:vals, borderColor:getComputedStyle(document.documentElement).getPropertyValue('--primary'), backgroundColor:getComputedStyle(document.documentElement).getPropertyValue('--primary')+'33', tension:0.3, pointRadius:4, pointBackgroundColor:getComputedStyle(document.documentElement).getPropertyValue('--primary'), pointHoverRadius:6 }] };
      chartAvance.options= {...opts,layout:{padding:15}};
      chartAvance.update();
    } else {
      chartAvance = new Chart(ctxAvance, { type:'line', data:{labels,datasets:[{ label:'Avance diario', data:vals, borderColor:getComputedStyle(document.documentElement).getPropertyValue('--primary'), backgroundColor:getComputedStyle(document.documentElement).getPropertyValue('--primary')+'33', tension:0.3, pointRadius:4, pointBackgroundColor:getComputedStyle(document.documentElement).getPropertyValue('--primary'), pointHoverRadius:6 }]}, options:{...opts,layout:{padding:15}} });
    }

    // Doughnut
    const fin = data.filter(v=>v.estado==='FINALIZADO').length;
    const pen = data.filter(v=>v.estado.includes('PENDIENTE')).length;
    if (chartComp) {
      chartComp.data  = { labels:['Finalizados','Pendientes'], datasets:[{ data:[fin,pen], backgroundColor:[ getComputedStyle(document.documentElement).getPropertyValue('--primary'), getComputedStyle(document.documentElement).getPropertyValue('--danger') ], hoverOffset:10 }]};
      chartComp.options= {...opts,cutout:'65%',plugins:{...opts.plugins,legend:{position:'top'}}}; chartComp.update();
    } else {
      chartComp = new Chart(ctxComp,{ type:'doughnut', data:{ labels:['Finalizados','Pendientes'], datasets:[{ data:[fin,pen], backgroundColor:[ getComputedStyle(document.documentElement).getPropertyValue('--primary'), getComputedStyle(document.documentElement).getPropertyValue('--danger') ], hoverOffset:10 }]}, options:{...opts,cutout:'65%',layout:{padding:15},plugins:{...opts.plugins,legend:{position:'top'}}} });
    }
  }

  // 5) Update KPIs & UI
  const updateUI = data => {
    const total = data.length;
    const fin   = data.filter(v=>v.estado==='FINALIZADO').length;
    const proc  = data.filter(v=>v.estado==='EN PROCESO').length;
    const pen   = data.filter(v=>v.estado.includes('PENDIENTE')).length;
    const avg   = total?data.reduce((s,v)=>s+(parseFloat(v.finalizado)||0),0)/total:0;
    document.querySelector('#totalVuelos strong').textContent=total;
    document.querySelector('#finalizados strong').textContent=fin;
    document.querySelector('#enProceso strong').textContent=proc;
    document.querySelector('#pendientes strong').textContent=pen;
    document.querySelector('#avanceGlobal strong').textContent=`${avg.toFixed(2)}%`;
    updateCharts(data);
  };

  // 6) Filtering logic
  function filtrar() {
    showLoader();
    const selU=document.getElementById('filtroUsuario').value;
    const selT=document.getElementById('filtroTipoProceso').value;
    const selC=document.getElementById('filtroCheck').value;
    const selE=document.getElementById('filtroEstado').value;
    const from=document.getElementById('fechaDesde').value;
    const to  =document.getElementById('fechaHasta').value;
    const res=vuelos.filter(v=>
      (selU==='Todos'||v.usuario===selU)&&
      (selT==='Todos'||v.tipo_proceso===selT)&&
      (selC==='Todos'||v.checkprocess===selC)&&
      (selE==='Todos'||v.estado===selE)&&
      (!from||new Date(v.fecha)>=new Date(from))&&
      (!to  ||new Date(v.fecha)<=new Date(to))
    );
    dt.clear().rows.add(res).draw(); updateUI(res); hideLoader();
  }

  // 7) Populate filters
  ['Usuario','TipoProceso','Check','Estado'].forEach(f=>{
    const sel=document.getElementById(`filtro${f}`);
    sel.innerHTML='<option value="Todos">Todos</option>';
    Array.from(new Set(vuelos.map(v=>v[f.toLowerCase()]||''))).sort().forEach(val=>{
      const o=document.createElement('option');o.value=val;o.text=val;sel.append(o);
    });
    $(sel).select2({ width:'100%' }).on('change',filtrar);
  });
  ['fechaDesde','fechaHasta'].forEach(id=>document.getElementById(id).addEventListener('change',filtrar));
  document.getElementById('limpiarFiltros').addEventListener('click',()=>{document.querySelectorAll('.filters select, .filters input').forEach(el=>el.value='');$('.filters select').trigger('change');filtrar();});

  // 8) Inline delete
  tablaEl.on('click','.btn-delete',async function(){const row=dt.row($(this).parents('tr'));const data=row.data();const {isConfirmed}=await Swal.fire({title:'Eliminar vuelo?',icon:'warning',showCancelButton:true});if(isConfirmed){await fetch(`http://localhost:3005/api/vuelos/${data.id}`,{method:'DELETE',headers:{Authorization:`Bearer ${token}`}});row.remove().draw();toastr.success('Vuelo eliminado');}});

  // 9) Real-time updates
  socket.on('vuelo_updated',updated=>{vuelos=updated;filtrar();toastr.info('Datos actualizados en tiempo real');});

  // Initial draw
  filtrar();
});

// 10) Export to PDF
function exportPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
    doc.text('Reporte de Vuelos', 14, 16);
  doc.autoTable({
    html: '#tablaVuelos',
    startY: 20,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [44, 62, 80] },
    theme: 'striped'
  });
  doc.save('reporte_vuelos.pdf');
}

// 11) Logout
function cerrarSesion(){localStorage.clear();window.location.href='login.html';}

// Tooltip visual al pasar el mouse por cada fila
const tooltip = document.createElement('div');
tooltip.className = 'row-tooltip';
document.body.appendChild(tooltip);

tablaEl.on('mouseenter', 'tbody tr', function () {
  const data = dt.row(this).data();
  tooltip.innerHTML = `
    <strong>🧑 Usuario:</strong> ${data.usuario || 'No asignado'}<br>
    <strong>✅ % Finalizado:</strong> ${data.finalizado || '0%'}<br>
    <strong>📦 Lotes:</strong> ${data.lotes}<br>
    <strong>📌 Estado:</strong> ${data.estado}
  `;
  tooltip.style.opacity = '1';

  $(this).on('mousemove.tooltip', function (e) {
    tooltip.style.top = (e.pageY + 15) + 'px';
    tooltip.style.left = (e.pageX + 15) + 'px';
  });
});

tablaEl.on('mouseleave', 'tbody tr', function () {
  tooltip.style.opacity = '0';
  $(this).off('mousemove.tooltip');
});
