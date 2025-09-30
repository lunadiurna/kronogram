// --- ELEMENTOS DEL DOM ---
const rings = {
    day: document.getElementById('day-ring'),
    week: document.getElementById('week-ring'),
    month: document.getElementById('month-ring'),
    year: document.getElementById('year-ring')
};
const labels = {
    dayBlockName: document.getElementById('day-block-name'),
    dayPercentage: document.getElementById('day-percentage'),
    weekPercentage: document.getElementById('week-percentage'),
    monthPercentage: document.getElementById('month-percentage'),
    yearPercentage: document.getElementById('year-percentage')
};
const dividersContainer = document.getElementById('dividers');

// --- CÁLCULOS INICIALES ---
const circumferences = {
    day: 2 * Math.PI * rings.day.r.baseVal.value,
    week: 2 * Math.PI * rings.week.r.baseVal.value,
    month: 2 * Math.PI * rings.month.r.baseVal.value,
    year: 2 * Math.PI * rings.year.r.baseVal.value
};

// --- FUNCIONES DE DIBUJO ---
function createDividers(segments, outerRadius, innerRadius) {
    const angleStep = 360 / segments;
    for (let i = 0; i < segments; i++) {
        const angle = angleStep * i;
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        const start = polarToCartesian(100, 100, innerRadius, angle);
        const end = polarToCartesian(100, 100, outerRadius, angle);
        line.setAttribute('x1', start.x);
        line.setAttribute('y1', start.y);
        line.setAttribute('x2', end.x);
        line.setAttribute('y2', end.y);
        dividersContainer.appendChild(line);
    }
}

function polarToCartesian(cx, cy, r, angle) {
    const rad = (angle - 90) * Math.PI / 180.0;
    return { x: cx + (r * Math.cos(rad)), y: cy + (r * Math.sin(rad)) };
}

// Actualiza el vaciado de un anillo
function setProgress(ringKey, percentRemaining) {
    const circumference = circumferences[ringKey];
    const offset = circumference - (percentRemaining / 100 * circumference);
    rings[ringKey].style.strokeDasharray = `${circumference} ${circumference}`;
    rings[ringKey].style.strokeDashoffset = offset;
}

// --- LÓGICA PRINCIPAL ---
function updateClocks() {
    const now = new Date();

    // 1. ANILLO DIARIO (07:00 a 23:00)
    const blocks = [{ name: 'ichi', start: 7 }, { name: 'ni', start: 11 }, { name: 'san', start: 15 }, { name: 'shi', start: 19 }, { name: 'go', start: 23 }];
    const currentHour = now.getHours();
    let currentBlock = blocks.find((b, i) => {
        const next = blocks[i+1] || blocks[0];
        if (b.name === 'go') return currentHour >= b.start || currentHour < next.start;
        return currentHour >= b.start && currentHour < next.start;
    }) || { name: 'go' };
    
    const dayStart = new Date(now).setHours(7, 0, 0, 0);
    const dayEnd = new Date(now).setHours(23, 0, 0, 0);
    let dayPercentPassed = 0;
    if (now > dayStart && now < dayEnd) {
        dayPercentPassed = ((now - dayStart) / (dayEnd - dayStart)) * 100;
    } else if (now >= dayEnd) {
        dayPercentPassed = 100;
    }
    const dayPercentRemaining = 100 - dayPercentPassed;
    
    labels.dayBlockName.innerText = currentBlock.name;
    labels.dayPercentage.innerText = `${dayPercentRemaining.toFixed(1)}%`;
    setProgress('day', dayPercentRemaining);

    // 2. ANILLO SEMANAL
    const dayOfWeek = (now.getDay() === 0) ? 6 : now.getDay() - 1; // Lunes=0
    const secondsIntoWeek = (dayOfWeek * 86400) + (now.getHours() * 3600) + (now.getMinutes() * 60) + now.getSeconds();
    const weekPercentRemaining = 100 - (secondsIntoWeek / (7 * 86400)) * 100;
    labels.weekPercentage.innerText = `${weekPercentRemaining.toFixed(1)}%`;
    setProgress('week', weekPercentRemaining);

    // 3. ANILLO MENSUAL
    const secondsIntoMonth = ((now.getDate() - 1) * 86400) + (now.getHours() * 3600) + (now.getMinutes() * 60) + now.getSeconds();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthPercentRemaining = 100 - (secondsIntoMonth / (daysInMonth * 86400)) * 100;
    labels.monthPercentage.innerText = `${monthPercentRemaining.toFixed(1)}%`;
    setProgress('month', monthPercentRemaining);
    
    // 4. ANILLO ANUAL
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const secondsIntoYear = (now - startOfYear) / 1000;
    const isLeap = new Date(now.getFullYear(), 1, 29).getDate() === 29;
    const secondsInYear = (isLeap ? 366 : 365) * 86400;
    const yearPercentRemaining = 100 - (secondsIntoYear / secondsInYear) * 100;
    labels.yearPercentage.innerText = `${yearPercentRemaining.toFixed(1)}%`;
    setProgress('year', yearPercentRemaining);
}

// --- INICIALIZACIÓN ---
function initialize() {
    // Dibujar las líneas divisorias
    createDividers(12, 100, 80); // Año
    createDividers(4, 85, 65);  // Mes
    createDividers(7, 70, 50);  // Semana
    createDividers(4, 57.5, 32.5); // Día

    setInterval(updateClocks, 1000);
    updateClocks();
}

initialize();
