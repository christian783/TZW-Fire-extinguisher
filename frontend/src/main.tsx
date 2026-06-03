import React from "react";
import ReactDOM from "react-dom/client";
import { createTheme, MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { BrowserRouter } from "react-router-dom";

import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./index.css";

import App from "./App";
import { AuthProvider } from "./context/AuthContext";

const rootElement = document.getElementById("root");
const theme = createTheme({
  fontFamily: "Inter, IBM Plex Sans, Segoe UI, Arial, sans-serif",
  headings: {
    fontFamily: "Inter, IBM Plex Sans, Segoe UI, Arial, sans-serif",
    fontWeight: "600"
  },
  primaryColor: "navy",
  defaultRadius: "sm",
  colors: {
    navy: ["#eef5ff", "#d9e8fb", "#b7d2f5", "#8fb9ef", "#679fe8", "#3f87dc", "#1565c0", "#0f4f97", "#0a3a70", "#0a2342"],
    compliance: ["#eef8f1", "#d7efdc", "#aee0bb", "#80cd98", "#55b973", "#2f9c51", "#1b7a34", "#155f2a", "#10471f", "#0a2f15"]
  }
});

if (!rootElement) {
  throw new Error("Root element #root was not found");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="light">
      <Notifications position="top-right" />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </MantineProvider>
  </React.StrictMode>
);
