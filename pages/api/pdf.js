import PDFDocument from 'pdfkit';

const TOTAL = 211;

const isComplete = (c) =>
  c.name && c.floor && c.model && c.ip && c.switch_name &&
  c.switch_port && c.photo_install_url && c.screenshot_view_url;

const statusOf = (c) => {
  if (isComplete(c)) return 'Complete';
  const n = ['name','floor','model','ip','switch_name','switch_port'].filter(f => c[f]).length
    + (c.photo_install_url ? 1 : 0) + (c.screenshot_view_url ? 1 : 0);
  return n === 0 ? 'Pending' : 'In Progress';
};

// Brand colors
const NAVY   = '#0d1b4b';
const GREEN  = '#00c853';
const BLUE   = '#007FAF';
const GRAY   = '#546e7a';
const LGRAY  = '#eceff1';
const WHITE  = '#ffffff';
const BLACK  = '#030E16';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SB_URL || !SB_KEY) return res.status(500).json({ error: 'Missing env vars' });

  // Fetch cameras
  const dbRes = await fetch(`${SB_URL}/rest/v1/cameras?select=*&order=floor.asc,name.asc`, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
  });
  if (!dbRes.ok) return res.status(500).json({ error: 'Failed to fetch cameras' });
  const cameras = await dbRes.json();

  const done      = cameras.filter(isComplete).length;
  const pct       = Math.round((done / TOTAL) * 100);
  const inProg    = cameras.filter(c => statusOf(c) === 'In Progress').length;
  const pending   = TOTAL - cameras.length + cameras.filter(c => statusOf(c) === 'Pending').length;
  const generated = new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });

  // Build floor summary
  const byFloor = {};
  cameras.forEach(c => {
    const fl = c.floor || 'Unknown';
    if (!byFloor[fl]) byFloor[fl] = { total: 0, done: 0 };
    byFloor[fl].total++;
    if (isComplete(c)) byFloor[fl].done++;
  });

  // ── PDF setup ──────────────────────────────────────────────────────────
  const doc = new PDFDocument({ size: 'LETTER', margin: 0, info: { Title: 'Verkada Camera Deployment Report', Author: 'Verkada Tracker' } });

  const chunks = [];
  doc.on('data', chunk => chunks.push(chunk));
  doc.on('end', () => {
    const pdfBuf = Buffer.concat(chunks);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="verkada-deployment-${new Date().toISOString().slice(0,10)}.pdf"`);
    res.setHeader('Content-Length', pdfBuf.length);
    res.status(200).end(pdfBuf);
  });

  const PW = 612; // letter width pts
  const PH = 792; // letter height pts
  const M  = 40;  // margin

  // ── HELPERS ────────────────────────────────────────────────────────────
  const hex2rgb = (hex) => {
    const h = hex.replace('#','');
    return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
  };
  const fill = (color) => doc.fillColor(hex2rgb(color));
  const stroke = (color) => doc.strokeColor(hex2rgb(color));

  const rect = (x, y, w, h, color) => {
    fill(color);
    doc.rect(x, y, w, h).fill();
  };

  const text = (str, x, y, opts = {}) => doc.text(str, x, y, opts);

  // ── PAGE 1: COVER / SUMMARY ────────────────────────────────────────────
  // Navy header band
  rect(0, 0, PW, 160, NAVY);

  // Verkada wordmark (text-based since we can't easily fetch the SVG)
  fill(WHITE);
  doc.font('Helvetica-Bold').fontSize(28).text('VERKADA', M, 40);
  fill('#00c853');
  doc.fontSize(9).font('Helvetica').text('DEPLOYMENT TRACKER', M, 74, { characterSpacing: 2 });

  // Report title right side
  fill(WHITE);
  doc.font('Helvetica-Bold').fontSize(14).text('Camera Upgrade Project', 0, 44, { align: 'right', width: PW - M });
  fill('rgba(255,255,255,0.6)');
  doc.font('Helvetica').fontSize(9).text(`Verkada Security System Deployment`, 0, 64, { align: 'right', width: PW - M });
  doc.fontSize(9).text(`Generated ${generated}`, 0, 78, { align: 'right', width: PW - M });

  // Green accent bar
  rect(0, 160, PW, 5, GREEN);

  // ── Big progress arc / stat block ──────────────────────────────────────
  const statY = 185;

  // Overall pct — big number
  fill(NAVY);
  doc.font('Helvetica-Bold').fontSize(64).text(`${pct}%`, M, statY);
  fill(GRAY);
  doc.font('Helvetica').fontSize(11).text('overall completion', M, statY + 68);
  doc.fontSize(9).text(`${done} of ${TOTAL} cameras fully documented`, M, statY + 83);

  // Progress bar
  const barX = M, barY = statY + 105, barW = 260, barH = 10;
  rect(barX, barY, barW, barH, LGRAY);
  rect(barX, barY, Math.round(barW * pct / 100), barH, GREEN);
  // rounded cap on bar
  doc.roundedRect(barX, barY, barW, barH, 5).clip();
  doc.initForm(); // reset clip

  // Stat cards (right side)
  const cardX = 340;
  const cards = [
    { label: 'COMPLETE',     value: done,    color: GREEN },
    { label: 'IN PROGRESS',  value: inProg,  color: '#ffab00' },
    { label: 'NOT STARTED',  value: Math.max(0, pending), color: '#ef5350' },
    { label: 'TOTAL CAMERAS',value: TOTAL,   color: BLUE },
  ];
  cards.forEach((card, i) => {
    const cx = cardX + (i % 2) * 130;
    const cy = statY + Math.floor(i / 2) * 70;
    rect(cx, cy, 120, 58, LGRAY);
    const [r,g,b] = hex2rgb(card.color);
    doc.fillColor([r,g,b]).font('Helvetica-Bold').fontSize(28).text(String(card.value), cx + 10, cy + 6);
    fill(GRAY);
    doc.font('Helvetica').fontSize(7).text(card.label, cx + 10, cy + 40, { characterSpacing: 0.5 });
  });

  // ── Floor breakdown table ───────────────────────────────────────────────
  const tableY = statY + 170;
  fill(NAVY);
  doc.font('Helvetica-Bold').fontSize(10).text('PROGRESS BY FLOOR', M, tableY, { characterSpacing: 1 });

  // Green underline
  rect(M, tableY + 14, 160, 2, GREEN);

  const FLOORS_ORDER = ['Exterior','1','2','3','4','5','6','7','8','9','10','11','12','14','15','16','17','18','19','Roof'];
  const floorEntries = Object.entries(byFloor).sort((a, b) => {
    const ai = FLOORS_ORDER.indexOf(a[0]), bi = FLOORS_ORDER.indexOf(b[0]);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  const colW = (PW - M * 2 - 20) / 3;
  let col = 0, row = 0;
  floorEntries.forEach(([floor, { total, done: fd }]) => {
    const fp = Math.round(fd / total * 100);
    const fx = M + col * (colW + 10);
    const fy = tableY + 26 + row * 38;

    rect(fx, fy, colW, 30, LGRAY);

    fill(NAVY);
    doc.font('Helvetica-Bold').fontSize(9).text(
      floor === 'Exterior' ? 'Exterior' : `Floor ${floor}`,
      fx + 8, fy + 4
    );

    fill(GRAY);
    doc.font('Helvetica').fontSize(8).text(`${fd}/${total}`, fx + 8, fy + 16);

    // Mini progress bar
    rect(fx + colW - 54, fy + 8, 44, 5, '#cfd8dc');
    const barFill = fp === 100 ? GREEN : fp > 0 ? BLUE : '#cfd8dc';
    rect(fx + colW - 54, fy + 8, Math.round(44 * fp / 100), 5, barFill);

    // Pct label
    fill(fp === 100 ? GREEN : GRAY);
    doc.font('Helvetica-Bold').fontSize(7).text(`${fp}%`, fx + colW - 54 + 46, fy + 6);

    col++;
    if (col >= 3) { col = 0; row++; }
  });

  // ── PAGE 2+: CAMERA TABLE ───────────────────────────────────────────────
  doc.addPage({ size: 'LETTER', margin: 0 });

  // Header band (smaller on data pages)
  rect(0, 0, PW, 44, NAVY);
  fill(WHITE);
  doc.font('Helvetica-Bold').fontSize(13).text('VERKADA', M, 14);
  fill('#00c853');
  doc.font('Helvetica').fontSize(7).text('DEPLOYMENT TRACKER', M, 30, { characterSpacing: 1.5 });
  fill(WHITE);
  doc.font('Helvetica').fontSize(9).text('Camera Installation Details', 0, 18, { align: 'right', width: PW - M });
  rect(0, 44, PW, 3, GREEN);

  // Column definitions
  // trunc: hard-truncate a string to fit column width at font size 7
  // PDFKit Helvetica at size 7 ≈ 4.0 pts per char (safe conservative estimate)
  const trunc = (str, colW, pad = 8) => {
    const maxChars = Math.floor((colW - pad) / 4.0);
    if (!str) return '—';
    return str.length > maxChars ? str.slice(0, maxChars - 1) + '…' : str;
  };

  const COLS = [
    { label: 'Camera Name',   key: 'name',          w: 118 },
    { label: 'Floor',         key: 'floor',         w: 38  },
    { label: 'Model',         key: 'model',         w: 52  },
    { label: 'Serial #',      key: 'serial_number', w: 72  },
    { label: 'IP Address',    key: 'ip',            w: 75  },
    { label: 'Switch',        key: 'switch_name',   w: 68  },
    { label: 'Port',          key: 'switch_port',   w: 46  },
    { label: 'Notes',         key: 'notes',         w: 80  },
    { label: 'Status',        key: '_status',       w: 55  },
  ];
  const totalColW = COLS.reduce((s, c) => s + c.w, 0);
  const tableXStart = (PW - totalColW) / 2;

  const drawTableHeader = (yPos) => {
    let cx = tableXStart;
    rect(0, yPos, PW, 18, NAVY);
    COLS.forEach(col => {
      fill(WHITE);
      doc.font('Helvetica-Bold').fontSize(7)
        .text(col.label.toUpperCase(), cx + 4, yPos + 5, { width: col.w - 6, ellipsis: true });
      cx += col.w;
    });
    return yPos + 18;
  };

  let curY = drawTableHeader(52);
  let pageNum = 2;

  const addPageFooter = () => {
    fill(LGRAY);
    doc.rect(0, PH - 24, PW, 24).fill();
    fill(GRAY);
    doc.font('Helvetica').fontSize(7)
      .text(`Verkada Camera Deployment Report · Generated ${generated}`, M, PH - 15)
      .text(`Page ${pageNum}`, 0, PH - 15, { align: 'right', width: PW - M });
    pageNum++;
  };

  const ROW_H = 16;
  cameras.forEach((cam, i) => {
    // New page if needed
    if (curY + ROW_H > PH - 30) {
      addPageFooter();
      doc.addPage({ size: 'LETTER', margin: 0 });
      rect(0, 0, PW, 44, NAVY);
      fill(WHITE);
      doc.font('Helvetica-Bold').fontSize(13).text('VERKADA', M, 14);
      fill('#00c853');
      doc.font('Helvetica').fontSize(7).text('DEPLOYMENT TRACKER', M, 30, { characterSpacing: 1.5 });
      fill(WHITE);
      doc.font('Helvetica').fontSize(9).text('Camera Installation Details (continued)', 0, 18, { align: 'right', width: PW - M });
      rect(0, 44, PW, 3, GREEN);
      curY = drawTableHeader(52);
    }

    // Row background
    const rowBg = i % 2 === 0 ? WHITE : '#f5f7fa';
    rect(0, curY, PW, ROW_H, rowBg);

    // Status-based left accent
    const st = statusOf(cam);
    const accentCol = st === 'Complete' ? GREEN : st === 'In Progress' ? '#ffab00' : '#cfd8dc';
    rect(tableXStart, curY, 3, ROW_H, accentCol);

    // Cell values — use trunc() to hard-clip text before handing to PDFKit
    // so no wrapping or line-break issues can occur
    let cx = tableXStart;
    COLS.forEach(col => {
      let raw = '';
      if (col.key === '_status') {
        raw = st;
      } else {
        raw = cam[col.key] || '';
      }

      const val = trunc(raw, col.w);

      // Color + font
      if (col.key === '_status') {
        fill(st === 'Complete' ? GREEN : st === 'In Progress' ? '#f57f17' : GRAY);
        doc.font('Helvetica-Bold');
      } else if (col.key === 'name') {
        fill(BLACK);
        doc.font('Helvetica-Bold');
      } else if (col.key === 'notes') {
        fill(GRAY);
        doc.font('Helvetica');
      } else {
        fill(GRAY);
        doc.font('Helvetica');
      }

      // lineBreak:false + explicit single-line height ensures no overflow
      doc.fontSize(7).text(val, cx + 4, curY + 4, {
        width: col.w - 6,
        height: ROW_H - 6,
        lineBreak: false,
        ellipsis: false,   // we already truncated manually
      });
      cx += col.w;
    });

    // Bottom border
    stroke('#e0e4e8');
    doc.moveTo(tableXStart, curY + ROW_H).lineTo(tableXStart + totalColW, curY + ROW_H).stroke();

    curY += ROW_H;
  });

  addPageFooter();
  doc.end();
}
