let currentParameterConfigs = {}; 
let currentParameterValues = {}; 
let board = null; 
let functionGraph = null; 
let implicitCurve = null; 
let compiledExpression = null; 
let debounceTimeout = null; 
var storedExpr; 
var chartIgnoreUpdates = false; 
let isImplicit = false;
let hoverDot = null;
let hoverLabel = null;
let hoverGlider = null; 

function detectParameters(expression) { 
    const varRegex = /\b[a-zA-Z_]\w*\b/g; 
    const reserved = ['x', 'y', 'sin', 'cos', 'tan', 'log', 'exp', 'sqrt', 'abs', 'pow', 'JXG', 'create', 'board', 'Math', 'pi', 'e']; 
    let vars = expression.match(varRegex) || []; 
    vars = vars.filter(v => !reserved.includes(v)); 
    return [...new Set(vars)]; 
} 

function createParameterControls(params) { 
    const container = document.getElementById('parameters'); 
    container.innerHTML = ''; 

    params.forEach(param => { 
        const config = currentParameterConfigs[param]; 

        const group = document.createElement('div'); 
        group.className = 'control-group'; 

        const label = document.createElement('label'); 
        label.innerText = `Parametr "${param}":`; 
        label.htmlFor = `label_${param}`; 
        group.appendChild(label); 

        const labelInput = document.createElement('input'); 
        labelInput.type = 'text'; 
        labelInput.id = `label_${param}`; 
        labelInput.placeholder = 'Popisek'; 
        labelInput.value = config.label; 
        group.appendChild(labelInput); 

        const minLabel = document.createElement('span'); 
        minLabel.innerText = 'Min:'; 
        minLabel.htmlFor = `min_${param}`; 
        group.appendChild(minLabel); 

        const minInput = document.createElement('input'); 
        minInput.type = 'number'; 
        minInput.id = `min_${param}`; 
        minInput.value = config.min; 
        group.appendChild(minInput); 

        const maxLabel = document.createElement('span'); 
        maxLabel.innerText = 'Max:'; 
        maxLabel.htmlFor = `max_${param}`; 
        group.appendChild(maxLabel); 

        const maxInput = document.createElement('input'); 
        maxInput.type = 'number'; 
        maxInput.id = `max_${param}`; 
        maxInput.value = config.max; 
        group.appendChild(maxInput); 

        const defLabel = document.createElement('span'); 
        defLabel.innerText = 'Default:'; 
        defLabel.htmlFor = `default_${param}`; 
        group.appendChild(defLabel); 

        const defInput = document.createElement('input'); 
        defInput.type = 'number'; 
        defInput.id = `default_${param}`; 
        defInput.value = config.default; 
        group.appendChild(defInput); 

        labelInput.addEventListener('input', () => { 
            config.label = labelInput.value.trim() !== '' ? labelInput.value.trim() : param; 

            const sliderLabel = document.getElementById(`slider_label_${param}`); 
            if (sliderLabel) { 
                sliderLabel.innerText = config.label + ':'; 
            } 
            scheduleUpdateGraph(); 
        }); 

        minInput.addEventListener('input', () => { 
            let newMin = parseFloat(minInput.value); 
            newMin = isNaN(newMin) ? -5 : newMin; 
            config.min = newMin; 

            if (currentParameterValues[param] < config.min) { 
                currentParameterValues[param] = config.min; 
                defInput.value = currentParameterValues[param]; 
                const slider = document.getElementById(`slider_${param}`); 
                if (slider) { 
                    slider.value = currentParameterValues[param]; 
                } 
                const sliderVal = document.getElementById(`value_${param}`); 
                if (sliderVal) { 
                    sliderVal.innerText = currentParameterValues[param].toFixed(2); 
                } 
            } 

            const sliderMin = document.getElementById(`slider_${param}`); 
            if (sliderMin) { 
                sliderMin.min = config.min; 
            } 
            scheduleUpdateGraph(); 
        }); 

        maxInput.addEventListener('input', () => { 
            let newMax = parseFloat(maxInput.value); 
            newMax = isNaN(newMax) ? 5 : newMax; 
            config.max = newMax; 

            if (currentParameterValues[param] > config.max) { 
                currentParameterValues[param] = config.max; 
                defInput.value = currentParameterValues[param]; 
                const slider = document.getElementById(`slider_${param}`); 
                if (slider) { 
                    slider.value = currentParameterValues[param]; 
                } 
                const sliderVal = document.getElementById(`value_${param}`); 
                if (sliderVal) { 
                    sliderVal.innerText = currentParameterValues[param].toFixed(2); 
                } 
            } 

            const sliderMax = document.getElementById(`slider_${param}`); 
            if (sliderMax) { 
                sliderMax.max = config.max; 
            } 
            scheduleUpdateGraph(); 
        }); 

        defInput.addEventListener('input', () => { 
            let newDefault = parseFloat(defInput.value); 
            newDefault = isNaN(newDefault) ? config.default : newDefault; 
            newDefault = Math.max(newDefault, config.min); 
            newDefault = Math.min(newDefault, config.max); 
            config.default = newDefault; 
            currentParameterValues[param] = newDefault; 
            defInput.value = newDefault; 

            const slider = document.getElementById(`slider_${param}`); 
            if (slider) { 
                slider.value = newDefault; 
            } 
            const sliderVal = document.getElementById(`value_${param}`); 
            if (sliderVal) { 
                sliderVal.innerText = newDefault.toFixed(2); 
            } 
            scheduleUpdateGraph(); 
        }); 

        container.appendChild(group); 

        const sliderGroup = document.createElement('div'); 
        sliderGroup.className = 'slider-group'; 

        const sliderLabel = document.createElement('label'); 
        sliderLabel.htmlFor = `slider_${param}`; 
        sliderLabel.id = `slider_label_${param}`; 
        sliderLabel.innerText = config.label + ':'; 
        sliderGroup.appendChild(sliderLabel); 

        const sliderInput = document.createElement('input'); 
        sliderInput.type = 'range'; 
        sliderInput.id = `slider_${param}`; 
        sliderInput.min = config.min; 
        sliderInput.max = config.max; 
        sliderInput.step = 0.1; 
        sliderInput.value = currentParameterValues[param]; 
        sliderGroup.appendChild(sliderInput); 

        const sliderValue = document.createElement('span'); 
        sliderValue.className = 'slider-value'; 
        sliderValue.id = `value_${param}`; 
        sliderValue.innerText = currentParameterValues[param].toFixed(2); 
        sliderGroup.appendChild(sliderValue); 

        sliderInput.addEventListener('input', () => { 
            const val = parseFloat(sliderInput.value); 
            currentParameterValues[param] = val; 
            sliderValue.innerText = val.toFixed(2); 
            scheduleUpdateGraph(); 
        }); 

        container.appendChild(sliderGroup); 
    }); 
} 

