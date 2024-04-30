import React from 'react';
import { createRoot } from 'react-dom/client';
import { FMODProvider } from './FMODProvider';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
    throw new Error(`Could not find an element with id "root"!`);
}

const root = createRoot(rootElement); 
root.render(
    <FMODProvider>
        <App />
    </FMODProvider>
);
