import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {BrowserRouter} from "react-router-dom";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import { MantineProvider,ColorSchemeScript } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import './index.css'
import App from './App.jsx'
import { Provider } from 'react-redux'
import { store } from '../redux/store.js'
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store = {store} >
      <ColorSchemeScript defaultColorScheme="auto" />
    <MantineProvider  defaultColorScheme="auto">
    <Notifications position="top-right" />
      <BrowserRouter>
           <App />  
      </BrowserRouter>
    </MantineProvider>
    </Provider>

  </StrictMode>,
)
