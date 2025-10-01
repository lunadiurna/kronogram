// =================================================================================
// 1. CONFIGURACIÓN Y ELEMENTOS DEL DOM (sin cambios)
// =================================================================================
const segmentContainers = { day: document.getElementById('day-segments'), week: document.getElementById('week-segments'), month: document.getElementById('month-segments'), year: document.getElementById('year-segments') };
const labels = { dayBlockName: document.getElementById('day-block-name'), dayValue: document.getElementById('day-value'), dayFraction: document.getElementById('day-fraction'), weekValue: document.getElementById('week-value'), weekFraction: document.getElementById('week-fraction'), monthValue: document.getElementById('month-value'), monthFraction: document.getElementById('month-fraction'), monthWeekFraction: document.getElementById('month-week-fraction'), yearValue: document.getElementById('year-value'), yearFraction: document.getElementById('year-fraction'), yearDaysFraction: document.getElementById('year-days-fraction') };
const goBar = document.getElementById('go-bar'); // Eliminado en la versión final de "bloques"
// ¡Atención! El script que te dí antes tenía un error al seguir referenciando goBar, lo elimino ahora.

// =================================================================================
// 2. FUNCIONES DE DIBUJO (sin cambios)
// =================================================================================
function createRingSegments(config) { /* ...código sin cambios... */ }
function describeArc(x, y, radius, startAngle, endAngle) { /* ...código sin cambios... */ }

function createRingSegments(config) {
    const { container, segmentCount, radius, strokeWidth, cssClass, totalAngle = 360, startAngle = 0, gapDegrees = 1 } = config;
    container.innerHTML = ''; 
    const anglePerSegment = (totalAngle - (segmentCount * gapDegrees)) / segmentCount;
    for (let i = 0; i < segmentCount; i++) {
        const segmentStartAngle = startAngle + (i * (anglePerSegment + gapDegrees));
        const segmentEndAngle = segmentStartAngle + anglePerSegment;
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", describeArc(100, 100, radius, segmentStartAngle, segmentEndAngle));
        // Si se pasa un array de clases, se usa una lógica distinta
        const finalCssClass = Array.isArray(cssClass) ? cssClass[i] : cssClass;
        path.setAttribute("class", `segment ${finalCssClass} segment-future`);
        path.style.strokeWidth = strokeWidth;
        container.appendChild(path);
    }
}
function describeArc(x, y, radius, startAngle, endAngle) { const polarToCartesian = (centerX, centerY, r, angleInDegrees) => { const rad = (angleInDegrees) * Math.PI / 180.0; return { x: centerX + (r * Math.cos(rad)), y: centerY + (r * Math.sin(rad)) }; }; const start = polarToCartesian(x, y, radius, endAngle); const end = polarToCartesian(x, y, radius, startAngle); const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1"; return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`; }


// =================================================================================
// 3. LÓGICA DE ACTUALIZACIÓN (sin cambios)
// =================================================================================
function updateSegmentStates(container, activeIndex) { /* ...código sin cambios... */ }
function updateClocks() { /* ...código sin cambios... */ }

function updateSegmentStates(container, activeIndex) {
    const segments = container.children;
    for (let i = 0; i < segments.length; i++) {
        segments[i].classList.remove('segment-active', 'segment-passed', 'segment-future');
        if (i < activeIndex) {
            segments[i].classList.add('segment-passed');
        } else if (i === activeIndex) {
            segments[i].classList.add('segment-active');
        } else {
            segments[i].classList.add('segment-future');
        }
    }
}
function updateClocks() {
    const now = new Date();
    const blocks = [{ name: 'ichi', start: 7 }, { name: 'ni', start: 11 }, { name: 'san', start: 15 }, { name: 'shi', start: 19 }, { name: 'go', start: 23 }];
    const currentHour = now.getHours();
    let currentBlock = blocks.find((b, i) => { const next = blocks[i+1] || blocks[0]; if (b.name === 'go') return currentHour >= b.start || currentHour < next.start; return currentHour >= b.start && currentHour < next.start; }) || { name: 'go' };
    const dayStart = new Date(now).setHours(7, 0, 0, 0);
    const goSegment = document.getElementById('go-segment');
    const daySegmentsContainer = document.getElementById('day-segments-container');
    if (currentBlock.name === 'go') {
        updateSegmentStates(daySegmentsContainer, -1);
        if (goSegment) goSegment.classList.add('segment-active');
    } else {
        if (goSegment) goSegment.classList.remove('segment-active');
        const minutesPassedSinceStart = (now - dayStart) / 60000;
        const activeDayIndex = Math.floor(minutesPassedSinceStart / 10);
        updateSegmentStates(daySegmentsContainer, activeDayIndex);
    }
    const dayEnd = new Date(now).setHours(23, 0, 0, 0);
    let dayPercentPassed = (now < dayStart || now >= dayEnd) ? 100 : ((now - dayStart) / (dayEnd - dayStart)) * 100;
    const dayPercentRemaining = 100 - dayPercentPassed;
    const hoursRemaining = (dayPercentRemaining > 0) ? Math.ceil((23 - (now.getHours() + now.getMinutes()/60))) : 0;
    labels.dayBlockName.innerText = currentBlock.name;
    labels.dayValue.innerText = (dayPercentRemaining / 100).toFixed(2);
    labels.dayFraction.innerText = `${hoursRemaining}/16 hrs`;
    const activeWeekIndex = (now.getDay() === 0) ? 6 : now.getDay() - 1;
    updateSegmentStates(segmentContainers.week, activeWeekIndex);
    const daysRemainingInWeek = 7 - activeWeekIndex;
    const weekPercentRemaining = 100 - ((activeWeekIndex / 7) * 100);
    labels.weekValue.innerText = (weekPercentRemaining / 100).toFixed(2);
    labels.weekFraction.innerText = `${daysRemainingInWeek}/7 días`;
    const dayOfMonth = now.getDate();
    const activeMonthIndex = Math.ceil(dayOfMonth / 7) - 1;
    updateSegmentStates(segmentContainers.month, activeMonthIndex);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const totalWeeksInMonth = Math.ceil(daysInMonth / 7);
    const monthPercentRemaining = 100 - (((dayOfMonth - 1) / daysInMonth) * 100);
    labels.monthValue.innerText = (monthPercentRemaining / 100).toFixed(2);
    labels.monthFraction.innerText = `${dayOfMonth}/${daysInMonth} días`;
    labels.monthWeekFraction.innerText = `${activeMonthIndex + 1}/${totalWeeksInMonth} semanas`;
    const activeYearIndex = now.getMonth();
    updateSegmentStates(segmentContainers.year, activeYearIndex);
    const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 1)) / 86400000) + 1;
    const daysInYear = new Date(now.getFullYear(), 1, 29).getDate() === 29 ? 366 : 365;
    const daysRemainingInYear = daysInYear - dayOfYear;
    const yearPercentRemaining = 100 - ((dayOfYear / daysInYear) * 100);
    labels.yearValue.innerText = (yearPercentRemaining / 100).toFixed(2);
    labels.yearFraction.innerText = `${activeYearIndex + 1}/12 meses`;
    labels.yearDaysFraction.innerText = `${daysRemainingInYear}/${daysInYear} días`;
}

