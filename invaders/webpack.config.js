const path = require("path");

// Phaser webpack config
let phaserModule = path.join(__dirname, '/node_modules/phaser/');
let phaser = path.join(phaserModule, 'build/custom/phaser-split.js');
let pixi = path.join(phaserModule, 'build/custom/pixi.js');
let p2 = path.join(phaserModule, 'build/custom/p2.js');

let loaders = [
    {
        test: /\.js$/,
        exclude: /(node_modules)/,
        loader: 'babel',
        query: {
            presets: ['es2015']
        }
    },
    // { test: /phaser-split\.js$/, loader: 'expose?Phaser' },
    // { test: /pixi\.js/, loader: "script" },
	// { test: /p2\.js/, loader: "expose?p2" },
];

// define entries and entries output
let entries = {
    invaders: "./src/invaders.js",
};
let entries_output = {
    path: "./dist",
    filename: "[name].bundle.js"
};

module.exports = {
	resolve: {
        alias: {
            "pixi": pixi,
            "phaser": phaser,
			"p2": p2,
        }
    },
    entry: entries,
    output: entries_output,
    module: {
        loaders: loaders,
    },
    externals: {
        phaser: "Phaser",
        pixi: "PIXI",
        p2: "p2",
    }
};

