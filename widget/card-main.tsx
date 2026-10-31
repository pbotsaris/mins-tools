import React from 'react';
import {createRoot} from 'react-dom/client';
import Card from './card';
createRoot(document.getElementById('root')!).render(<Card view={document.documentElement.dataset.view==='diary'?'diary':'lists'}/>);
