// -----------------------------------------------------
// VARIABLES GLOBALES DEL TORNEO
// -----------------------------------------------------
let jugadores = [];
let fixture = [];
let fechaActual = 0;

// -----------------------------------------------------
// COLORES (si necesitás usar en el futuro)
// -----------------------------------------------------
const colores = {
    empate: "#FFC107",
    textoClaro: "#fff",
    textoOscuro: "#000"
};

// -----------------------------------------------------
// CARGA DE ESTADO PREVIO DEL TORNEO
// -----------------------------------------------------
if (localStorage.getItem("torneo")) {
    const data = JSON.parse(localStorage.getItem("torneo"));
    jugadores = data.jugadores;
    fixture = data.fixture;
    fechaActual = data.fechaActual;
}

// -----------------------------------------------------
// CARGA DE PARTICIPANTES DESDE jugadores.json
// -----------------------------------------------------
fetch("../jugadores.json")
    .then(res => res.json())
    .then(data => {
        if (jugadores.length === 0) {
            jugadores = data.map(j => ({
                ...j,
                puntos: 0,
                PJ: 0,
                V: 0,
                E: 0,
                D: 0,
                bonus: 0,
                ultimos: [],
                bonusStreak: 0
            }));

            fixture = generarFixtureAleatorio(jugadores);
        }

        mostrarFecha();
        actualizarTabla();
        llenarSelectorFechas();

        document.getElementById("selector-fecha").value = "todas";
        mostrarFixtureCompleto();
    });

// ======================================================================
// ██████  FUNCIONES PRINCIPALES DEL TORNEO
// ======================================================================

function mostrarFecha() {
    const cont = document.getElementById("partidos");
    cont.innerHTML = "";
    document.getElementById("fecha-num").textContent = fechaActual + 1;

    let botonContainer = document.getElementById("boton-siguiente-container");
    if (!botonContainer) {
        botonContainer = document.createElement("div");
        botonContainer.id = "boton-siguiente-container";
        botonContainer.style.marginBottom = "10px";
        botonContainer.style.display = "flex";
        botonContainer.style.justifyContent = "center";
        botonContainer.style.alignItems = "center";
        botonContainer.style.gap = "5px";
        document.getElementById("fecha-num").parentNode.appendChild(botonContainer);
    }
    botonContainer.innerHTML = "";

    // BOTÓN FECHA ANTERIOR
    const btnAnterior = document.createElement("button");
    btnAnterior.textContent = "«";
    btnAnterior.disabled = fechaActual === 0;
    btnAnterior.onclick = () => {
        if (fechaActual > 0) {
            fechaActual--;
            mostrarFecha();
            actualizarTabla();
            guardarLocalStorage();
        }
    };

    // SELECTOR DE FECHAS
    const selectorFechas = document.createElement("select");
    fixture.forEach((_, i) => {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = `Fecha ${i + 1}`;
        selectorFechas.appendChild(opt);
    });
    selectorFechas.value = fechaActual;
    selectorFechas.onchange = () => {
        fechaActual = Number(selectorFechas.value);
        mostrarFecha();
        actualizarTabla();
        guardarLocalStorage();
    };

    // BOTÓN SELECT
    selectorFechas.style.backgroundColor = "#d3d3d3";
    selectorFechas.style.color = "#000";
    selectorFechas.style.border = "none";
    selectorFechas.style.borderRadius = "6px";
    selectorFechas.style.padding = "8px 32px";
    selectorFechas.style.textAlign = "center";
    selectorFechas.style.justifyContent = "center";
    selectorFechas.style.fontWeight = "600";
    selectorFechas.style.fontSize = "14px";
    selectorFechas.style.cursor = "pointer";
    selectorFechas.style.marginRight = "8px";
    selectorFechas.style.transition = "background-color 0.3s, transform 0.2s";
    selectorFechas.style.appearance = "none";
    selectorFechas.style.textAlign = "center";
    selectorFechas.style.backgroundImage = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"black\"><path d=\"M7 10l5 5 5-5H7z\"/></svg>')";
    selectorFechas.style.backgroundRepeat = "no-repeat";
    selectorFechas.style.backgroundPosition = "right 10px center";
    selectorFechas.style.backgroundSize = "12px 12px";

    selectorFechas.addEventListener("mouseenter", () => {
        if (!selectorFechas.disabled) selectorFechas.style.backgroundColor = "#bfbfbf";
    });
    selectorFechas.addEventListener("mouseleave", () => {
        selectorFechas.style.backgroundColor = "#d3d3d3";
        selectorFechas.style.transform = "scale(1)";
    });
    selectorFechas.addEventListener("mousedown", () => {
        if (!selectorFechas.disabled) selectorFechas.style.backgroundColor = "#a9a9a9";
        selectorFechas.style.transform = "scale(0.98)";
    });
    selectorFechas.addEventListener("mouseup", () => {
        selectorFechas.style.transform = "scale(1)";
        selectorFechas.style.backgroundColor = "#bfbfbf";
    });

    // BOTÓN FECHA SIGUIENTE
    const btnSiguiente = document.createElement("button");
    btnSiguiente.textContent = "»";
    btnSiguiente.disabled = fechaActual >= fixture.length - 1;
    btnSiguiente.onclick = () => {
        if (fechaActual < fixture.length - 1) {
            fechaActual++;
            mostrarFecha();
            actualizarTabla();
            guardarLocalStorage();
        }
    };

    botonContainer.appendChild(btnAnterior);
    botonContainer.appendChild(selectorFechas);
    botonContainer.appendChild(btnSiguiente);

    const container = document.createElement("div");
    container.className = "partidos-container";

    const partidos = fixture[fechaActual];
    const primeraFila = partidos.slice(0, 6);
    const segundaFila = partidos.slice(6, 12);

    renderPartidosFila(primeraFila, 0, container);
    renderPartidosFila(segundaFila, 6, container);

    cont.appendChild(container);
}



