/* ═══ TABS ═══ */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.toggle('active', b === btn);
      b.setAttribute('aria-selected', String(b === btn));
    });
    document.querySelectorAll('.tab-pane').forEach(p => {
      p.classList.toggle('active', p.id === target);
    });
  });
});

/* ═══ DESELECTABLE RADIOS ═══ */
const _radioState = {};
document.querySelectorAll('input[type="radio"]').forEach(radio => {
  radio.addEventListener('mousedown', () => {
    _radioState[radio.name] = radio.checked ? radio.value : null;
  });
  radio.addEventListener('click', () => {
    if (_radioState[radio.name] === radio.value) {
      radio.checked = false;
      _radioState[radio.name] = null;
      save();
    }
  });
});

/* ═══ DEFAULT DATE ═══ */
const fechaEl = document.getElementById('fechaDiagnostico');
if (!fechaEl.value) fechaEl.value = new Date().toISOString().split('T')[0];

/* ═══ TOAST ═══ */
function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + (type === 'err' ? 'err' : 'ok');
  setTimeout(() => t.classList.remove('show'), 3000);
}

/* ═══ HELPERS ═══ */
function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}
function getRadio(name) {
  const el = document.querySelector('input[type="radio"][name="' + name + '"]:checked');
  return el ? el.value : '';
}
function getChecked(name) {
  return Array.from(document.querySelectorAll('input[type="checkbox"][name="' + name + '"]:checked'))
    .map(el => el.value).join(', ');
}

/* ═══ COLLECT ALL (for storage) ═══ */
function collectAll() {
  const out = {};
  document.querySelectorAll('#frm input, #frm textarea').forEach(el => {
    if (!el.name) return;
    if (el.type === 'checkbox') {
      if (!Array.isArray(out[el.name])) out[el.name] = [];
      if (el.checked) out[el.name].push(el.value);
    } else if (el.type === 'radio') {
      if (el.checked) out[el.name] = el.value;
    } else {
      out[el.name] = el.value;
    }
  });
  return out;
}

/* ═══ RESTORE FROM STORAGE ═══ */
const KEY = 'diag_capilar_v1';

function restore() {
  let raw;
  try { raw = localStorage.getItem(KEY); } catch(e) { return; }
  if (!raw) return;
  let data;
  try { data = JSON.parse(raw); } catch(e) { return; }

  Object.entries(data).forEach(([name, value]) => {
    if (Array.isArray(value)) {
      document.querySelectorAll('input[type="checkbox"][name="' + name + '"]').forEach(cb => {
        cb.checked = value.includes(cb.value);
      });
    } else if (typeof value === 'string') {
      const radios = document.querySelectorAll('input[type="radio"][name="' + name + '"]');
      if (radios.length) {
        radios.forEach(r => { r.checked = r.value === value; });
      } else {
        const el = document.getElementById(name) || document.querySelector('[name="' + name + '"]');
        if (el && el.type !== 'radio' && el.type !== 'checkbox') el.value = value;
      }
    }
  });
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(collectAll())); } catch(e) {}
}

document.getElementById('frm').addEventListener('input', save);
document.getElementById('frm').addEventListener('change', save);

/* ═══ VALIDATION ═══ */
function validate() {
  let ok = true;
  const nombre = document.getElementById('nombre');
  const errNombre = document.getElementById('err-nombre');
  if (!nombre.value.trim()) {
    nombre.classList.add('error');
    errNombre.classList.add('visible');
    ok = false;
  } else {
    nombre.classList.remove('error');
    errNombre.classList.remove('visible');
  }
  const email = document.getElementById('email');
  const errEmail = document.getElementById('err-email');
  const ev = email.value.trim();
  if (ev && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ev)) {
    email.classList.add('error');
    errEmail.classList.add('visible');
    ok = false;
  } else {
    email.classList.remove('error');
    errEmail.classList.remove('visible');
  }
  return ok;
}

