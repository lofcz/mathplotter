class FunctionGrapher {
    constructor() {
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
        this.functions = [];
        this.colors = ['blue', 'red', 'green', 'orange', 'purple', 'brown', 'cyan', 'magenta'];
        this.parameterConfigs = {};
        this.parameterValues = {};  

        // Bind callbacks to ensure 'this' refers to the class instance
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleUpdate = this.handleUpdate.bind(this);
        this.handleMove = this.handleMove.bind(this);
        this.parseButtonHandler = this.parseButtonHandler.bind(this);
        this.isThrottled = false;
    }

    // Metoda k vytvoření unikátního ID pro každou funkci
    generateFunctionId() {
        return 'fn_' + Math.random().toString(36).slice(2, 11);
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

    // Nová metoda pro aktualizaci parametrů na základě všech aktuálních funkcí
    updateParametersFromFunctions() {
        // Sada všech použitých parametrů ve všech funkcích
        const allParams = new Set();
        this.functions.forEach(func => {
            const params = this.detectParameters(func.expression);
            params.forEach(p => allParams.add(p));
        });

        // Konvertovat na pole pro snadné iterace
        const paramsArray = Array.from(allParams);

        // Přidat nové parametry a initialize jejich konfigurace, pokud nejsou již přítomny
        paramsArray.forEach(param => {
            if (!this.parameterConfigs[param]) {
                this.parameterConfigs[param] = { 
                    label: param, 
                    min: -5, 
                    max: 5, 
                    default: 1 
                }; 
                this.parameterValues[param] = this.parameterConfigs[param].default; 
            }
        });

        // Odstranit parametry, které již nejsou použity
        Object.keys(this.parameterConfigs).forEach(param => { 
            if (!allParams.has(param)) { 
                delete this.parameterConfigs[param]; 
                delete this.parameterValues[param]; 
            } 
        }); 

        // Aktualizovat UI ovládací prvky
        this.createParameterControls(); 
        this.updateFunctionGraph(); 
    } 

    createParameterControls() {
        const container = document.getElementById('parameters');
        container.innerHTML = ''; // Vyčistit předchozí parametry

        const params = Object.keys(this.parameterConfigs);

        if (params.length === 0) return;

        params.forEach(param => {
            const config = this.parameterConfigs[param];

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

                if (this.parameterValues[param] < config.min) {
                    this.parameterValues[param] = config.min;
                    defInput.value = this.parameterValues[param];
                    const slider = document.getElementById(`slider_${param}`);
                    if (slider) {
                        slider.value = this.parameterValues[param];
                    }
                    const sliderVal = document.getElementById(`value_${param}`);
                    if (sliderVal) {
                        sliderVal.innerText = this.parameterValues[param].toFixed(2);
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

                if (this.parameterValues[param] > config.max) {
                    this.parameterValues[param] = config.max;
                    defInput.value = this.parameterValues[param];
                    const slider = document.getElementById(`slider_${param}`);
                    if (slider) {
                        slider.value = this.parameterValues[param];
                    }
                    const sliderVal = document.getElementById(`value_${param}`);
                    if (sliderVal) {
                        sliderVal.innerText = this.parameterValues[param].toFixed(2);
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
                this.parameterValues[param] = newDefault;
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

            group.appendChild(document.createElement('br')); // Oddělení

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
            sliderInput.value = this.parameterValues[param];
            sliderGroup.appendChild(sliderInput);

            const sliderValue = document.createElement('span');
            sliderValue.className = 'slider-value';
            sliderValue.id = `value_${param}`;
            sliderValue.innerText = this.parameterValues[param].toFixed(2);
            sliderGroup.appendChild(sliderValue);

            sliderInput.addEventListener('input', () => {
                const val = parseFloat(sliderInput.value);
                this.parameterValues[param] = val;
                sliderValue.innerText = val.toFixed(2);
                this.scheduleUpdateGraph();
            });

            group.appendChild(sliderGroup);

            container.appendChild(group);
        });
    } 

    initializeBoard() { 
        if (!this.board) { 

            this.board = JXG.JSXGraph.initBoard('jxgbox', { 
                boundingbox: [-10, 10, 10, -10], 
                axis: true, 
                showCopyright: false,
                showNavigation: false,
                keepaspectratio: true,
                grid: false,
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

            this.board.on('update', this.handleUpdate);
            this.board.on('move', this.handleMove);
        } 
    }

    handleUpdate() { 
        if (this.chartIgnoreUpdates) { 
            return; 
        } 

        this.chartIgnoreUpdates = true; 

        if (this.debounceTimeout) { 
            clearTimeout(this.debounceTimeout); 
        } 
        this.debounceTimeout = setTimeout(() => { 
            this.updateFunctionGraph(false); 
        }, 5); 
    }

    handleMove(e) {
        if (!this.isThrottled) {
            this.handleMouseMove(e);
            this.isThrottled = true;
            requestAnimationFrame(() => {
                this.isThrottled = false;
            });
        }
    }

    handleMouseMove(e) {
        const coords = this.board.getUsrCoordsOfMouse(e);
        const x = coords[0], y = coords[1];
        const threshold = 0.5;
        let anyToggled = false;
    
        // Skrýt všechny hover objekty před kontrolou
        this.functions.forEach(func => {
            if (func.hoverDot) func.hoverDot.hide();
            if (func.hoverLabel) func.hoverLabel.hide();
        });
    
        // Pro každou funkci zkontrolovat blízkost
        this.functions.forEach(currentFunction => {
            if (currentFunction.isImplicit && currentFunction.graph) {
                // Implicitní křivky jsou náročné na hover, přeskočíme
                return;
            } else if (!currentFunction.isImplicit && currentFunction.graph) {
                const scope = { ...this.parameterValues, x };
                let fx;
                try {
                    fx = currentFunction.compiledExpression.evaluate(scope);
                } catch {
                    fx = null;
                }
    
                if (fx !== null && !isNaN(fx) && typeof fx === 'number') {
                    const dist = Math.abs(y - fx);
                    if (dist < threshold) {
                        const nearestPoint = [x, fx];
                        // Vytvoření hover bodu, pokud neexistuje
                        if (!currentFunction.hoverDot) {
                            currentFunction.hoverDot = this.board.create('point', nearestPoint, {
                                size: 4,
                                color: currentFunction.color,
                                fixed: true,
                                face: 'o',
                                highlight: false,
                                showInfobox: false
                            });
                            currentFunction.hoverLabel = this.board.create('text', [0, 0, ''], {
                                anchor: currentFunction.hoverDot,
                                anchorX: 'middle',
                                anchorY: 'bottom',
                                cssStyle: "margin-bottom: 20px",
                                fixed: true,
                                highlight: false,
                                showInfobox: false
                            });
                        } else {
                            currentFunction.hoverDot.setPosition(JXG.COORDS_BY_USER, nearestPoint);
                        }

                        currentFunction.hoverDot.show();
                        currentFunction.hoverLabel.setText(`f(${nearestPoint[0].toFixed(2)}) = ${(nearestPoint[1].toFixed(2) ?? 0)}`);
                        currentFunction.hoverLabel.show();
                        anyToggled = true;
                    }
                }
            }
        });
    
        if (anyToggled) {
            this.board.update();
        }
    }

    scheduleUpdateGraph() { 
        this.chartIgnoreUpdates = true; 
        this.updateFunctionGraph(false, true); 
    } 

    updateFunctionGraph(recompile = true, forceRecomutePoints = false) {

        const bbox = this.board.getBoundingBox();
        const xMin = bbox[0];
        const xMax = bbox[2];
        const yMin = bbox[3];
        const yMax = bbox[1];

        this.functions.forEach(currentFunction => {
            this.compileAndPlotFunction(currentFunction, recompile, {
                xMin: xMin,
                xMax: xMax,
                yMin: yMin,
                yMax: yMax
            }, forceRecomutePoints);
        });
        this.chartIgnoreUpdates = true;
        this.board.update();
        this.chartIgnoreUpdates = false;
    }

    compileAndPlotFunction(currentFunction, recompile = true, bbox = {}, forceRecomutePoints = false) {
        if (recompile || !currentFunction.compiledExpression) {
            try {
                currentFunction.compiledExpression = window.math.compile(currentFunction.expression);
            } catch (error) {
                console.log(error);
                alert('Chyba ve výrazu: ' + error.message);
                return;
            }
        }
        
        const { xMin, xMax, yMin, yMax } = bbox;
        const scope = { ...this.parameterValues };
        const f = currentFunction.isImplicit
        ? (x, y) => {
            try {
                scope.x = x;
                scope.y = y;
                return currentFunction.compiledExpression.evaluate(scope);
            } catch {
                return Number.NaN;
            }
        }
        : (x) => {
            scope.x = x;
            try {
                return currentFunction.compiledExpression.evaluate(scope);
            } catch {
                return null;
            }
        };

        if (currentFunction.isImplicit) {
            if (currentFunction.graph) {
                currentFunction.graph.updateRenderer();
            } else {
                currentFunction.graph = this.board.create('implicitcurve', [f], {
                    strokeColor: currentFunction.color,
                    xmin: xMin,
                    xmax: xMax,
                    ymin: yMin,
                    ymax: yMax,
                    grid: true,
                    resolution_inner: 50,
                    resolution_outer: 50
                });
            }
        } else {
            if (currentFunction.graph) {

                //this.board.removeObject(currentFunction.graph);

                if (forceRecomutePoints || !(currentFunction.prevXMin == xMin && currentFunction.prevXMax === xMax)) {
           
                    const samples = this.adaptiveSampling(f, xMin, xMax, 1000); // 1000 je maximální počet bodů
                    const newDataX = samples.map(sample => sample[0]);
                    const newDataY = samples.map(sample => sample[1]);

                    currentFunction.graph.dataX = newDataX;
                    currentFunction.graph.dataY = newDataY;

                    currentFunction.graph.updateRenderer();
                    currentFunction.prevXMin = xMin;
                    currentFunction.prevXMax = xMax;
                }
            }
            else {
                currentFunction.graph = this.board.create('functiongraph', [f, xMin, xMax], {
                    strokeColor: currentFunction.color
                });
            }
        }
    }

    adaptiveSampling(f, xMin, xMax, maxPoints) {
        const samples = [];
        const stack = [[xMin, xMax]];
        
        while (stack.length > 0 && samples.length < maxPoints) {
            const [a, b] = stack.pop();
            const mid = (a + b) / 2;
            const fa = f(a);
            const fb = f(b);
            const fmid = f(mid);
            
            if (Math.abs((fa + fb) / 2 - fmid) > 0.1 || (b - a) > (xMax - xMin) / 100) {
                stack.push([a, mid]);
                stack.push([mid, b]);
            } else {
                samples.push([a, fa]);
                if (samples.length === maxPoints - 1) {
                    samples.push([b, fb]);
                    break;
                }
            }
        }
        
        if (samples.length < maxPoints) {
            samples.push([xMax, f(xMax)]);
        }
        
        // Seřazení vzorků podle x hodnoty
        samples.sort((a, b) => a[0] - b[0]);
        return samples;
    }
    

    storeExpr(expr) {
        let stored = expr.trim();
        stored = stored.replaceAll("–", '-');
        // Automatický převod rovnice s '=' na formát ((lhs)) - (rhs)
        if (stored.includes('=')) {
            const parts = stored.split('=');
            if (parts.length !== 2) {
                alert('Rovnice musí obsahovat pouze jeden "=" znak.');
                return stored; // Vrátíme původní výraz bez převedení
            }
            const lhs = '(' + parts[0].trim() + ')';
            const rhs = '(' + parts[1].trim() + ')';
            stored = `(${lhs}) - (${rhs})`;
        }
        return stored;
    }


    getInputExpr() {
        return document.getElementById('expression').value;
    }

    // Metoda pro vyčištění existujících funkcí a jejich grafů
    clearFunctions() {
        this.functions.forEach(fn => {
            if (fn.graph) {
                this.board.removeObject(fn.graph);
            }
            if (fn.hoverDot) {
                this.board.removeObject(fn.hoverDot);
            }
            if (fn.hoverLabel) {
                this.board.removeObject(fn.hoverLabel);
            }
        });
        
        this.functions = [];
    }

    parseSingleExpression(input) {
        const funcs = input.split(';').map(expr => expr.trim().replaceAll("–", '-')).filter(expr => expr.length > 0);
        if (funcs.length === 0) {
            alert('Zadejte alespoň jeden výraz.');
            return null;
        }

        return funcs;
    }

    init() {
        // Bind Parse Button
        document.getElementById('parseButton').addEventListener('click', this.parseButtonHandler);

        const input = this.getInputExpr();
        this.plotInternal(input);
    }

    parseButtonHandler(event) {
        const input = this.getInputExpr();
        try {
            this.plotInternal(input);
        } catch (error) {
            console.error(error);
            alert('Chyba při parsování výrazů.');
        }
    }

    plot(expressions) {
        this.plotInternal(expressions, true, true);
    }

    // Upravená metoda plot pro podporu jedné nebo více funkcí
    plotInternal(expressions, forceRefresh = false, syncInput = false) {
        // Inicializace board před zpracováním funkcí
        this.initializeBoard();

        // Vyčištění existujících funkcí a grafů
        this.clearFunctions();

        // Převeď vstup na pole funkcí
        let funcs = [];
        if (typeof expressions === 'string') {
            funcs = this.parseSingleExpression(expressions);
        } else if (Array.isArray(expressions)) {
            funcs = expressions;
        } else {
            console.error('Invalid input for plot. Must be a string or an array of functions.');
            return;
        }

        let fnDump = "";

        // Proces všech funkcí
        funcs.forEach(funcObj => {

            if (typeof funcObj === "string") {
                funcObj = {
                    fn: funcObj
                }
            }

            if (syncInput) {
                if (funcObj.fn.length) {
                    fnDump = `${fnDump}${funcObj.fn};`;
                }
            }

            const functionId = this.generateFunctionId();
            const storedExpr = this.storeExpr(funcObj.fn);
            const isEquation = storedExpr.includes('=');
            const isImplicit = isEquation || storedExpr.includes('y');

            const newFunction = {
                id: functionId,
                expression: storedExpr,
                originalExpression: funcObj.fn,
                isImplicit: isImplicit,
                compiledExpression: null,
                graph: null,
                hoverDot: null,
                hoverLabel: null,
                color: this.colors[this.functions.length % this.colors.length]
            };

            // Detekce parametrů
            const params = this.detectParameters(newFunction.expression);

            // Aktualizace globálních parametrů
            params.forEach(param => {
                if (true || !this.parameterConfigs[param]) {
                    // Najděte známé parametry
                    let matchingKnownParam = funcObj.pars?.find(x => x.name === param);
                    this.parameterConfigs[param] = {
                        label: matchingKnownParam?.label || param,
                        min: matchingKnownParam?.min ?? -5,
                        max: matchingKnownParam?.max ?? 5,
                        default: matchingKnownParam?.value ?? 1
                    };
                    this.parameterValues[param] = this.parameterConfigs[param].default;
                }
            });

            this.functions.push(newFunction);
        });

        this.updateParametersFromFunctions();

        this.createParameterControls(); // Vytvoření jednotných ovládacích prvků pro parametry
        this.updateFunctionGraph(); // Vykreslení všech funkcí najednou
        this.board.update();

        if (syncInput) {
            if (typeof expressions === 'string') {
                document.getElementById("expression").value = expressions;
            } else if (Array.isArray(expressions)) {
            
                if (fnDump.endsWith(";")) {
                    fnDump = fnDump.substring(0, fnDump.length - 1);
                }

                document.getElementById("expression").value = fnDump;
            }
        }
    }

    // Metoda destroy() pro uvolnění paměti a odstranění event handlerů
    destroy() {
        if (this.board) {
            // Remove event listeners from the board
            if (this.handleUpdate) {
                this.board.off('update', this.handleUpdate);
            }
            if (this.handleMove) {
                this.board.off('move', this.handleMove);
            }

            // Remove all objects from the board
            this.functions.forEach(fn => {
                if (fn.graph) {
                    this.board.removeObject(fn.graph);
                }
                if (fn.hoverDot) {
                    this.board.removeObject(fn.hoverDot);
                }
                if (fn.hoverLabel) {
                    this.board.removeObject(fn.hoverLabel);
                }
            });

            // Remove the board element from DOM
            const boardElement = document.getElementById('jxgbox');
            if (boardElement) {
                boardElement.remove();
            }


            const controlsElement = document.querySelector(".controls");

            if (controlsElement) {
                controlsElement.remove();
            }

            // Delete the board
            JXG.JSXGraph.freeBoard(this.board);
            this.board = undefined;
        }

        // Remove event listeners from parseButton
        const parseButton = document.getElementById('parseButton');
        if (parseButton && this.parseButtonHandler) {
            parseButton.removeEventListener('click', this.parseButtonHandler);
        }

        // Clear parameter controls
        const parameterContainer = document.getElementById('parameters');
        if (parameterContainer) {
            parameterContainer.innerHTML = '';
        }

        // Clear functions array
        this.functions = [];

        // Clear any parameters and values
        this.parameterConfigs = {};
        this.parameterValues = {};

        // Clear any timeouts
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
        }
    }

    // Metoda save() pro vytvoření SVG a stažení uživateli
    save() {
        if (this.board) {
            // Get SVG element
            let svgData = this.board.renderer.svgRoot.outerHTML;

            // Create a Blob
            let blob = new Blob([svgData], {type: "image/svg+xml;charset=utf-8"});

            // Create an object URL
            let url = URL.createObjectURL(blob);

            // Create an anchor element and trigger download
            let a = document.createElement('a');
            a.href = url;
            a.download = 'graph.svg';
            document.body.appendChild(a);
            a.click();

            // Clean up
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } else {
            alert('Grafická plocha není inicializována.');
        }
    }

}