// -----------------------------------------------------
// RENDER DE UNA FILA DE PARTIDOS
// -----------------------------------------------------
function renderPartidosFila(partidos, offset, container) {
    partidos.forEach((p, i) => {
        const div = document.createElement("div");
        div.className = "partido";

        let resultadoTexto = "";
        let resultadoClase = "";

        if (p.resultado === "local") {
            resultadoTexto = `Ganó ${jugadores[p.local].nombre}`;
            resultadoClase = "resultado-dorado";
        } else if (p.resultado === "visitante") {
            resultadoTexto = `Ganó ${jugadores[p.visitante].nombre}`;
            resultadoClase = "resultado-dorado";
        } else if (p.resultado === "empate") {
            resultadoTexto = "Empate";
            resultadoClase = "resultado-gris";
        }

        div.innerHTML = `
            <div class="partido-header">
                <span class="jugador local">${jugadores[p.local].nombre}</span>
                <span class="vs">vs</span>
                <span class="jugador visitante">${jugadores[p.visitante].nombre}</span>
            </div>

            ${resultadoTexto ? `<div class="resultado ${resultadoClase}">${resultadoTexto}</div>` : ""}

            <div class="partido-botones"></div>
        `;

        const divBotones = div.querySelector(".partido-botones");

        if (!p.resultado) {
            divBotones.innerHTML = `
                <div class="resultado-moderno">
                    <div class="res-opcion" onclick="registrarResultado(${fechaActual}, ${offset + i}, 'local')">
                        <div class="res-cuadro"></div>
                        <span>${jugadores[p.local].nombre}</span>
                    </div>

                    <div class="res-opcion empate" onclick="registrarResultado(${fechaActual}, ${offset + i}, 'empate')">
                        <div class="res-cuadro"></div>
                        <span>Empate</span>
                    </div>

                    <div class="res-opcion" onclick="registrarResultado(${fechaActual}, ${offset + i}, 'visitante')">
                        <div class="res-cuadro"></div>
                        <span>${jugadores[p.visitante].nombre}</span>
                    </div>
                </div>
            `;
        } else {
            const edit = document.createElement("button");
            edit.textContent = "Editar";
            edit.classList.add("btn-editar");

            edit.onclick = () => {
                const original = p.resultado;
                p.resultado = null;
                revertirResultado(p, original);
                mostrarFecha();
                actualizarTabla();
                guardarLocalStorage();
            };

            divBotones.appendChild(edit);
        }

        container.appendChild(div);
    });
}

// -----------------------------------------------------
// REGISTRAR UN RESULTADO NUEVO
// -----------------------------------------------------
function registrarResultado(fechaIndex, partidoIndex, resultado) {
    const partido = fixture[fechaIndex][partidoIndex];

    if (partido.resultado) {
        const anterior = partido.resultado;
        partido.resultado = null;
        revertirResultado(partido, anterior);
    }

    partido.resultado = resultado;

    const jLocal = jugadores[partido.local];
    const jVisit = jugadores[partido.visitante];

    aplicarResultado(jLocal, jVisit, resultado);

    reconstruirJugador(jLocal, partido.local);
    reconstruirJugador(jVisit, partido.visitante);

    actualizarTabla();
    mostrarFecha();

    if (fixture[fechaIndex].every(p => p.resultado)) {
        guardarHistorial(fechaIndex);
        renderHistorial();
    }

    guardarLocalStorage();
}

