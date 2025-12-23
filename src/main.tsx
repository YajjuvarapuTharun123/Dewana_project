import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
    onNeedRefresh() {
        console.log("New content available, click on reload button to update.");
    },
    onOfflineReady() {
        console.log("Content is cached for offline use.");
    },
});

createRoot(document.getElementById("root")!).render(<App />);
