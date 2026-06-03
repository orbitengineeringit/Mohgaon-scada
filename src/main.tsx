import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Eagerly preload optimized logos into browser cache so login/logout transitions are instant
import orbitLogo from '@/assets/orbit-logo-optimized.png';
const img = new Image();
img.src = orbitLogo;

createRoot(document.getElementById("root")!).render(<App />);
