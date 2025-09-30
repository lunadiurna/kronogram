// --- ELEMENTOS DEL DOM ---
const dayRing = document.getElementById('day-ring');
const weekRing = document.getElementById('week-ring');
const monthRing = document.getElementById('month-ring');
const yearRing = document.getElementById('year-ring');

const dayBlockName = document.getElementById('day-block-name');
const dayPercentage = document.getElementById('day-percentage');
const weekPercentage = document.getElementById('week-percentage');
const monthPercentage = document.getElementById('month-percentage');
const yearPercentage = document.getElementById('year-percentage');

// --- CONFIGURACIÓN DE LOS ANILLOS (CÍRCULOS) ---
const rings = [dayRing, weekRing, monthRing, yearRing];
const circumferences = rings.map(ring => 2 * Math.PI * ring.r.baseVal.value);

function setProgress(ringIndex, percent) {
    const offset = circumferences[ringIndex] - (percent / 100) * circumferences[ringIndex];
    rings[ringIndex].style.strokeDasharray = `${circumferences[ringIndex]} ${circumferences[ringIndex]}`;
    rings[ringIndex].style.strokeDashoffset = offset;
}

// --- LÓGICA DEL RELOJ ---
function updateClocks() {
    const now = new Date();

    // 1. RELOJ DIARIO (BLOQUES)
    const blocks = [
        { name: 'ichi', start: 7, end: 11, color: '#ff6347' }, // Tomate
        { name: 'ni', start: 11, end: 15, color: '#ffaf47' }, // Naranja
        { name: 'san', start: 15, end: 19, color: '#ffd700' }, // Oro
        { name: 'shi', start: 19, end: 23, color: '#63aeff' }, // Azul claro
        { name: 'go', start: 23, end: 7, color: '#9370db' }   // Violeta
    ];
    
    const currentHour = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    let currentBlock = blocks.find(b => {
        if (b.start < b.end) return currentHour >= b.start && currentHour < b.end;
        return currentHour >= b.start || currentHour < b.end; // Para el bloque 'go'
    });

    const blockStart = new Date(now);
    blockStart.setHours(currentBlock.start, 0, 0, 0);

    // Si estamos en el bloque 'go' y es de madrugada (antes de las 7), el inicio fue ayer
    if (currentBlock.name === 'go' && currentHour < currentBlock.end) {
        blockStart.setDate(blockStart.getDate() - 1);
    }

    const secondsIntoBlock = (now - blockStart) / 1000;
    let blockDurationHours = (currentBlock.end - currentBlock.start);
    if (blockDurationHours < 0) blockDurationHours += 24; // Duración para el bloque 'go'
    const blockDurationSeconds = blockDurationHours * 3600;
    
    const dayPercent = (secondsIntoBlock / blockDurationSeconds) * 100;

    dayRing.style.stroke = currentBlock.color;
    dayBlockName.innerText = currentBlock.name;
    dayPercentage.innerText = `${100 - dayPercent.toFixed(2)}%`;
    setProgress(0, 100 - dayPercent);

    // 2. RELOJ SEMANAL
    const dayOfWeek = now.getDay(); // 0 (Domingo) - 6 (Sábado)
    const dayIndex = (dayOfWeek === 0) ? 6 : dayOfWeek - 1; // 0 (Lunes) - 6 (Domingo)
    const secondsIntoWeek = (dayIndex * 86400) + (currentHour * 3600) + (minutes * 60) + seconds;
    const weekPercent = (secondsIntoWeek / (7 * 86400)) * 100;
    
    weekPercentage.innerText = `${(100 - weekPercent).toFixed(2)}%`;
    setProgress(1, 100 - weekPercent);

    // 3. RELOJ MENSUAL
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const secondsIntoMonth = ((dayOfMonth - 1) * 86400) + (currentHour * 3600) + (minutes * 60) + seconds;
    const monthPercent = (secondsIntoMonth / (daysInMonth * 86400)) * 100;

    monthPercentage.innerText = `${(100 - monthPercent).toFixed(2)}%`;
    setProgress(2, 100 - monthPercent);
    
    // 4. RELOJ ANUAL
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24)) + 1;
    const isLeap = new Date(now.getFullYear(), 1, 29).getDate() === 29;
    const daysInYear = isLeap ? 366 : 365;
    const yearPercent = (dayOfYear / daysInYear) * 100;

    yearPercentage.innerText = `${(100 - yearPercent).toFixed(2)}%`;
    setProgress(3, 100 - yearPercent);
}

// --- INICIALIZACIÓN ---
setInterval(updateClocks, 1000);
updateClocks(); // Llamada inicial para no esperar 1 segundo al cargar.