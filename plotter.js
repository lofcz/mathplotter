class FunctionGrapher {
    constructor() {
        this.currentParameterConfigs = {}; 
        this.currentParameterValues = {}; 
        this.board = null; 
        this.functionGraph = null; 
        this.implicitCurve = null; 
        this.compiledExpression = null; 
        this.debounceTimeout = null; 
        this.storedExpr = ''; 
        this.chartIgnoreUpdates = false; 
        this.isImplicit = false;
        this.hoverDot = null;
        this.hoverLabel = null;
        this.hoverGlider = null;

        // Bind callbacks to ensure 'this' refers to the class instance
        this.handleMouseMove = this.handleMouseMove.bind(this);
    }

    detectParameters(expression) { 
        const varRegex = /\b[a-zA-Z_]\w*\b/g; 
        const reserved = [
            'x', 'y', 'acos', 'acosh', 'acot', 'acoth', 'acsc', 'acsch', 'asec', 'asech',
            'asin', 'asinh', 'atan', 'atan2', 'atanh', 'cos', 'cosh', 'cot', 'coth', 'csc',
            'csch', 'sec', 'sech', 'sin', 'sinh', 'tan', 'tanh', 'isZero', 'isPrime', 
            'isPositive', 'isNegative', 'isNaN', 'zeta', 'erf', 'randomInt', 'random', 
            'pickRandom', 'lgamma', 'factorial', 'size', 'and', 'not', 'or', 'xor', 'abs', 
            'add', 'ceil', 'cube', 'divide', 'expm1', 'fix', 'floor', 'gcd', 'log10', 
            'log1p', 'log2', 'mod', 'multiply', 'round', 'substract', 'sum', 'log', 'exp', 
            'sqrt', 'pow', 'JXG', 'create', 'board', 'Math', 'pi', 'e', 'mean', 'min', 
            'mode', 'prod', 'std', 'variance', 'mad', 'cumsum'
        ]; 
        let vars = expression.match(varRegex) || []; 
        vars = vars.filter(v => !reserved.includes(v)); 
        return [...new Set(vars)]; 
    } 

    createParameterControls(params) { 
        const container = document.getElementById('parameters'); 
        container.innerHTML = ''; 

        params.forEach(param => { 
            const config = this.currentParameterConfigs[param]; 

            // Control Group for Parameter Configuration
            const group = document.createElement('div'); 
            group.className = 'control-group'; 

            // Label Input
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

            // Min Input
            const minLabel = document.createElement('span'); 
            minLabel.innerText = 'Min:'; 
            minLabel.htmlFor = `min_${param}`; 
            group.appendChild(minLabel); 

            const minInput = document.createElement('input'); 
            minInput.type = 'number'; 
            minInput.id = `min_${param}`; 
            minInput.value = config.min; 
            group.appendChild(minInput); 

            // Max Input
            const maxLabel = document.createElement('span'); 
            maxLabel.innerText = 'Max:'; 
            maxLabel.htmlFor = `max_${param}`; 
            group.appendChild(maxLabel); 

            const maxInput = document.createElement('input'); 
            maxInput.type = 'number'; 
            maxInput.id = `max_${param}`; 
            maxInput.value = config.max; 
            group.appendChild(maxInput); 

            // Default Input
            const defLabel = document.createElement('span'); 
            defLabel.innerText = 'Default:'; 
            defLabel.htmlFor = `default_${param}`; 
            group.appendChild(defLabel); 

            const defInput = document.createElement('input'); 
            defInput.type = 'number'; 
            defInput.id = `default_${param}`; 
            defInput.value = config.default; 
            group.appendChild(defInput); 

            // Event Listeners for Config Inputs
            labelInput.addEventListener('input', () => { 
                config.label = labelInput.value.trim() !== '' ? labelInput.value.trim() : param; 

                const sliderLabel = document.getElementById(`slider_label_${param}`); 
                if (sliderLabel) { 
                    sliderLabel.innerText = config.label + ':'; 
                } 
                this.scheduleUpdateGraph(); 
            }); 

            minInput.addEventListener('input', () => { 
                let newMin = parseFloat(minInput.value); 
                newMin = isNaN(newMin) ? -5 : newMin; 
                config.min = newMin; 

                if (this.currentParameterValues[param] < config.min) { 
                    this.currentParameterValues[param] = config.min; 
                    defInput.value = this.currentParameterValues[param]; 
                    const slider = document.getElementById(`slider_${param}`); 
                    if (slider) { 
                        slider.value = this.currentParameterValues[param]; 
                    } 
                    const sliderVal = document.getElementById(`value_${param}`); 
                    if (sliderVal) { 
                        sliderVal.innerText = this.currentParameterValues[param].toFixed(2); 
                    } 
                } 

                const sliderMin = document.getElementById(`slider_${param}`); 
                if (sliderMin) { 
                    sliderMin.min = config.min; 
                } 
                this.scheduleUpdateGraph(); 
            }); 

            maxInput.addEventListener('input', () => { 
                let newMax = parseFloat(maxInput.value); 
                newMax = isNaN(newMax) ? 5 : newMax; 
                config.max = newMax; 

                if (this.currentParameterValues[param] > config.max) { 
                    this.currentParameterValues[param] = config.max; 
                    defInput.value = this.currentParameterValues[param]; 
                    const slider = document.getElementById(`slider_${param}`); 
                    if (slider) { 
                        slider.value = this.currentParameterValues[param]; 
                    } 
                    const sliderVal = document.getElementById(`value_${param}`); 
                    if (sliderVal) { 
                        sliderVal.innerText = this.currentParameterValues[param].toFixed(2); 
                    } 
                } 

                const sliderMax = document.getElementById(`slider_${param}`); 
                if (sliderMax) { 
                    sliderMax.max = config.max; 
                } 
                this.scheduleUpdateGraph(); 
            }); 

            defInput.addEventListener('input', () => { 
                let newDefault = parseFloat(defInput.value); 
                newDefault = isNaN(newDefault) ? config.default : newDefault; 
                newDefault = Math.max(newDefault, config.min); 
                newDefault = Math.min(newDefault, config.max); 
                config.default = newDefault; 
                this.currentParameterValues[param] = newDefault; 
                defInput.value = newDefault; 

                const slider = document.getElementById(`slider_${param}`); 
                if (slider) { 
                    slider.value = newDefault; 
                } 
                const sliderVal = document.getElementById(`value_${param}`); 
                if (sliderVal) { 
                    sliderVal.innerText = newDefault.toFixed(2); 
                } 
                this.scheduleUpdateGraph(); 
            }); 

            container.appendChild(group); 

            // Slider Group for Parameter
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
            sliderInput.value = this.currentParameterValues[param]; 
            sliderGroup.appendChild(sliderInput); 

            const sliderValue = document.createElement('span'); 
            sliderValue.className = 'slider-value'; 
            sliderValue.id = `value_${param}`; 
            sliderValue.innerText = this.currentParameterValues[param].toFixed(2); 
            sliderGroup.appendChild(sliderValue); 

            sliderInput.addEventListener('input', () => { 
                const val = parseFloat(sliderInput.value); 
                this.currentParameterValues[param] = val; 
                sliderValue.innerText = val.toFixed(2); 
                this.scheduleUpdateGraph(); 
            }); 

            container.appendChild(sliderGroup); 
        }); 
    }

    initializeBoard() { 
        if (!this.board) { 

            window["zoomTest"] = 1;

            this.board = JXG.JSXGraph.initBoard('jxgbox', { 
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

            // Tick Distance Calculation
            this.board.on('update', () => { 
                if (this.chartIgnoreUpdates) { 
                    return; 
                } 

                this.chartIgnoreUpdates = true; 

                this.updateTicksDistance();

                if (this.debounceTimeout) { 
                    clearTimeout(this.debounceTimeout); 
                } 
                this.debounceTimeout = setTimeout(() => { 
                    this.updateFunctionGraph(false); 
                }, 10); 
            }); 

            this.board.on('move', this.handleMouseMove);
        } 
    }

    generateTicks(start, end, distance) {
        let ticks = [];
        for (let i = start; i <= end; i += distance) {
            ticks.push(i);
        }
        return ticks;
    }

    calculateTickDistance(zoomX) {
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
    }

    updateTicksDistance() {
        const zoomLevel = Math.max(this.board.zoomX, this.board.zoomY);
        const newTicksDistance = this.calculateTickDistance(zoomLevel);

        window["zoomTest"] = newTicksDistance;

        if (this.board.defaultAxes.x) {
            this.board.defaultAxes.x.ticks.ticksDistance = newTicksDistance;
        }
        if (this.board.defaultAxes.y) {
            this.board.defaultAxes.y.ticks.ticksDistance = newTicksDistance;
        }

        this.board.update();
    }

    handleMouseMove(e) {
        const coords = this.board.getUsrCoordsOfMouse(e);
        const x = coords[0], y = coords[1];
        const threshold = 0.5;
        let nearestPoint = null;

        if (this.hoverDot) this.hoverDot.hide();
        if (this.hoverGlider) this.hoverGlider.hide();
        if (this.hoverLabel) this.hoverLabel.hide();

        if (this.isImplicit && this.implicitCurve) {
            // Implicit curves are slow to handle hover
            return;

            // The following code is unreachable due to the return statement
            /*
            if (!this.hoverGlider) {
                this.hoverGlider = this.board.create('glider', [x, y, this.implicitCurve], {
                    size: 4,
                    color: 'red',
                    fixed: true,
                    face: 'o',
                    highlight: false,
                    showInfobox: false
                });
                this.hoverLabel = this.board.create('text', [0, 0, ''], {
                    anchor: this.hoverGlider,
                    anchorX: 'middle',
                    anchorY: 'bottom',
                    cssStyle: "margin-bottom: 20px",
                    fixed: true,
                    highlight: false,
                    showInfobox: false
                });
            } else {
                this.hoverGlider.moveTo([x, y], 0);
            }

            const dx = x - this.hoverGlider.X();
            const dy = y - this.hoverGlider.Y();
            const dist = Math.hypot(dx, dy);

            if (dist < threshold) {
                this.hoverGlider.show();
                this.hoverLabel.setText(`(${this.hoverGlider.X().toFixed(2)}, ${this.hoverGlider.Y().toFixed(2)})`);
                this.hoverLabel.show();
            }
            */
        } else if (!this.isImplicit && this.functionGraph) {
            const scope = { ...this.currentParameterValues, x };
            let fx;
            try {
                fx = this.compiledExpression.evaluate(scope);
            } catch {
                fx = null;
            }

            if (fx !== null && !isNaN(fx) && typeof fx === 'number') {
                const dist = Math.abs(y - fx);
                if (dist < threshold) {
                    nearestPoint = [x, fx];
                }
            }

            if (nearestPoint) {
                if (!this.hoverDot) {
                    this.hoverDot = this.board.create('point', nearestPoint, {
                        size: 4,
                        color: 'red',
                        fixed: true,
                        face: 'o',
                        highlight: false,
                        showInfobox: false
                    });
                    this.hoverLabel = this.board.create('text', [0, 0, ''], {
                        anchor: this.hoverDot,
                        anchorX: 'middle',
                        anchorY: 'bottom',
                        fixed: true,
                        highlight: false,
                        cssStyle: "margin-bottom: 20px",
                        showInfobox: false
                    });
                } else {
                    this.hoverDot.setPosition(JXG.COORDS_BY_USER, nearestPoint);
                }
                this.hoverDot.show();

                this.hoverLabel.setText(`f(${nearestPoint[0].toFixed(2)}) = ${(nearestPoint[1].toFixed(2) ?? 0)}`);
                this.hoverLabel.show();
            } else {
                if (this.hoverDot) this.hoverDot.hide();
                if (this.hoverLabel) this.hoverLabel.hide();
            }
        } else {
            if (this.hoverDot) this.hoverDot.hide();
            if (this.hoverGlider) this.hoverGlider.hide();
            if (this.hoverLabel) this.hoverLabel.hide();
        }
        this.board.update();
    }

    scheduleUpdateGraph() { 
        this.chartIgnoreUpdates = true; 
        this.updateFunctionGraph(); 
    } 

    updateFunctionGraph(recompile = true) { 
        const expr = this.storedExpr; 
        if (expr === '') { 
            alert('Výraz nesmí být prázdný.'); 
            return; 
        } 

        this.compileAndPlot(expr, recompile);
    } 

    compileAndPlot(expr, recompile = true) { 

        if (recompile) {
            try { 
                this.compiledExpression = window.math.compile(expr); 
            } catch (error) { 
                console.log(error); 
                alert('Chyba ve výrazu: ' + error.message); 
                return; 
            } 
        }

        const bbox = this.board.getBoundingBox(); 
        const xMin = bbox[0]; 
        const xMax = bbox[2]; 
        const yMin = bbox[3]; 
        const yMax = bbox[1]; 

        if (this.isImplicit) {

            const scope = {};
            Object.keys(this.currentParameterValues).forEach(p => {
                scope[p] = this.currentParameterValues[p];
            });

            const f = (x, y) => { 
                scope.x = x;
                scope.y = y;
                try {
                    const result = this.compiledExpression.evaluate(scope);
                    return result;
                } catch {
                    return Number.NaN; 
                }
            }; 

            if (this.implicitCurve) { 
                this.implicitCurve.update(); 
            } else { 

                this.implicitCurve = this.board.create('implicitcurve', [f], { 
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

            if (this.functionGraph) {
                this.board.removeObject(this.functionGraph);
                this.functionGraph = null;
            }

            this.board.update(); 
        } else { 

            const f = (x) => { 
                const scope = { x }; 
                Object.keys(this.currentParameterValues).forEach(p => { 
                    scope[p] = this.currentParameterValues[p]; 
                }); 
                try { 
                    return this.compiledExpression.evaluate(scope); 
                } catch { 
                    return null; 
                } 
            }; 

            if (this.functionGraph) { 
                this.board.removeObject(this.functionGraph); 
            } 

            if (this.implicitCurve) {
                this.board.removeObject(this.implicitCurve);
                this.implicitCurve = null;
            }

            this.functionGraph = this.board.create('functiongraph', [f, xMin, xMax], { 
                strokeColor: 'blue'
            }); 
            this.board.update(); 
        } 

        this.chartIgnoreUpdates = false; 
    } 

    updateEquation(knownPars = [], forceRefresh = false) { 
        let expr = this.storedExpr; 
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

        this.storedExpr = expr;
        this.isImplicit = expr.includes('y') || isEquation;

        const params = this.detectParameters(expr); 

        params.forEach(param => { 

            let matchingKnownParam = knownPars.find(x => x.name === param);

            if (forceRefresh || !this.currentParameterConfigs[param]) { 
                this.currentParameterConfigs[param] = { 
                    label: param, 
                    min: matchingKnownParam?.min || -5, 
                    max: matchingKnownParam?.max || 5, 
                    default: matchingKnownParam?.value || 1 
                }; 
                this.currentParameterValues[param] = matchingKnownParam?.value || 1; 
            }
        }); 

        Object.keys(this.currentParameterConfigs).forEach(param => { 
            if (!params.includes(param)) { 
                delete this.currentParameterConfigs[param]; 
                delete this.currentParameterValues[param]; 
            } 
        }); 

        this.createParameterControls(params); 
        this.initializeBoard(); 
        this.updateFunctionGraph(); 
    } 

    storeExpr(expr) {
        this.storedExpr = expr.trim();
        this.storedExpr = this.storedExpr.replaceAll("–", '-');
        return this.storedExpr;
    }

    getInputExpr() {
        return document.getElementById('expression').value;
    }

    init() { 
        const exampleExpression = 'a * sin(b * x) + c'; 

        document.getElementById('expression').value = exampleExpression; 
        this.storeExpr(this.getInputExpr());

        const params = this.detectParameters(exampleExpression); 
        params.forEach(param => { 
            this.currentParameterConfigs[param] = { label: param, min: -5, max: 5, default: 1 }; 
            this.currentParameterValues[param] = 1; 
        }); 
        this.createParameterControls(params); 
        this.initializeBoard(); 
        this.updateFunctionGraph(); 

        // Bind Parse Button
        document.getElementById('parseButton').addEventListener('click', () => { 
            this.storeExpr(this.getInputExpr());
            this.updateEquation(); 
        }); 
    }

    plot(expression, pars = []) {
        let stored = this.storeExpr(expression);
        document.getElementById('expression').value = stored;
        this.updateEquation(pars, true); 
    }
}

var plotter = new FunctionGrapher();
plotter.init();