// -----------------------------------------------------
// APLICAR RESULTADO A LOS JUGADORES
// -----------------------------------------------------
function aplicarResultado(jLocal, jVisit, resultado) {
    jLocal.PJ++;
    jVisit.PJ++;

    if (resultado === "local") {
        jLocal.V++;
        jVisit.D++;
        jLocal.puntos += 3;
        jLocal.ultimos.push("V");
        jVisit.ultimos.push("D");
    } else if (resultado === "visitante") {
        jVisit.V++;
        jLocal.D++;
        jVisit.puntos += 3;
        jVisit.ultimos.push("V");
        jLocal.ultimos.push("D");
    } else {
        jLocal.E++;
        jVisit.E++;
        jLocal.puntos++;
        jVisit.puntos++;
        jLocal.ultimos.push("E");
        jVisit.ultimos.push("E");
    }

    if (jLocal.ultimos.length > 5) jLocal.ultimos.shift();
    if (jVisit.ultimos.length > 5) jVisit.ultimos.shift();
}

// -----------------------------------------------------
// REVERTIR CORRECTAMENTE UN RESULTADO (ANTES DE EDITAR)
// -----------------------------------------------------
function revertirResultado(partido, resultadoAnterior) {
    const jLocal = jugadores[partido.local];
    const jVisit = jugadores[partido.visitante];

    if (!resultadoAnterior) return;

    jLocal.PJ--;
    jVisit.PJ--;

    if (resultadoAnterior === "local") {
        jLocal.V--;
        jVisit.D--;
        jLocal.puntos -= 3;
    } else if (resultadoAnterior === "visitante") {
        jVisit.V--;
        jLocal.D--;
        jVisit.puntos -= 3;
    } else {
        jLocal.E--;
        jVisit.E--;
        jLocal.puntos--;
        jVisit.puntos--;
    }

    jLocal.ultimos.pop();
    jVisit.ultimos.pop();

    reconstruirJugador(jLocal, partido.local);
    reconstruirJugador(jVisit, partido.visitante);
}

// -----------------------------------------------------
// RECONSTRUCCIÓN TOTAL DEL JUGADOR DESDE TODO EL FIXTURE
// -----------------------------------------------------
function reconstruirJugador(j, indexJugador) {
    j.PJ = 0;
    j.V = 0;
    j.E = 0;
    j.D = 0;
    j.bonus = 0;
    j.bonusStreak = 0;
    j.ultimos = [];

    const historial = [];

    fixture.forEach(fecha => {
        fecha.forEach(p => {
            if (!p.resultado) return;

            const esLocal = p.local === indexJugador;
            const esVisit = p.visitante === indexJugador;
            if (!esLocal && !esVisit) return;

            j.PJ++;

            let r;
            if (p.resultado === "empate") {
                j.E++;
                r = "E";
            } else if (p.resultado === "local") {
                if (esLocal) { j.V++; r = "V"; } 
                else { j.D++; r = "D"; }
            } else if (p.resultado === "visitante") {
                if (esVisit) { j.V++; r = "V"; } 
                else { j.D++; r = "D"; }
            }

            historial.push(r);
        });
    });

    j.bonusStreak = 0;
    historial.forEach(r => {
        if (r === "V") {
            j.bonusStreak++;
            if (j.bonusStreak === 3) {
                j.bonus++;
                j.bonusStreak = 0;
            }
        } else {
            j.bonusStreak = 0;
        }
    });

    j.ultimos = historial.slice(-5);
    j.puntos = j.V * 3 + j.E + j.bonus;
}