function initializeBoard() { 
    if (!board) { 

        window["zoomTest"] = 1;

        board = JXG.JSXGraph.initBoard('jxgbox', { 
            boundingbox: [-10, 10, 10, -10], 
            axis: true, 
            showCopyright: false,
            showNavigation: false,
            keepaspectratio: true,
            pan: { 
                enabled: true, 
                needshift: false 
            }, 
            zoom: { 
                factorX: 1.2, 
                factorY: 1.2, 
                wheel: true, 
                needShift: false 

            },
            defaultAxes: {
                x: {
                    ticks: {
                        insertTicks: true,
                        minTicksDistance: 1,
                        ticksDistance: 0.5
                    }
                },
                y: {
                    ticks: {
                        insertTicks: true,
                        minTicksDistance: 1,
                        ticksDistance: 1
                    }
                }
            }
        }); 

        function generateTicks(start, end, distance) {
            var ticks = [];
            for (var i = start; i <= end; i += distance) {
                ticks.push(i);
            }
            return ticks;
        }

        function calculateTickDistance(zoomX) {

            if (zoomX > 2) {
                return 0.25;
            }

            if (zoomX > 1.5) {
                return 1;
            }

            if (zoomX > 0.95) {
                return 2;
            }

            if (zoomX > 0.90) {
                return 5;
            }

            return 5;

            const baseTickDistance = 1;

            const tickValues = [1, 2, 5, 10];

            let zoomTest = baseTickDistance / zoomX;

            let tickValue = tickValues[0];
            let exponent = 0;

            while (zoomTest < tickValue) {
                exponent--;
                for (let i = 0; i < tickValues.length; i++) {
                    if (zoomTest >= tickValues[i] * Math.pow(10, exponent)) {
                        tickValue = tickValues[i] * Math.pow(10, exponent);
                    } else {
                        break;
                    }
                }
            }

            return tickValue;
        }

        function updateTicksDistance() {

            const zoomLevel = board.zoomX; 
            const newTicksDistance = 1 / zoomLevel; 

            window["zoomTest"] = calculateTickDistance(Math.max(board.zoomX, board.zoomY));

            board.defaultAxes.x.ticks.ticksDistance = newTicksDistance;
            board.defaultAxes.x.ticks.ticksDistance = newTicksDistance;

        }

        board.on('update', () => { 

            if (chartIgnoreUpdates) { 
                return; 
            } 

            chartIgnoreUpdates = true; 

            updateTicksDistance();

            if (debounceTimeout) { 
                clearTimeout(debounceTimeout); 
            } 
            debounceTimeout = setTimeout(() => { 
                updateFunctionGraph(false); 
            }, 10); 
        }); 

        board.on('move', handleMouseMove);
    } 
} 