/* ═══ EXCEL EXPORT ═══ */
function exportExcel() {
  if (!validate()) { showToast('Complete los campos obligatorios', 'err'); return; }

  const cantCanas = getRadio('cantidadCanas') === '__custom__'
    ? (getVal('cantidadCanasCustom') + '%')
    : getRadio('cantidadCanas');

  const cliente = {
    'Nombre': getVal('nombre'),
    'Fecha de cumpleaños': getVal('cumpleanos'),
    'Teléfono': getVal('telefono'),
    'Cédula': getVal('cedula'),
    'Correo electrónico': getVal('email'),
    'Ocupación': getVal('ocupacion'),
    'Dirección': getVal('direccion'),
    'Fecha del diagnóstico': getVal('fechaDiagnostico'),
    'Estilista / Alumna': getVal('estilista'),
  };

  const tecnico = {
    'Tipo de rostro': getRadio('tipoRostro'),
    'Longitud del cabello': getRadio('longitudCabello'),
    'Textura del cabello': getRadio('texturaCabello'),
    'Porosidad del cabello': [getChecked('porosidad'), getVal('porosidadOtros')].filter(Boolean).join(' — '),
    'Cantidad de canas': cantCanas,
    'Tipo de cana': getRadio('tipoCana'),
    'Procedimiento': [getChecked('procedimiento'), getVal('procedimientoOtros')].filter(Boolean).join(' — '),
    'Color natural del cabello': getVal('colorNatural'),
    'Color deseado': getVal('colorDeseado'),
    'Técnica a utilizar': getVal('tecnicaUtilizar'),
    'Fórmula del tinte': getVal('formulaTinte'),
    'Fórmula de la decoloración': getVal('formulaDecoloracion'),
    'Matiz de la decoloración': getVal('matizDecoloracion'),
    'Técnica utilizada': getVal('tecnicaUtilizada'),
    'Productos recomendados': getVal('productosRecomendados'),
    'Preparación para canas': getVal('preparacionCanas'),
    'Preparación para baño color': getVal('preparacionBano'),
    'Montaje': getVal('montaje'),
    'Fórmula / Tiempo en raíz': getVal('formulaTiempoRaiz'),
  };

  const capilar = {
    'Historial químico': [getChecked('historialQuimico'), getVal('historialOtro')].filter(Boolean).join(' — '),
    'Último proceso químico': getVal('ultimoProceso'),
    'Frecuencia de proceso': getRadio('frecuencia'),
    'Diagnóstico visual': getChecked('diagnosticoVisual'),
    'Observaciones visuales': getVal('obsVisual'),
    'Nivel de porosidad': getRadio('porosidadNivel'),
    'Método prueba de porosidad': getChecked('porosidadMetodo'),
    'Observaciones de porosidad': getVal('obsPorosidad'),
    'Elasticidad': getRadio('elasticidad'),
    'Interpretación elasticidad': getVal('interpElasticidad'),
    'Estado del cabello': getChecked('estadoCabello'),
    'Nivel de daño': getRadio('nivelDano'),
    'Diagnóstico final': getChecked('diagnosticoFinal'),
    'Cronograma capilar': getVal('cronogramaCapilar'),
    'Semana 1': getVal('semana1'),
    'Semana 2 — H': getVal('s2_h'),
    'Semana 2 — N (1)': getVal('s2_n1'),
    'Semana 2 — R (1)': getVal('s2_r1'),
    'Semana 2 — N (2)': getVal('s2_n2'),
    'Semana 2 — R (2)': getVal('s2_r2'),
    'Semana 2 — R (3)': getVal('s2_r3'),
    'Semana 3 — H': getVal('s3_h'),
    'Semana 3 — N (1)': getVal('s3_n1'),
    'Semana 3 — R (1)': getVal('s3_r1'),
    'Semana 3 — N (2)': getVal('s3_n2'),
    'Semana 3 — R (2)': getVal('s3_r2'),
    'Semana 3 — R (3)': getVal('s3_r3'),
    'Recomendaciones': getChecked('recomendaciones'),
    'Producto 1': getVal('producto1'),
    'Producto 2': getVal('producto2'),
  };

  const toSheet = obj => XLSX.utils.json_to_sheet(
    Object.entries(obj).map(([Campo, Valor]) => ({ Campo, Valor: Valor || '' }))
  );

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, toSheet(cliente),  'Datos Cliente');
  XLSX.utils.book_append_sheet(wb, toSheet(tecnico),  'Diagnóstico Técnico');
  XLSX.utils.book_append_sheet(wb, toSheet(capilar),  'Diagnóstico Capilar');

  const nom = (cliente['Nombre'] || 'cliente').replace(/\s+/g, '_').replace(/[^\wáéíóúÁÉÍÓÚñÑ_]/g, '');
  const fecha = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, 'diagnostico_' + nom + '_' + fecha + '.xlsx');
  showToast('Excel descargado correctamente');
}

/* ═══ BUTTON EVENTS ═══ */
document.getElementById('btnExcel').addEventListener('click', exportExcel);

document.getElementById('btnGuardar').addEventListener('click', () => {
  save();
  showToast('Borrador guardado');
});

document.getElementById('btnLimpiar').addEventListener('click', () => {
  if (!confirm('¿Desea limpiar todo el formulario? Esta acción no se puede deshacer.')) return;
  document.getElementById('frm').reset();
  try { localStorage.removeItem(KEY); } catch(e) {}
  fechaEl.value = new Date().toISOString().split('T')[0];
  showToast('Formulario limpiado');
});

/* ═══ INIT ═══ */
restore();
