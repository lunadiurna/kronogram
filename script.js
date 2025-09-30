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
 * @param {SVGElement} config.container - El grupo SVG donde se añadirán los segmentos.
 * @param {number} config.segmentCount - Número de segmentos a dibujar.
 * @param {number} config.radius - El radio del anillo.
 * @param {number} config.strokeWidth - El grosor de cada segmento.
 * @param {string} config.cssClass - La clase CSS base para los segmentos.
 * @param {number} [config.totalAngle=360] - El ángulo total que ocupa el anillo.
 * @param {number} [config.startAngle=0] - El ángulo donde empieza el primer segmento.
 * @param {number} [config.gapDegrees=1] - El espacio en grados entre segmentos.
 */
function createRingSegments(config) {
    const { container, segmentCount, radius, strokeWidth, cssClass, totalAngle = 360, startAngle = 0, gapDegrees = 1 } = config;
    
    // Limpiar el contenedor antes de dibujar
    container.innerHTML = ''; 

    // Calcula el ángulo que ocupa cada segmento, restando los espacios
    const anglePerSegment = (totalAngle - (segmentCount * gapDegrees)) / segmentCount;

    for (let i = 0; i < segmentCount; i++) {
        // Calcula los ángulos de inicio y fin para este segmento
        const segmentStartAngle = startAngle + (i * (anglePerSegment + gapDegrees));
        const segmentEndAngle = segmentStartAngle + anglePerSegment;

        // Crea un elemento SVG <path>
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", describeArc(100, 100, radius, segmentStartAngle, segmentEndAngle));
        path.setAttribute("class", `segment ${cssClass} segment-future`); // Estado inicial: futuro
        path.style.strokeWidth = strokeWidth;
        
        // Añade el segmento al contenedor en el DOM
        container.appendChild(path);
    }
}

/**
 * Genera la descripción de un arco SVG (el atributo 'd' de un <path>).
 * @param {number} x - Coordenada X del centro.
 * @param {number} y - Coordenada Y del centro.
 * @param {number} radius - Radio del arco.
 * @param {number} startAngle - Ángulo de inicio en grados.
 * @param {number} endAngle - Ángulo de fin en grados.
 * @returns {string} - El valor para el atributo 'd'.
 */