function handleMouseMove(e) {
const coords = board.getUsrCoordsOfMouse(e);
const x = coords[0], y = coords[1];
let threshold = 0.5;
let nearestPoint = null;

if (hoverDot) hoverDot.hide();
if (hoverGlider) hoverGlider.hide();
if (hoverLabel) hoverLabel.hide();

if (isImplicit && implicitCurve) {
return; // slow

// Create hoverGlider if it doesn't exist
if (!hoverGlider) {
    hoverGlider = board.create('glider', [x, y, implicitCurve], {
        size: 4,
        color: 'red',
        fixed: true,
        face: 'o',
        highlight: false,
        showInfobox: false
    });
    hoverLabel = board.create('text', [0, 0, ''], {
        anchor: hoverGlider,
        anchorX: 'middle',
        anchorY: 'bottom',
        cssStyle: "margin-bottom: 20px",
        fixed: true,
        highlight: false,
        showInfobox: false
    });
} else {
    hoverGlider.moveTo([x, y], 0);
}

const dx = x - hoverGlider.X();
const dy = y - hoverGlider.Y();
const dist = Math.hypot(dx, dy);

if (dist < threshold) {
    hoverGlider.show();
    hoverLabel.setText(`(${hoverGlider.X().toFixed(2)}, ${hoverGlider.Y().toFixed(2)})`);
    hoverLabel.show();
}
} else if (!isImplicit && functionGraph) {
const scope = { ...currentParameterValues, x };
const fx = compiledExpression.evaluate(scope);
if (fx !== null && !isNaN(fx)) {
    const dist = Math.abs(y - fx);
    if (dist < threshold) {
        nearestPoint = [x, fx];
    }
}

if (nearestPoint) {
    if (!hoverDot) {
        hoverDot = board.create('point', nearestPoint, {
            size: 4,
            color: 'red',
            fixed: true,
            face: 'o',
            highlight: false,
            showInfobox: false
        });
        hoverLabel = board.create('text', [0, 0, ''], {
            anchor: hoverDot,
            anchorX: 'middle',
            anchorY: 'bottom',
            fixed: true,
            highlight: false,
            cssStyle: "margin-bottom: 20px",
            showInfobox: false
        });
    } else {
        hoverDot.setPosition(JXG.COORDS_BY_USER, nearestPoint);
    }
    hoverDot.show();
    hoverLabel.setText(`f(${nearestPoint[0].toFixed(2)}) = ${nearestPoint[1].toFixed(2)}`);
    hoverLabel.show();
} else {
    if (hoverDot) hoverDot.hide();
    if (hoverLabel) hoverLabel.hide();
}
} else {
if (hoverDot) hoverDot.hide();
if (hoverGlider) hoverGlider.hide();
if (hoverLabel) hoverLabel.hide();
}
board.update();
}


function scheduleUpdateGraph() { 
    chartIgnoreUpdates = true; 
    updateFunctionGraph(); 
} 

function updateFunctionGraph(recompile = true) { 
    const expr = storedExpr; 
    if (expr === '') { 
        alert('Výraz nesmí být prázdný.'); 
        return; 
    } 

    compileAndPlot(expr, recompile);
} 

