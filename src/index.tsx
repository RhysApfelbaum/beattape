import React from 'react';
import { createRoot } from 'react-dom/client';
import { FMODProvider } from './FMODProvider';
import App from './App';
import { ThemeProvider, createGlobalStyle  } from 'styled-components';
import theme from './theme';

const rootElement = document.getElementById('root');

const GlobalStyles = createGlobalStyle`
    body {
        font-family: monospace;
        font-size: 15px;
        text-align: center;
        color: white;
        background-color: ${props => props.theme.colors.background};
    }
`;

if (!rootElement) {
    throw new Error(`Could not find an element with id "root"!`);
}

const root = createRoot(rootElement); 
root.render(
    <ThemeProvider theme={theme}>
        <GlobalStyles />
        <FMODProvider>
            <App />
        </FMODProvider>
    </ThemeProvider>
);
