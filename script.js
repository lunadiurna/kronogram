// =================================================================================
// 1. CONFIGURACIÓN Y ELEMENTOS DEL DOM
// =================================================================================

// Contenedores SVG donde se dibujarán los segmentos de cada anillo
const segmentContainers = {
    day: document.getElementById('day-segments'),
    week: document.getElementById('week-segments'),
    month: document.getElementById('month-segments'),
    year: document.getElementById('year-segments')
};

// Elementos de texto en el panel de información
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


// =================================================================================
// 2. FUNCIONES DE DIBUJO (Se ejecutan 1 vez al cargar la página)
// =================================================================================

/**
 * Dibuja un anillo compuesto por múltiples segmentos.
 * @param {object} config - Objeto de configuración.
 */
function createRingSegments(config) {
    const { container, segmentCount, radius, strokeWidth, cssClass, totalAngle = 360, startAngle = 0, gapDegrees = 1 } = config;
    container.innerHTML = ''; 
    const anglePerSegment = (totalAngle - (segmentCount * gapDegrees)) / segmentCount;

    for (let i = 0; i < segmentCount; i++) {
        const segmentStartAngle = startAngle + (i * (anglePerSegment + gapDegrees));
        const segmentEndAngle = segmentStartAngle + anglePerSegment;
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", describeArc(100, 100, radius, segmentStartAngle, segmentEndAngle));
        path.setAttribute("class", `segment ${cssClass} segment-future`);
        path.style.strokeWidth = strokeWidth;
        container.appendChild(path);
    }
}

/**
 * Genera la descripción de un arco SVG (el atributo 'd' de un <path>).
 * @returns {string} - El valor para el atributo 'd'.
 */
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


// =================================================================================
// 3. LÓGICA DE ACTUALIZACIÓN (Se ejecuta cada segundo)
// =================================================================================

/**
 * Actualiza las clases CSS de los segmentos de un anillo según el progreso.
 * @param {SVGElement} container - El grupo SVG que contiene los segmentos.
 * @param {number} activeIndex - El índice del segmento que debe estar activo.
 */
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

/**
 * Función principal que se ejecuta cada segundo para actualizar todo el reloj.
 */
function updateClocks() {
    const now = new Date();

    // --- 1. LÓGICA DEL ANILLO DIARIO ---
    const blocks = [{ name: 'ichi', start: 7 }, { name: 'ni', start: 11 }, { name: 'san', start: 15 }, { name: 'shi', start: 19 }, { name: 'go', start: 23 }];
    const currentHour = now.getHours();
    let currentBlock = blocks.find((b, i) => {
        const next = blocks[i+1] || blocks[0];
        if (b.name === 'go') return currentHour >= b.start || currentHour < next.start;
        return currentHour >= b.start && currentHour < next.start;
    }) || { name: 'go' };
    
    const dayStart = new Date(now).setHours(7, 0, 0, 0);
    const goSegment = document.getElementById('go-segment');
    
    // Obtiene los segmentos del día (excluyendo el contenedor del 'Go' segment)
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
    
    // Actualizar panel de información
    const dayEnd = new Date(now).setHours(23, 0, 0, 0);
    let dayPercentPassed = (now < dayStart || now >= dayEnd) ? 100 : ((now - dayStart) / (dayEnd - dayStart)) * 100;
    const dayPercentRemaining = 100 - dayPercentPassed;
    const hoursRemaining = (dayPercentRemaining > 0) ? Math.ceil((23 - (now.getHours() + now.getMinutes()/60))) : 0;
    labels.dayBlockName.innerText = currentBlock.name;
    labels.dayValue.innerText = (dayPercentRemaining / 100).toFixed(2);
    labels.dayFraction.innerText = `${hoursRemaining}/16 hrs`;

    // --- 2. LÓGICA DEL ANILLO SEMANAL ---
    const activeWeekIndex = (now.getDay() === 0) ? 6 : now.getDay() - 1;
    updateSegmentStates(segmentContainers.week, activeWeekIndex);
    const daysRemainingInWeek = 7 - activeWeekIndex;
    const weekPercentRemaining = 100 - ((activeWeekIndex / 7) * 100);
    labels.weekValue.innerText = (weekPercentRemaining / 100).toFixed(2);
    labels.weekFraction.innerText = `${daysRemainingInWeek}/7 días`;

    // --- 3. LÓGICA DEL ANILLO MENSUAL ---
    const dayOfMonth = now.getDate();
    const activeMonthIndex = Math.ceil(dayOfMonth / 7) - 1;
    updateSegmentStates(segmentContainers.month, activeMonthIndex);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const totalWeeksInMonth = Math.ceil(daysInMonth / 7);
    const monthPercentRemaining = 100 - (((dayOfMonth - 1) / daysInMonth) * 100);
    labels.monthValue.innerText = (monthPercentRemaining / 100).toFixed(2);
    labels.monthFraction.innerText = `${dayOfMonth}/${daysInMonth} días`;
    labels.monthWeekFraction.innerText = `${activeMonthIndex + 1}/${totalWeeksInMonth} semanas`;

    // --- 4. LÓGICA DEL ANILLO ANUAL ---
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
// 4. INICIALIZACIÓN (CORREGIDA)
// =================================================================================

function initialize() {
    console.log("Inicializando Reloj Segmentado...");

    // --- DIBUJAR LOS ANILLOS SIMPLES ---
    createRingSegments({ container: segmentContainers.year, segmentCount: 12, radius: 90, strokeWidth: 5, cssClass: 'year-segment', gapDegrees: 2 });
    createRingSegments({ container: segmentContainers.month, segmentCount: 5, radius: 80, strokeWidth: 6, cssClass: 'month-segment', gapDegrees: 3 });
    createRingSegments({ container: segmentContainers.week, segmentCount: 7, radius: 70, strokeWidth: 7, cssClass: 'week-segment', gapDegrees: 3 });
    
    // --- CORRECCIÓN CLAVE: DIBUJAR EL ANILLO DIARIO DE FORMA SEGURA ---
    // Limpiamos el contenedor principal del día.
    segmentContainers.day.innerHTML = '';
    
    // 1. Creamos y añadimos el segmento especial 'Go'.
    const goPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    goPath.setAttribute("id", "go-segment");
    goPath.setAttribute("class", "segment"); // Clase base
    goPath.setAttribute("d", describeArc(100, 100, 50, -2, 2));
    goPath.style.strokeWidth = "25px";
    segmentContainers.day.appendChild(goPath);

    // 2. Creamos un NUEVO contenedor solo para los 96 segmentos de las horas activas.
    const daySegmentsContainer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    daySegmentsContainer.setAttribute("id", "day-segments-container");
    segmentContainers.day.appendChild(daySegmentsContainer);

    // 3. Llenamos este nuevo contenedor con los 96 segmentos, sin borrar el de 'Go'.
    createRingSegments({
        container: daySegmentsContainer, // Usamos el nuevo contenedor
        segmentCount: 96,
        radius: 50,
        strokeWidth: 25,
        cssClass: 'day-segment',
        totalAngle: 352,
        startAngle: 4,
        gapDegrees: 0.7
    });

    // --- INICIAR EL CICLO DE ACTUALIZACIÓN ---
    setInterval(updateClocks, 1000);
    updateClocks();
}

// Iniciar todo el proceso cuando la página esté lista.
initialize();