function compileAndPlot(expr, recompile = true) { 

    if (recompile) {
        try { 
        compiledExpression = window.math.compile(expr); 
        } catch (error) { 
            console.log(error); 
            alert('Chyba ve výrazu: ' + error.message); 
            return; 
        } 
    }

    const bbox = board.getBoundingBox(); 
    const xMin = bbox[0]; 
    const xMax = bbox[2]; 
    const yMin = bbox[3]; 
    const yMax = bbox[1]; 

    if (isImplicit) {

        const scope = {};
        Object.keys(currentParameterValues).forEach(p => {
            scope[p] = currentParameterValues[p];
        });

        const f = function(x, y) { 
            scope.x = x;
            scope.y = y;
            try {
                const result = compiledExpression.evaluate(scope);
                return result;
            } catch {
                return Number.NaN; 
            }
        }; 

        if (implicitCurve) { 
            implicitCurve.update(); 
        } else { 

            implicitCurve = board.create('implicitcurve', [f], { 
                strokeColor: 'blue', 
                xmin: xMin, 
                xmax: xMax, 
                ymin: yMin, 
                ymax: yMax,
                grid: true,
                resolution_inner: 50,
                resolution_outer: 50
            }); 
        }

        if (functionGraph) {
            board.removeObject(functionGraph);
            functionGraph = null;
        }

        board.update(); 
    } else { 

        const f = function(x) { 
            const scope = { x }; 
            Object.keys(currentParameterValues).forEach(p => { 
                scope[p] = currentParameterValues[p]; 
            }); 
            try { 
                return compiledExpression.evaluate(scope); 
            } catch { 
                return null; 
            } 
        }; 

        if (functionGraph) { 
            board.removeObject(functionGraph); 
        } 

        if (implicitCurve) {
            board.removeObject(implicitCurve);
            implicitCurve = null;
        }

        functionGraph = board.create('functiongraph', [f, xMin, xMax], { 
            strokeColor: 'blue'
        }); 
        board.update(); 
    } 

    chartIgnoreUpdates = false; 
} 

function updateEquation() { 
    let expr = storedExpr; 
    if (expr === '') { 
        alert('Výraz nesmí být prázdný.'); 
        return; 
    } 

    let isEquation = false; 

    if (expr.includes('=')) { 
        const parts = expr.split('='); 
        if (parts.length !== 2) { 
            alert('Rovnice musí obsahovat pouze jeden "=" znak.'); 
            return; 
        } 
        const left = parts[0].trim(); 
        const right = parts[1].trim(); 
        expr = `(${left}) - (${right})`; 
        isEquation = true; 
    } 

    storedExpr = expr;
    console.log(storedExpr);

    isImplicit = expr.includes('y') || isEquation;

    const params = detectParameters(expr); 

    params.forEach(param => { 
        if (!currentParameterConfigs[param]) { 
            currentParameterConfigs[param] = { 
                label: param, 
                min: -5, 
                max: 5, 
                default: 1 
            }; 
            currentParameterValues[param] = 1; 
        } 
    }); 

    Object.keys(currentParameterConfigs).forEach(param => { 
        if (!params.includes(param)) { 
            delete currentParameterConfigs[param]; 
            delete currentParameterValues[param]; 
        } 
    }); 

    createParameterControls(params); 
    initializeBoard(); 
    updateFunctionGraph(); 
} 

document.getElementById('parseButton').addEventListener('click', () => { 
    storeExpr();
    updateEquation(); 
}); 

function storeExpr() {
    storedExpr = document.getElementById('expression').value.trim(); 
    storedExpr = storedExpr.replaceAll("–", '-');
}

window.onload = () => { 
    const exampleExpression = 'a * sin(b * x) + c'; 

    document.getElementById('expression').value = exampleExpression; 
    storeExpr();

    const params = detectParameters(exampleExpression); 
    params.forEach(param => { 
        currentParameterConfigs[param] = { label: param, min: -5, max: 5, default: 1 }; 
        currentParameterValues[param] = 1; 
    }); 
    createParameterControls(params); 
    initializeBoard(); 
    updateFunctionGraph(); 
}; 