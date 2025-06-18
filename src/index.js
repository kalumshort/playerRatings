import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

import "@fontsource/inter"; // Defaults to 400 weight
import "@fontsource/inter/700.css"; // Optional: import bold weight

import "animate.css";

import { Provider } from "react-redux";

import store from "./redux/store";

import { AlertProvider } from "./Components/HelpfulComponents";
import { AuthProvider } from "./Providers/AuthContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  // <React.StrictMode>
  <AuthProvider>
    <Provider store={store}>
      <AlertProvider>
        <App />
      </AlertProvider>
    </Provider>
  </AuthProvider>
  // </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
