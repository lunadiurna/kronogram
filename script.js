// --- ELEMENTOS DEL DOM ---
const daySegments = document.getElementById('day-segments');
const weekSegments = document.getElementById('week-segments');
const monthSegments = document.getElementById('month-segments');
const yearSegments = document.getElementById('year-segments');

const dayRing = document.getElementById('day-ring');
const weekRing = document.getElementById('week-ring');
const monthRing = document.getElementById('month-ring');
const yearRing = document.getElementById('year-ring');

// Etiquetas
const dayBlockName = document.getElementById('day-block-name');
const dayPercentage = document.getElementById('day-percentage');
const weekPercentage = document.getElementById('week-percentage');
const monthPercentage = document.getElementById('month-percentage');
const yearPercentage = document.getElementById('year-percentage');


// --- FUNCIONES AUXILIARES ---
function describeArc(x, y, radius, startAngle, endAngle) {
    const polarToCartesian = (centerX, centerY, r, angleInDegrees) => {
        const rad = (angleInDegrees) * Math.PI / 180.0;
        return { x: centerX + (r * Math.cos(rad)), y: centerY + (r * Math.sin(rad)) };
    };
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

function createStaticSegments(container, segments, radius, color) {
    container.innerHTML = '';
    const angleStep = 360 / segments;
    for (let i = 0; i < segments; i++) {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", describeArc(100, 100, radius, angleStep * i, angleStep * (i + 1) - 2));
        path.style.stroke = color;
        container.appendChild(path);
    }
}

// --- CONFIGURACIÓN Y ANIMACIÓN DE ANILLOS ---
const rings = [dayRing, weekRing, monthRing, yearRing];
const circumferences = rings.map(ring => 2 * Math.PI * ring.r.baseVal.value);

rings.forEach((ring, i) => {
    ring.style.strokeDasharray = `${circumferences[i]} ${circumferences[i]}`;
});

function setProgress(ringIndex, percent) {
    const offset = circumferences[ringIndex] - (percent / 100 * circumferences[ringIndex]);
    rings[ringIndex].style.strokeDashoffset = offset;
}

// --- LÓGICA PRINCIPAL ---
function updateClocks() {
    const now = new Date();

    // 1. RELOJ DIARIO
    const blocks = [{ name: 'ichi', start: 7 }, { name: 'ni', start: 11 }, { name: 'san', start: 15 }, { name: 'shi', start: 19 }, { name: 'go', start: 23 }];
    const currentHour = now.getHours();
    let currentBlock = blocks.find((b, i) => {
        const next = blocks[i + 1] || blocks[0];
        if (b.start === 23) return currentHour >= 23 || currentHour < 7;
        return currentHour >= b.start && currentHour < next.start;
    });
    const dayStart = new Date(now).setHours(7, 0, 0, 0);
    const dayEnd = new Date(now).setHours(23, 0, 0, 0);
    let dayPercentRemaining = 100;
    if (now > dayStart && now < dayEnd) {
        dayPercentRemaining = 100 - ((now - dayStart) / (dayEnd - dayStart)) * 100;
    } else if (now >= dayEnd || now < dayStart) {
        dayPercentRemaining = 0;
    }
    dayBlockName.innerText = currentBlock.name;
    dayPercentage.innerText = `${dayPercentRemaining.toFixed(1)}%`;
    setProgress(0, dayPercentRemaining);

    // 2. RELOJ SEMANAL
    const dayOfWeek = (now.getDay() + 6) % 7;
    const secondsIntoWeek = (dayOfWeek * 86400) + (now.getHours() * 3600) + (now.getMinutes() * 60) + now.getSeconds();
    const weekPercentRemaining = 100 - (secondsIntoWeek / (7 * 86400)) * 100;
    weekPercentage.innerText = `${weekPercentRemaining.toFixed(1)}%`;
    setProgress(1, weekPercentRemaining);

    // 3. RELOJ MENSUAL
    const secondsIntoMonth = ((now.getDate() - 1) * 86400) + (now.getHours() * 3600) + (now.getMinutes() * 60) + now.getSeconds();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthPercentRemaining = 100 - (secondsIntoMonth / (daysInMonth * 86400)) * 100;
    monthPercentage.innerText = `${monthPercentRemaining.toFixed(1)}%`;
    setProgress(2, monthPercentRemaining);
    
    // 4. RELOJ ANUAL
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24));
    const isLeap = new Date(now.getFullYear(), 1, 29).getDate() === 29;
    const daysInYear = isLeap ? 366 : 365;
    const yearPercentRemaining = 100 - (dayOfYear / daysInYear) * 100;
    yearPercentage.innerText = `${yearPercentRemaining.toFixed(1)}%`;
    setProgress(3, yearPercentRemaining);
}

// --- INICIALIZACIÓN ---
function initialize() {
    const style = getComputedStyle(document.body);
    createStaticSegments(daySegments, 4, 45, style.getPropertyValue('--day-color'));
    createStaticSegments(weekSegments, 7, 60, style.getPropertyValue('--week-color'));
    createStaticSegments(monthSegments, 4, 75, style.getPropertyValue('--month-color'));
    createStaticSegments(yearSegments, 12, 90, style.getPropertyValue('--year-color'));
    
    setInterval(updateClocks, 1000);
    updateClocks();
}

initialize();
