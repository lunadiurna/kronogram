// --- ELEMENTOS DEL DOM y CÁLCULOS INICIALES (sin cambios) ---
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

const circumferences = {
    day: 2 * Math.PI * rings.day.r.baseVal.value,
    week: 2 * Math.PI * rings.week.r.baseVal.value,
    month: 2 * Math.PI * rings.month.r.baseVal.value,
    year: 2 * Math.PI * rings.year.r.baseVal.value
};

// --- FUNCIONES DE DIBUJO (sin cambios) ---
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

// --- LÓGICA DE ANIMACIÓN CORREGIDA ---
// Ahora la función usa el porcentaje que ha PASADO para calcular el vaciado
function setProgress(ringKey, percentPassed) {
    const circumference = circumferences[ringKey];
    const offset = (percentPassed / 100) * circumference; // Esta es la nueva lógica
    rings[ringKey].style.strokeDasharray = `${circumference} ${circumference}`;
    rings[ringKey].style.strokeDashoffset = offset;
}

// --- LÓGICA PRINCIPAL CORREGIDA ---
function updateClocks() {
    const now = new Date();

    // 1. ANILLO DIARIO
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
    
    // Mostramos el porcentaje restante, pero animamos con el porcentaje pasado
    labels.dayBlockName.innerText = currentBlock.name;
    labels.dayPercentage.innerText = `${(100 - dayPercentPassed).toFixed(1)}%`;
    setProgress('day', dayPercentPassed);

    // 2. ANILLO SEMANAL
    const dayOfWeek = (now.getDay() === 0) ? 6 : now.getDay() - 1;
    const secondsIntoWeek = (dayOfWeek * 86400) + (now.getHours() * 3600) + (now.getMinutes() * 60) + now.getSeconds();
    const weekPercentPassed = (secondsIntoWeek / (7 * 86400)) * 100;
    labels.weekPercentage.innerText = `${(100 - weekPercentPassed).toFixed(1)}%`;
    setProgress('week', weekPercentPassed);

    // 3. ANILLO MENSUAL
    const secondsIntoMonth = ((now.getDate() - 1) * 86400) + (now.getHours() * 3600) + (now.getMinutes() * 60) + now.getSeconds();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthPercentPassed = (secondsIntoMonth / (daysInMonth * 86400)) * 100;
    labels.monthPercentage.innerText = `${(100 - monthPercentPassed).toFixed(1)}%`;
    setProgress('month', monthPercentPassed);
    
    // 4. ANILLO ANUAL
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const secondsIntoYear = (now - startOfYear) / 1000;
    const isLeap = new Date(now.getFullYear(), 1, 29).getDate() === 29;
    const secondsInYear = (isLeap ? 366 : 365) * 86400;
    const yearPercentPassed = (secondsIntoYear / secondsInYear) * 100;
    labels.yearPercentage.innerText = `${(100 - yearPercentPassed).toFixed(1)}%`;
    setProgress('year', yearPercentPassed);
}

// --- INICIALIZACIÓN (sin cambios) ---
function initialize() {
    createDividers(12, 100, 80);
    createDividers(4, 85, 65);
    createDividers(7, 70, 50);
    createDividers(4, 57.5, 32.5);

    setInterval(updateClocks, 1000);
    updateClocks();
}

initialize();
