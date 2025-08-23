export async function renderSlipImage({ slip, logoUrl, brand = 'betchekr' }) {
  // slip: { legs: [{team, market, price, book, verdict}], stake, potentialReturn, date }
  const width = 1080, height = 1350;
  const canvas = Object.assign(document.createElement('canvas'), { width, height });
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#0B0F14';
  ctx.fillRect(0, 0, width, height);

  // Card surface
  const pad = 48;
  const cardW = width - pad * 2;
  const cardH = height - pad * 2;
  roundRect(ctx, pad, pad, cardW, cardH, 28);
  ctx.fillStyle = '#0F172A';
  ctx.fill();

  // Title row
  ctx.fillStyle = '#E5E7EB';
  ctx.font = '700 44px Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial';
  ctx.fillText(`${brand} • Bet Check`, pad + 40, pad + 72);

  // Meta
  ctx.font = '400 22px Inter, system-ui';
  ctx.fillStyle = '#9CA3AF';
  const meta = `${slip.date || ''}  •  Stake: ${slip.stake}  •  Potential: ${slip.potentialReturn}`;
  ctx.fillText(meta, pad + 40, pad + 110);

  // Legs list
  let y = pad + 170;
  slip.legs.forEach((l, i) => {
    ctx.font = '600 26px Inter, system-ui';
    ctx.fillStyle = '#D1D5DB';
    ctx.fillText(`${i + 1}. ${l.team} – ${l.market}`, pad + 40, y);
    ctx.font = '500 22px Inter, system-ui';
    ctx.fillStyle = '#9CA3AF';
    ctx.fillText(`${l.book}  •  ${l.price}`, pad + 40, y + 30);

    // verdict tag
    const tag = l.verdict || 'OK';
    const tagW = ctx.measureText(tag).width + 28;
    const tagH = 30;
    const tagX = width - pad - tagW - 40, tagY = y - 22;
    roundRect(ctx, tagX, tagY, tagW, tagH, 8);
    ctx.fillStyle = tag === 'Better price available' ? '#3B82F6' : (tag === '+EV' ? '#22C55E' : '#374151');
    ctx.fill();
    ctx.fillStyle = '#0B0F14';
    ctx.font = '700 18px Inter, system-ui';
    ctx.fillText(tag, tagX + 14, tagY + 20);

    y += 78;
  });

  // Watermark (non-intrusive): bottom-right, opacity 0.12, avoids text area
  if (logoUrl) {
    try {
      const img = await loadImage(logoUrl);
      const wmSize = Math.min(width * 0.28, 320);
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.drawImage(img, width - wmSize - 40, height - wmSize - 40, wmSize, wmSize);
      ctx.restore();
    } catch (error) {
      console.warn('Failed to load watermark image:', error);
    }
  }

  // Brand ribbon
  ctx.fillStyle = '#F4C430';
  ctx.fillRect(pad, height - pad - 56, 280, 44);
  ctx.fillStyle = '#0B0F14';
  ctx.font = '800 22px Inter, system-ui';
  ctx.fillText(brand, pad + 18, height - pad - 26);

  return canvas.toDataURL('image/png', 0.96);
}

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function loadImage(src) {
  return new Promise((res, rej) => {
    const i = new Image();
    i.crossOrigin = 'anonymous';
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
}

// Export function to download the image
export function downloadImage(dataUrl, filename = 'betchekr-slip.png') {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export function to copy image to clipboard
export async function copyImageToClipboard(dataUrl) {
  try {
    const blob = await fetch(dataUrl).then(r => r.blob());
    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob
      })
    ]);
    return true;
  } catch (error) {
    console.error('Failed to copy image to clipboard:', error);
    return false;
  }
}