// =================================================================================
// 4. INICIALIZACIÓN (MODIFICADA)
// =================================================================================

function initialize() {
    console.log("Inicializando Reloj Segmentado con colores variantes...");

    // --- DIBUJAR LOS ANILLOS SIMPLES ---
    createRingSegments({ container: segmentContainers.year, segmentCount: 12, radius: 90, strokeWidth: 3, cssClass: 'year-segment', gapDegrees: 3 });
    createRingSegments({ container: segmentContainers.month, segmentCount: 5, radius: 86, strokeWidth: 3, cssClass: 'month-segment', gapDegrees: 3 });
    createRingSegments({ container: segmentContainers.week, segmentCount: 7, radius: 82, strokeWidth: 3, cssClass: 'week-segment', gapDegrees: 3 });
    
    // --- CAMBIO PRINCIPAL: DIBUJAR EL ANILLO DIARIO CON LÓGICA DE COLOR ---
    segmentContainers.day.innerHTML = '';
    const goPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    goPath.setAttribute("id", "go-segment");
    goPath.setAttribute("class", "segment");
    goPath.setAttribute("d", describeArc(100, 99.5, 62, -2, 2));
    goPath.style.strokeWidth = "32px";
    segmentContainers.day.appendChild(goPath);

    const daySegmentsContainer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    daySegmentsContainer.setAttribute("id", "day-segments-container");
    segmentContainers.day.appendChild(daySegmentsContainer);

    // Reemplazamos la llamada a 'createRingSegments' por un bucle manual
    // para asignar las clases de color.
    const dayConfig = {
        container: daySegmentsContainer,
        segmentCount: 96,
        radius: 62,
        strokeWidth: 32,
        totalAngle: 354,
        startAngle: 3,
        gapDegrees: 0.7
    };
    
    const anglePerSegment = (dayConfig.totalAngle - (dayConfig.segmentCount * dayConfig.gapDegrees)) / dayConfig.segmentCount;

    for (let i = 0; i < dayConfig.segmentCount; i++) {
        // Asignamos una clase de color según el bloque de 24 segmentos
        let colorClass = '';
        if (i < 24) { // Bloque Ichi (primeras 4 horas)
            colorClass = 'day-segment-1';
        } else if (i < 48) { // Bloque Ni (siguientes 4 horas)
            colorClass = 'day-segment-2';
        } else if (i < 72) { // Bloque San (siguientes 4 horas)
            colorClass = 'day-segment-3';
        } else { // Bloque Shi (últimas 4 horas)
            colorClass = 'day-segment-4';
        }

        const segmentStartAngle = dayConfig.startAngle + (i * (anglePerSegment + dayConfig.gapDegrees));
        const segmentEndAngle = segmentStartAngle + anglePerSegment;
        
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", describeArc(100, 100, dayConfig.radius, segmentStartAngle, segmentEndAngle));
        path.setAttribute("class", `segment ${colorClass} segment-future`);
        path.style.strokeWidth = dayConfig.strokeWidth;
        dayConfig.container.appendChild(path);
    }

    // --- INICIAR EL CICLO DE ACTUALIZACIÓN ---
    setInterval(updateClocks, 1000);
    updateClocks();
}

// Iniciar todo el proceso.
initialize();
