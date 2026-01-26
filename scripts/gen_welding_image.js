const { registerFont, createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

// Output path
const OUT_PATH = path.join(__dirname, '../assets/welding_ad_cover.jpg');
const SRC_IMAGE = path.join(__dirname, '../assets/welding_drawing.png');

async function generate() {
  // 1. Setup Canvas (1080x1080 for Facebook Feed)
  const width = 1080;
  const height = 1080;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // 2. Fill Background (White)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // 3. Load and Draw Engineering Drawing (Faded as background)
  if (fs.existsSync(SRC_IMAGE)) {
    const img = await loadImage(SRC_IMAGE);
    // Draw image to fill height, center horizontally
    const scale = height / img.height;
    const drawWidth = img.width * scale;
    const drawX = (width - drawWidth) / 2;
    
    ctx.globalAlpha = 0.15; // Fade it out
    ctx.drawImage(img, drawX, 0, drawWidth, height);
    ctx.globalAlpha = 1.0; // Reset alpha
  } else {
    console.warn('Source image not found, using plain background');
  }

  // 4. Header Bar (Blue)
  ctx.fillStyle = '#0056b3';
  ctx.fillRect(0, 0, width, 180);

  // 5. Title Text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 70px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('BUSCAMOS PROVEEDOR', width / 2, 60);
  ctx.font = 'bold 50px Arial';
  ctx.fillText('DE SOLDADURA (MONTERREY)', width / 2, 130);

  // 6. Main Content Box
  // We'll draw a slight box to make text pop
  const boxY = 220;
  const boxH = 750;
  const boxMargin = 50;
  
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  // Section 1: Requirement
  let y = boxY;
  ctx.fillStyle = '#333333';
  ctx.font = 'bold 55px Arial';
  ctx.fillText('🔧 Proceso Requerido:', boxMargin, y);
  y += 70;
  
  ctx.fillStyle = '#000000';
  ctx.font = '45px Arial';
  const lines1 = [
    '• Soldadura MIG/MAG (CO₂)',
    '• Corte, Doblado, Granallado',
    '• Estructuras de Acero (Maquinaria)'
  ];
  lines1.forEach(line => {
    ctx.fillText(line, boxMargin + 20, y);
    y += 60;
  });

  y += 40; // Spacer

  // Section 2: Supplier
  ctx.fillStyle = '#333333';
  ctx.font = 'bold 55px Arial';
  ctx.fillText('📋 Requisitos Clave:', boxMargin, y);
  y += 70;

  ctx.fillStyle = '#000000';
  ctx.font = '45px Arial';
  const lines2 = [
    '• Control de Calidad (Reportes)',
    '• Fabricación según Planos',
    '• Entrega Puntual',
    '• Capacidad para Lotes Grandes'
  ];
  lines2.forEach(line => {
    ctx.fillText(line, boxMargin + 20, y);
    y += 60;
  });

  y += 40;

  // Section 3: Highlight
  ctx.fillStyle = '#d9534f'; // Red highlight
  ctx.font = 'bold 45px Arial';
  ctx.fillText('✅ Entrega: Piezas "En Blanco"', boxMargin, y);
  y += 60;
  ctx.font = 'italic 40px Arial';
  ctx.fillStyle = '#555555';
  ctx.fillText('(Sin pintura ni recubrimientos)', boxMargin + 60, y);

  // Footer / CTA
  const footerY = height - 120;
  ctx.fillStyle = '#f7f7f7';
  ctx.fillRect(0, footerY, width, 120);
  ctx.fillStyle = '#28a745'; // WhatsApp Green
  ctx.font = 'bold 50px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('📲 ¡Cotiza con nosotros vía WhatsApp!', width / 2, footerY + 60);

  // 7. Save Image
  const buffer = canvas.toBuffer('image/jpeg', { quality: 0.9 });
  fs.writeFileSync(OUT_PATH, buffer);
  console.log(`✅ Ad Cover Generated: ${OUT_PATH}`);
}

generate();
