# MathPlotter

Poor man's Desmos.

## Features
- Multiple plots.
- Implicit functions.
- Inequalities.
- Pan & zoom.
- Adaptive sampling.
- Automatic parameters, value & min/max sliders.
- Over 50 functions supported, courtesy of `math.js`.
- Straightforward API.

## Getting started

MathPlotter is distributed as `umd` package. Load `jsxgraphcore.js`, `math.js` and `plotter.js`:

```html
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/jsxgraph@1.9.2/distrib/jsxgraphcore.min.js.js"></script> 
<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/mathjs/13.1.1/math.min.js"></script> 
<link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/jsxgraph/1.9.2/jsxgraph.css" />
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/mathplotter/plotter.min.js"></script> 
```

Setup HTML:

```
<div id="plotterElement"></div>
```

Instantiate `MathPlotter`:

```js
var plotter = new MathPlotter("plotterElement");
plotter.init();
```

## Config

Pass config options as a second argument to the constructor of `MathPlotter`:

```js
var plotter = new MathPlotter("plotterElement", {
  // config options
});
```

## Instance API

Methods in the following table can be called on the `plotter` instance from the examples above.

| Function | Description | Call
|--------|-------|-------|
| `plot` | Plots one or more functions | One:`plot("x")'`<br/>Multiple:`plot("a * sin(b * x) + c;a * cos(b * x) + c;tanh(x);(x^2 + y^2 – 1)^3 = x^2 y^3")`<br/>Param hints:`plot([{fn: "a * sin(b * x) + c", pars: [{ name: "a", value: 5 }, { name: "c", value: 1 }]}, {fn: "x + 2"}])` |
| `save` | Saves and downloads the plot in `SVG` format. | `save()` |
| `destroy` | Removes all event handlers, destroys elements created by MathPlotter, and frees memory. | `destroy()` |

## Static API

Unlike the methods above, the following methods are called on `MathPlotter` statically.

| Function | Description | Call
|--------|-------|-------|
| `Fire` | Creates a headless instance, plots the given expressions, and destroys the instance immediately. Returns `SVG` screenshot of the plot. | `Fire("ln(x)")` |

## Build

To build `plotter.min.js` & `plotter.css`:

```js
npm i & npm run build
```

To start the dev server:

```js
npm run dev
```

To release a new version:

```js
npm run release:minor
```

## Screenshots

![image](https://github.com/user-attachments/assets/272c99d0-b149-47fd-8801-6272c239cf4b)

