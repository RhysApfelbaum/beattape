const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: {
        main: './src/main.ts',
        fmodstudio: './src/fmod/fmodstudio.js'
    },
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: '[name].bundle.js',
        clean: true
    },
    
    plugins: [
        new HtmlWebpackPlugin({
            template: 'src/index.html'
        }),
        new CopyPlugin({
            patterns: [{
                from: 'fmod/build/desktop',
                to: 'fmod_banks'
            }]
        })
    ],
    devtool: 'inline-source-map',
    devServer: {
        static: './dist'
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: [ 'style-loader', 'css-loader']
            },
            {
                test: /\.wasm$/i,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: '[name].[ext]'
                        }
                    }
                ]
            },
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.json$/i,
                loader: 'json-loader',
                type: 'javascript/auto',
            }
        ]
    },
    mode: 'development',
    optimization: {
        splitChunks: {
            chunks: 'all'
        }
    }
};