function describeArc(x, y, radius, startAngle, endAngle) {
    // Convierte un ángulo y radio a coordenadas cartesianas (x, y)
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
    
    if (currentBlock.name === 'go') {
        // Si es de noche, reseteamos los segmentos del día y activamos el de 'Go'
        updateSegmentStates(segmentContainers.day, -1); // -1 para que ninguno esté activo
        goSegment.classList.add('segment-active');
    } else {
        // Si es de día, calculamos el segmento de 10 minutos actual
        goSegment.classList.remove('segment-active');
        const minutesPassedSinceStart = (now - dayStart) / 60000;
        const activeDayIndex = Math.floor(minutesPassedSinceStart / 10);
        updateSegmentStates(segmentContainers.day, activeDayIndex);
    }
    
    // Actualizar panel de información (lógica de fracciones sin cambios)
    const dayEnd = new Date(now).setHours(23, 0, 0, 0);
    let dayPercentPassed = (now < dayStart || now >= dayEnd) ? 100 : ((now - dayStart) / (dayEnd - dayStart)) * 100;
    const dayPercentRemaining = 100 - dayPercentPassed;
    const hoursRemaining = (dayPercentRemaining > 0) ? Math.ceil((23 - (now.getHours() + now.getMinutes()/60))) : 0;
    labels.dayBlockName.innerText = currentBlock.name;
    labels.dayValue.innerText = (dayPercentRemaining / 100).toFixed(2);
    labels.dayFraction.innerText = `${hoursRemaining}/16 hrs`;

    // --- 2. LÓGICA DEL ANILLO SEMANAL ---
    const activeWeekIndex = (now.getDay() === 0) ? 6 : now.getDay() - 1; // Lunes=0
    updateSegmentStates(segmentContainers.week, activeWeekIndex);
    // (Actualizar panel de información...)
    const daysRemainingInWeek = 7 - activeWeekIndex;
    const weekPercentRemaining = 100 - ((activeWeekIndex / 7) * 100);
    labels.weekValue.innerText = (weekPercentRemaining / 100).toFixed(2);
    labels.weekFraction.innerText = `${daysRemainingInWeek}/7 días`;

    // --- 3. LÓGICA DEL ANILLO MENSUAL ---
    const dayOfMonth = now.getDate();
    const activeMonthIndex = Math.ceil(dayOfMonth / 7) - 1; // Semana actual como índice
    updateSegmentStates(segmentContainers.month, activeMonthIndex);
    // (Actualizar panel de información...)
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const totalWeeksInMonth = Math.ceil(daysInMonth / 7);
    const monthPercentRemaining = 100 - (((dayOfMonth - 1) / daysInMonth) * 100);
    labels.monthValue.innerText = (monthPercentRemaining / 100).toFixed(2);
    labels.monthFraction.innerText = `${dayOfMonth}/${daysInMonth} días`;
    labels.monthWeekFraction.innerText = `${activeMonthIndex + 1}/${totalWeeksInMonth} semanas`;

    // --- 4. LÓGICA DEL ANILLO ANUAL ---
    const activeYearIndex = now.getMonth(); // Enero=0
    updateSegmentStates(segmentContainers.year, activeYearIndex);
    // (Actualizar panel de información...)
    const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 1)) / 86400000) + 1;
    const daysInYear = new Date(now.getFullYear(), 1, 29).getDate() === 29 ? 366 : 365;
    const daysRemainingInYear = daysInYear - dayOfYear;
    const yearPercentRemaining = 100 - ((dayOfYear / daysInYear) * 100);
    labels.yearValue.innerText = (yearPercentRemaining / 100).toFixed(2);
    labels.yearFraction.innerText = `${activeYearIndex + 1}/12 meses`;
    labels.yearDaysFraction.innerText = `${daysRemainingInYear}/${daysInYear} días`;
}


// =================================================================================
// 4. INICIALIZACIÓN (Se ejecuta 1 vez al cargar la página)
// =================================================================================

function initialize() {
    console.log("Inicializando Reloj Segmentado...");

    // --- DIBUJAR LOS ANILLOS ---

    // Anillo ANUAL: 12 segmentos
    createRingSegments({
        container: segmentContainers.year,
        segmentCount: 12,
        radius: 90,
        strokeWidth: 18,
        cssClass: 'year-segment',
        gapDegrees: 2
    });

    // Anillo MENSUAL: dibujamos 5 segmentos, JS se encarga de activar los que correspondan
    createRingSegments({
        container: segmentContainers.month,
        segmentCount: 5,
        radius: 70,
        strokeWidth: 18,
        cssClass: 'month-segment',
        gapDegrees: 3
    });

    // Anillo SEMANAL: 7 segmentos
    createRingSegments({
        container: segmentContainers.week,
        segmentCount: 7,
        radius: 50,
        strokeWidth: 18,
        cssClass: 'week-segment',
        gapDegrees: 3
    });
    
    // Anillo DIARIO: el más complejo
    // Primero, creamos el segmento especial 'Go' en la parte superior.
    const goContainer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    goContainer.innerHTML = `<path id="go-segment" class="segment" d="${describeArc(100, 100, 30, -2, 2)}" style="stroke-width: 23px;"></path>`;
    segmentContainers.day.appendChild(goContainer);

    // Luego, creamos los 96 segmentos para las horas activas en el resto del círculo.
    createRingSegments({
        container: segmentContainers.day,
        segmentCount: 96,
        radius: 30,
        strokeWidth: 23,
        cssClass: 'day-segment',
        totalAngle: 352, // Dejamos 8 grados para el segmento 'Go' y sus espacios
        startAngle: 4,   // Empezamos un poco después del segmento 'Go'
        gapDegrees: 0.7
    });

    // --- INICIAR EL CICLO DE ACTUALIZACIÓN ---
    setInterval(updateClocks, 1000);
    updateClocks(); // Llamada inicial para no esperar 1 segundo
}

// Iniciar todo el proceso cuando la página esté lista.
initialize();
