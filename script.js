// --- ELEMENTOS DEL DOM ---
const rings = {
    day: document.getElementById('day-ring'),
    week: document.getElementById('week-ring'),
    month: document.getElementById('month-ring'),
    year: document.getElementById('year-ring')
};
const labels = {
    dayBlockName: document.getElementById('day-block-name'),
    dayValue: document.getElementById('day-value'),
    dayFraction: document.getElementById('day-fraction'),
    weekValue: document.getElementById('week-value'),
    weekFraction: document.getElementById('week-fraction'),
    monthValue: document.getElementById('month-value'),
    monthFraction: document.getElementById('month-fraction'),
    monthWeekFraction: document.getElementById('month-week-fraction'),
    yearValue: document.getElementById('year-value'),
    yearFraction: document.getElementById('year-fraction'),
    yearDaysFraction: document.getElementById('year-days-fraction'),
};
const dividersContainer = document.getElementById('dividers');
const goBar = document.getElementById('go-bar');

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
        line.setAttribute('x1', start.x); line.setAttribute('y1', start.y);
        line.setAttribute('x2', end.x); line.setAttribute('y2', end.y);
        dividersContainer.appendChild(line);
    }
}
function polarToCartesian(cx, cy, r, angle) {
    const rad = (angle - 90) * Math.PI / 180.0;
    return { x: cx + (r * Math.cos(rad)), y: cy + (r * Math.sin(rad)) };
}

// --- LÓGICA DE ANIMACIÓN ---
function setProgress(ringKey, percentRemaining) {
    const circumference = circumferences[ringKey];
    const offset = circumference - (percentRemaining / 100 * circumference);
    rings[ringKey].style.strokeDasharray = `${circumference} ${circumference}`;
    rings[ringKey].style.strokeDashoffset = -offset;
}

// --- LÓGICA PRINCIPAL ---
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
    
    goBar.style.display = (currentBlock.name === 'go') ? 'block' : 'none';

    const dayStart = new Date(now).setHours(7, 0, 0, 0);
    const dayEnd = new Date(now).setHours(23, 0, 0, 0);
    let dayPercentPassed = (now < dayStart || now >= dayEnd) ? 100 : ((now - dayStart) / (dayEnd - dayStart)) * 100;
    const dayPercentRemaining = 100 - dayPercentPassed;
    const hoursRemaining = (dayPercentRemaining > 0) ? Math.ceil((23 - (now.getHours() + now.getMinutes()/60))) : 0;
    
    labels.dayBlockName.innerText = currentBlock.name;
    labels.dayValue.innerText = (dayPercentRemaining / 100).toFixed(2);
    labels.dayFraction.innerText = `${hoursRemaining}/16 hrs`;
    setProgress('day', dayPercentRemaining);

    // 2. ANILLO SEMANAL
    const dayOfWeek = (now.getDay() === 0) ? 6 : now.getDay() - 1; // Lunes=0
    const daysRemainingInWeek = 7 - dayOfWeek;
    const weekPercentPassed = ((dayOfWeek * 86400) + (now.getHours() * 3600) + (now.getMinutes() * 60) + now.getSeconds()) / (7 * 86400) * 100;
    const weekPercentRemaining = 100 - weekPercentPassed;
    labels.weekValue.innerText = (weekPercentRemaining / 100).toFixed(2);
    labels.weekFraction.innerText = `${daysRemainingInWeek}/7 días`;
    setProgress('week', weekPercentRemaining);

    // 3. ANILLO MENSUAL
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const weekOfMonth = Math.ceil(dayOfMonth / 7);
    const totalWeeksInMonth = Math.ceil(daysInMonth / 7);
    const monthPercentPassed = ((dayOfMonth - 1) / daysInMonth) * 100;
    const monthPercentRemaining = 100 - monthPercentPassed;
    labels.monthValue.innerText = (monthPercentRemaining / 100).toFixed(2);
    labels.monthFraction.innerText = `${dayOfMonth}/${daysInMonth} días`;
    labels.monthWeekFraction.innerText = `${weekOfMonth}/${totalWeeksInMonth} semanas`;
    setProgress('month', monthPercentRemaining);
    
    // 4. ANILLO ANUAL
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((now - startOfYear) / 86400000) + 1;
    const isLeap = new Date(now.getFullYear(), 1, 29).getDate() === 29;
    const daysInYear = isLeap ? 366 : 365;
    const daysRemainingInYear = daysInYear - dayOfYear;
    const yearPercentPassed = (dayOfYear / daysInYear) * 100;
    const yearPercentRemaining = 100 - yearPercentPassed;
    labels.yearValue.innerText = (yearPercentRemaining / 100).toFixed(2);
    labels.yearFraction.innerText = `${now.getMonth() + 1}/12 meses`;
    labels.yearDaysFraction.innerText = `${daysRemainingInYear}/${daysInYear} días`;
    setProgress('year', yearPercentRemaining);
}

// --- INICIALIZACIÓN (CORREGIDA) ---
function initialize() {
    // Eliminamos la línea que dibujaba los 4 divisores del mes que cruzaban todo
    createDividers(12, 100, 80);  // Divisores solo para el anillo del Año
    createDividers(7, 70, 50);   // Divisores solo para el anillo de la Semana
    createDividers(4, 57.5, 32.5); // Divisores solo para el anillo del Día

    setInterval(updateClocks, 1000);
    updateClocks();
}

initialize();