// -----------------------------------------------------
// TABLA DE POSICIONES
// -----------------------------------------------------
function actualizarTabla() {
    const tbody = document.querySelector("#tabla tbody");
    tbody.innerHTML = "";

    const ordenados = [...jugadores].sort((a, b) => b.puntos - a.puntos);

    ordenados.forEach((j, index) => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${j.nombre}</td>
            <td>${j.PJ}</td>
            <td>${j.V}</td>
            <td>${j.E}</td>
            <td>${j.D}</td>
            <td>${j.puntos}</td>
            <td>${j.bonus}</td>
            <td>${j.ultimos.join(" ")}</td>
        `;

        tbody.appendChild(row);
    });
}

// -----------------------------------------------------
// SELECTOR DE FECHAS PARA EL FIXTURE COMPLETO
// -----------------------------------------------------
function llenarSelectorFechas() {
    const sel = document.getElementById("selector-fecha");
    sel.innerHTML = "";

    const optTodas = document.createElement("option");
    optTodas.value = "todas";
    optTodas.textContent = "Todas";
    sel.appendChild(optTodas);

    fixture.forEach((_, i) => {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = `Fecha ${i + 1}`;
        sel.appendChild(opt);
    });

    sel.onchange = () => {
        if (sel.value === "todas") mostrarFixtureCompleto();
        else mostrarFixtureSeleccionado(sel.value);
    };
}

// -----------------------------------------------------
// FIXTURE COMPLETO
// -----------------------------------------------------
function mostrarFixtureCompleto() {
    const cont = document.getElementById("fixture-completo");
    cont.innerHTML = "";

    fixture.forEach((fecha, idx) => {
        const div = document.createElement("div");
        div.className = "fixture-fecha";
        div.innerHTML = `<h3>Fecha ${idx + 1}</h3>`;

        fecha.forEach(p => {
            const item = document.createElement("div");
            item.className = "partido-item";

            const r =
                p.resultado === "local" ? `Ganó ${jugadores[p.local].nombre}` :
                p.resultado === "visitante" ? `Ganó ${jugadores[p.visitante].nombre}` :
                p.resultado === "empate" ? "Empate" : "Pendiente";

            const clase = p.resultado ? `finalizado ${p.resultado}` : "pendiente";

            item.innerHTML = `
                <div class="fila-jugadores">
                    <span>${jugadores[p.local].nombre}</span>
                    <span>vs</span>
                    <span>${jugadores[p.visitante].nombre}</span>
                </div>
                <div class="fila-resultado">
                    <span class="partido-estado ${clase}">${r}</span>
                </div>
            `;

            div.appendChild(item);
        });

        cont.appendChild(div);
    });
}

// -----------------------------------------------------
// FIXTURE DE UNA FECHA ESPECÍFICA
// -----------------------------------------------------
function mostrarFixtureSeleccionado(index) {
    const cont = document.getElementById("fixture-completo");
    cont.innerHTML = "";

    const fecha = fixture[index];

    const div = document.createElement("div");
    div.className = "fixture-fecha";
    div.innerHTML = `<h3>Fecha ${Number(index) + 1}</h3>`;

    fecha.forEach(p => {
        const item = document.createElement("div");
        item.className = "partido-item";

        let r =
            p.resultado === "local" ? `Ganó ${jugadores[p.local].nombre}` :
            p.resultado === "visitante" ? `Ganó ${jugadores[p.visitante].nombre}` :
            p.resultado === "empate" ? "Empate" : "Pendiente";

        const clase = p.resultado ? `finalizado ${p.resultado}` : "pendiente";

        item.innerHTML = `
            <span>${jugadores[p.local].nombre} vs ${jugadores[p.visitante].nombre}</span>
            <span class="partido-estado ${clase}">${r}</span>
        `;

        div.appendChild(item);
    });

    cont.appendChild(div);
}

// -----------------------------------------------------
// GUARDAR HISTORIAL DE UNA FECHA
// -----------------------------------------------------
function guardarHistorial(fechaIndex) {
    const historial = JSON.parse(localStorage.getItem("historial")) || [];

    // Solo guardar la fecha actual
    if (!historial[fechaIndex]) {
        const copiaJugadores = jugadores.map((j, idx) => {
            const jCopy = {
                nombre: j.nombre,
                PJ: 0,
                V: 0,
                E: 0,
                D: 0,
                puntos: 0,
                bonus: 0,
                ultimos: [],
                bonusStreak: 0
            };

            const historialParcial = [];

            // Recorremos solo hasta la fechaIndex
            for (let f = 0; f <= fechaIndex; f++) {
                fixture[f].forEach(p => {
                    if (!p.resultado) return;

                    const esLocal = p.local === idx;
                    const esVisit = p.visitante === idx;
                    if (!esLocal && !esVisit) return;

                    jCopy.PJ++;

                    let r;
                    if (p.resultado === "empate") {
                        jCopy.E++;
                        r = "E";
                    } else if (p.resultado === "local") {
                        if (esLocal) { jCopy.V++; r = "V"; } 
                        else { jCopy.D++; r = "D"; }
                    } else if (p.resultado === "visitante") {
                        if (esVisit) { jCopy.V++; r = "V"; } 
                        else { jCopy.D++; r = "D"; }
                    }

                    historialParcial.push(r);
                });
            }

            // Aplicar bonus por racha de victorias
            let bonusStreak = 0;
            historialParcial.forEach(r => {
                if (r === "V") {
                    bonusStreak++;
                    if (bonusStreak === 3) {
                        jCopy.bonus++;
                        bonusStreak = 0;
                    }
                } else {
                    bonusStreak = 0;
                }
            });

            jCopy.ultimos = historialParcial.slice(-5);
            jCopy.puntos = jCopy.V * 3 + jCopy.E + jCopy.bonus;

            return jCopy;
        });

        historial[fechaIndex] = copiaJugadores;
    }

    localStorage.setItem("historial", JSON.stringify(historial));
}


function renderHistorial() {
    const cont = document.getElementById('historial');
    cont.innerHTML = "";

    const historial = JSON.parse(localStorage.getItem("historial")) || [];

    if (historial.length === 0) {
        cont.innerHTML = "<p>No hay resultados aún.</p>";
        return;
    }

    // Obtener los índices de fechas completadas y ordenarlos
    const fechasCompletadas = historial
        .map((tabla, index) => tabla ? index : null)
        .filter(index => index !== null)
        .sort((a, b) => a - b); // orden ascendente

    fechasCompletadas.forEach(fIndex => {
        const tablaFecha = historial[fIndex];
        if (!tablaFecha) return;

        const titulo = document.createElement('h2');
        titulo.textContent = `Tabla al finalizar Fecha ${fIndex + 1}`;
        cont.appendChild(titulo);

        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Pos</th>
                    <th>Jugador</th>
                    <th>PJ</th>
                    <th>V</th>
                    <th>E</th>
                    <th>D</th>
                    <th>Puntos</th>
                    <th>Bonus</th>
                    <th>Últimos 5 Partidos</th>
                </tr>
            </thead>
        `;

        const tbody = document.createElement("tbody");

        tablaFecha
            .sort((a, b) => b.puntos - a.puntos)
            .forEach((j, index) => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${j.nombre}</td>
                    <td>${j.PJ}</td>
                    <td>${j.V}</td>
                    <td>${j.E}</td>
                    <td>${j.D}</td>
                    <td>${j.puntos}</td>
                    <td>${j.bonus}</td>
                    <td>${(j.ultimos || []).join(" ")}</td>
                `;
                tbody.appendChild(tr);
            });

        table.appendChild(tbody);
        cont.appendChild(table);
    });
}



// -----------------------------------------------------
// GUARDAR ESTADO COMPLETO DEL TORNEO
// -----------------------------------------------------
function guardarLocalStorage() {
    localStorage.setItem("torneo", JSON.stringify({ jugadores, fixture, fechaActual }));
}

// -----------------------------------------------------
// REINICIAR TODO EL TORNEO DESDE CERO
// -----------------------------------------------------
function reiniciarTorneo() {
    if (!confirm("¿Seguro que querés reiniciar el torneo completo?")) return;

    localStorage.removeItem("torneo");
    localStorage.removeItem("historial");

    jugadores = jugadores.map(j => ({
        ...j,
        puntos: 0,
        PJ: 0,
        V: 0,
        E: 0,
        D: 0,
        bonus: 0,
        ultimos: [],
        bonusStreak: 0
    }));

    fixture = generarFixtureAleatorio(jugadores);
    fechaActual = 0;

    guardarLocalStorage();
    location.reload();
}

// -----------------------------------------------------
// GENERAR FIXTURE ALEATORIO (ROUND ROBIN)
// -----------------------------------------------------
function generarFixtureAleatorio(jugadores) {
    const n = jugadores.length;
    const indices = shuffleArray(jugadores.map((_, i) => i));

    const fijo = indices[0];
    let otros = indices.slice(1);

    const fixture = [];

    for (let ronda = 0; ronda < n - 1; ronda++) {
        const fecha = [];
        const actual = [fijo, ...otros];

        for (let i = 0; i < n / 2; i++) {
            let local = actual[i];
            let visitante = actual[n - 1 - i];

            if (ronda % 2 !== 0) [local, visitante] = [visitante, local];

            fecha.push({ local, visitante, resultado: null });
        }

        fixture.push(fecha);
        otros.unshift(otros.pop());
    }

    return fixture;
}

// -----------------------------------------------------
// DESORDENAR ARRAY (UTILIDAD PARA FIXTURE)
// -----------------------------------------------------
function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
