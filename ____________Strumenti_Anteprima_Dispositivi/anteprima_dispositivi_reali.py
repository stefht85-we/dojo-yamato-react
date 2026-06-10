# -*- coding: utf-8 -*-
"""
Preview responsive multi-dispositivo per siti locali Vite/Netlify.

Obiettivo:
- scegliere pagina e dispositivi da un menu grafico
- vedere anteprime multiple in proporzione corretta
- mostrare per ogni dispositivo:
  * viewport CSS usata dal sito
  * risoluzione fisica reale/indicativa
  * dimensione schermo in pollici
  * DPR / device pixel ratio
  * dimensioni fisiche approssimate in mm

Nota importante:
Un browser desktop non può diventare fisicamente grande come un iPhone reale,
perché dipende dal monitor e dal DPI di Windows. Questo script quindi crea
una dashboard con device frame proporzionati correttamente e iframe con viewport
CSS corretta. È il metodo più utile per controllare il layout responsive.
"""

from __future__ import annotations

import html
import json
import math
import os
import subprocess
import sys
import tempfile
import tkinter as tk
from dataclasses import dataclass, asdict
from tkinter import ttk, messagebox, filedialog
from urllib.parse import urljoin


@dataclass
class Device:
    name: str
    brand: str
    css_w: int
    css_h: int
    phys_w: int
    phys_h: int
    inches: float
    dpr: float
    category: str

    @property
    def aspect(self) -> float:
        return self.css_h / self.css_w

    @property
    def mm_w(self) -> float:
        # Calcolo approssimato lato fisico partendo da diagonale e rapporto fisico pixel.
        diag_mm = self.inches * 25.4
        ratio = self.phys_h / self.phys_w
        return diag_mm / math.sqrt(1 + ratio * ratio)

    @property
    def mm_h(self) -> float:
        return self.mm_w * (self.phys_h / self.phys_w)


DEVICES: list[Device] = [
    Device("Desktop 1440", "Desktop", 1440, 900, 1440, 900, 15.6, 1.0, "Desktop"),
    Device("Desktop Full HD", "Desktop", 1920, 1080, 1920, 1080, 24.0, 1.0, "Desktop"),
    Device("Laptop 1366", "Laptop", 1366, 768, 1366, 768, 14.0, 1.0, "Desktop"),
    Device("iPad Mini", "Apple", 744, 1133, 1488, 2266, 8.3, 2.0, "Tablet"),
    Device("iPad 9.7", "Apple", 768, 1024, 1536, 2048, 9.7, 2.0, "Tablet"),
    Device("iPad Air", "Apple", 820, 1180, 1640, 2360, 10.9, 2.0, "Tablet"),
    Device("iPad Pro 11", "Apple", 834, 1194, 1668, 2388, 11.0, 2.0, "Tablet"),
    Device("iPhone 8", "Apple", 375, 667, 750, 1334, 4.7, 2.0, "Mobile"),
    Device("iPhone SE 2020/2022", "Apple", 375, 667, 750, 1334, 4.7, 2.0, "Mobile"),
    Device("iPhone 12/13/14", "Apple", 390, 844, 1170, 2532, 6.1, 3.0, "Mobile"),
    Device("iPhone 15 Pro", "Apple", 393, 852, 1179, 2556, 6.1, 3.0, "Mobile"),
    Device("iPhone 15 Pro Max", "Apple", 430, 932, 1290, 2796, 6.7, 3.0, "Mobile"),
    Device("Samsung Galaxy S20", "Samsung", 360, 800, 1440, 3200, 6.2, 4.0, "Mobile"),
    Device("Samsung Galaxy S24", "Samsung", 384, 854, 1080, 2340, 6.2, 3.0, "Mobile"),
    Device("Samsung Galaxy S24 Ultra", "Samsung", 412, 915, 1440, 3120, 6.8, 3.5, "Mobile"),
    Device("Google Pixel 7/8", "Google", 412, 915, 1080, 2400, 6.2, 2.625, "Mobile"),
    Device("Xiaomi 13", "Xiaomi", 393, 873, 1080, 2400, 6.36, 2.75, "Mobile"),
]

PRESETS = {
    "Essenziale": ["Desktop 1440", "iPad Air", "iPhone 15 Pro"],
    "Mobile": ["iPhone 8", "iPhone 12/13/14", "iPhone 15 Pro", "Samsung Galaxy S24", "Google Pixel 7/8"],
    "Tablet": ["iPad Mini", "iPad 9.7", "iPad Air", "iPad Pro 11"],
    "Completo": [d.name for d in DEVICES],
}


def normalize_url(base: str, page: str) -> str:
    base = (base or "http://localhost:5173").strip()
    page = (page or "/").strip()
    if not base.startswith(("http://", "https://")):
        base = "http://" + base
    if not page.startswith("/"):
        page = "/" + page
    return base.rstrip("/") + page


def open_file(path: str) -> None:
    if sys.platform.startswith("win"):
        os.startfile(path)  # type: ignore[attr-defined]
    elif sys.platform == "darwin":
        subprocess.Popen(["open", path])
    else:
        subprocess.Popen(["xdg-open", path])


def open_browser_window(url: str, width: int, height: int, x: int, y: int, browser: str) -> None:
    args = [f"--new-window", f"--window-size={width},{height}", f"--window-position={x},{y}", url]
    browser = browser.lower().strip()
    candidates: list[str]
    if browser == "edge":
        candidates = ["msedge", "microsoft-edge"]
    elif browser == "chrome":
        candidates = ["chrome", "google-chrome", "chrome.exe"]
    else:
        open_file(url)
        return
    for cmd in candidates:
        try:
            subprocess.Popen([cmd, *args], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return
        except FileNotFoundError:
            continue
    open_file(url)


def build_dashboard(devices: list[Device], target_url: str, visual_scale: float, title: str) -> str:
    data_json = json.dumps([asdict(d) | {"mm_w": round(d.mm_w, 1), "mm_h": round(d.mm_h, 1)} for d in devices], ensure_ascii=False)
    safe_url = html.escape(target_url, quote=True)
    safe_title = html.escape(title, quote=True)
    return f"""<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{safe_title}</title>
<style>
  :root {{
    --bg: #111318;
    --panel: #181b22;
    --panel2: #20242d;
    --text: #f4f4f5;
    --muted: #b8bdc7;
    --accent: #d72631;
    --line: rgba(255,255,255,.12);
  }}
  * {{ box-sizing: border-box; }}
  body {{ margin:0; font-family: Arial, Helvetica, sans-serif; background:var(--bg); color:var(--text); }}
  header {{
    position: sticky; top:0; z-index:10; padding:14px 18px; background:rgba(17,19,24,.94);
    backdrop-filter: blur(10px); border-bottom:1px solid var(--line);
  }}
  h1 {{ margin:0 0 6px; font-size:18px; }}
  .sub {{ color:var(--muted); font-size:13px; line-height:1.35; }}
  .toolbar {{ display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }}
  button {{ border:0; border-radius:999px; padding:8px 12px; cursor:pointer; background:var(--panel2); color:var(--text); }}
  button:hover {{ background:#2b303b; }}
  main {{ padding:18px; }}
  .grid {{ display:flex; flex-wrap:wrap; align-items:flex-start; gap:22px; }}
  .card {{ background:var(--panel); border:1px solid var(--line); border-radius:18px; padding:14px; box-shadow:0 12px 38px rgba(0,0,0,.32); }}
  .meta {{ display:grid; gap:4px; margin-bottom:10px; font-size:12px; color:var(--muted); line-height:1.3; }}
  .meta strong {{ color:var(--text); font-size:14px; }}
  .device {{
    position:relative; background:#050505; border:8px solid #050505; border-radius:28px;
    overflow:hidden; box-shadow: inset 0 0 0 1px rgba(255,255,255,.08), 0 16px 35px rgba(0,0,0,.45);
  }}
  .device.desktop, .device.tablet {{ border-radius:16px; }}
  iframe {{ border:0; display:block; background:#fff; transform-origin: top left; }}
  .badge {{ display:inline-block; color:#fff; background:var(--accent); border-radius:999px; padding:2px 7px; font-size:11px; margin-left:6px; }}
  .note {{ margin-top:16px; color:var(--muted); font-size:12px; line-height:1.45; max-width:1100px; }}
  @media (max-width: 700px) {{ main {{ padding:12px; }} .grid {{ gap:14px; }} .card {{ width:100%; overflow:auto; }} }}
</style>
</head>
<body>
<header>
  <h1>Anteprima responsive multi-dispositivo</h1>
  <div class="sub">URL: <strong>{safe_url}</strong> · Scala visuale frame: <strong>{visual_scale:.2f}</strong>. Ogni iframe usa la viewport CSS del dispositivo; la cornice mantiene le proporzioni fisiche dello schermo.</div>
  <div class="toolbar">
    <button onclick="location.reload()">Ricarica tutte le anteprime</button>
    <button onclick="document.querySelectorAll('iframe').forEach(f => f.src=f.src)">Ricarica iframe</button>
    <button onclick="window.scrollTo({{top:0,behavior:'smooth'}})">Torna sopra</button>
  </div>
</header>
<main>
  <div class="grid" id="grid"></div>
  <div class="note">
    Nota: le dimensioni fisiche in mm sono calcolate dalla diagonale e dalla risoluzione fisica dichiarata/indicativa. Su PC non si può riprodurre la grandezza reale in centimetri senza conoscere DPI e zoom del monitor, ma le proporzioni e la viewport CSS sono corrette per valutare il layout responsive.
  </div>
</main>
<script>
const devices = {data_json};
const targetUrl = {json.dumps(target_url)};
const visualScale = {visual_scale};
const grid = document.getElementById('grid');

function addDevice(d) {{
  const frameW = Math.round(d.css_w * visualScale);
  const frameH = Math.round(d.css_h * visualScale);
  const card = document.createElement('section');
  card.className = 'card';
  card.innerHTML = `
    <div class="meta">
      <strong>${{d.name}} <span class="badge">${{d.brand}}</span></strong>
      <span>Viewport CSS: ${{d.css_w}} × ${{d.css_h}} px</span>
      <span>Risoluzione fisica: ${{d.phys_w}} × ${{d.phys_h}} px · DPR ${{d.dpr}}</span>
      <span>Schermo: ${{d.inches}}” · circa ${{d.mm_w}} × ${{d.mm_h}} mm</span>
      <span>Frame preview: ${{frameW}} × ${{frameH}} px</span>
    </div>
    <div class="device ${{String(d.category).toLowerCase()}}" style="width:${{frameW+16}}px;height:${{frameH+16}}px">
      <iframe src="${{targetUrl}}" title="${{d.name}}" style="width:${{d.css_w}}px;height:${{d.css_h}}px;transform:scale(${{visualScale}})"></iframe>
    </div>`;
  grid.appendChild(card);
}}

devices.forEach(addDevice);
</script>
</body>
</html>"""


class App(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self.title("Anteprime responsive - Dojo Yamato")
        self.geometry("860x720")
        self.minsize(760, 620)

        self.base_var = tk.StringVar(value="http://localhost:5173")
        self.page_var = tk.StringVar(value="/")
        self.scale_var = tk.DoubleVar(value=0.55)
        self.browser_var = tk.StringVar(value="edge")
        self.preset_var = tk.StringVar(value="Essenziale")
        self.status_var = tk.StringVar(value="Pronto. Avvia prima npm run dev, poi apri la dashboard.")
        self.device_vars: dict[str, tk.BooleanVar] = {}

        self._build_ui()
        self.apply_preset("Essenziale")

    def _build_ui(self) -> None:
        pad = {"padx": 12, "pady": 8}
        frm = ttk.Frame(self)
        frm.pack(fill="both", expand=True)

        top = ttk.LabelFrame(frm, text="Pagina da testare")
        top.pack(fill="x", **pad)
        ttk.Label(top, text="URL base Vite").grid(row=0, column=0, sticky="w", padx=8, pady=6)
        ttk.Entry(top, textvariable=self.base_var, width=42).grid(row=0, column=1, sticky="we", padx=8, pady=6)
        ttk.Label(top, text="Pagina/percorso").grid(row=0, column=2, sticky="w", padx=8, pady=6)
        ttk.Entry(top, textvariable=self.page_var, width=22).grid(row=0, column=3, sticky="we", padx=8, pady=6)
        top.columnconfigure(1, weight=1)
        top.columnconfigure(3, weight=1)

        settings = ttk.LabelFrame(frm, text="Modalità e scala")
        settings.pack(fill="x", **pad)
        ttk.Label(settings, text="Preset").grid(row=0, column=0, sticky="w", padx=8, pady=6)
        preset = ttk.Combobox(settings, textvariable=self.preset_var, values=list(PRESETS.keys()) + ["Personalizzata"], state="readonly", width=18)
        preset.grid(row=0, column=1, sticky="w", padx=8, pady=6)
        preset.bind("<<ComboboxSelected>>", lambda _e: self.apply_preset(self.preset_var.get()))

        ttk.Label(settings, text="Scala dashboard").grid(row=0, column=2, sticky="w", padx=8, pady=6)
        ttk.Scale(settings, from_=0.30, to=1.00, variable=self.scale_var, orient="horizontal", length=180).grid(row=0, column=3, sticky="w", padx=8, pady=6)
        ttk.Label(settings, text="Browser finestre separate").grid(row=0, column=4, sticky="w", padx=8, pady=6)
        ttk.Combobox(settings, textvariable=self.browser_var, values=["edge", "chrome", "default"], state="readonly", width=10).grid(row=0, column=5, sticky="w", padx=8, pady=6)

        devices_frame = ttk.LabelFrame(frm, text="Dispositivi - selezione multipla")
        devices_frame.pack(fill="both", expand=True, **pad)
        canvas = tk.Canvas(devices_frame, highlightthickness=0)
        scroll = ttk.Scrollbar(devices_frame, orient="vertical", command=canvas.yview)
        inner = ttk.Frame(canvas)
        inner.bind("<Configure>", lambda _e: canvas.configure(scrollregion=canvas.bbox("all")))
        canvas.create_window((0, 0), window=inner, anchor="nw")
        canvas.configure(yscrollcommand=scroll.set)
        canvas.pack(side="left", fill="both", expand=True)
        scroll.pack(side="right", fill="y")

        for i, d in enumerate(DEVICES):
            var = tk.BooleanVar(value=False)
            self.device_vars[d.name] = var
            text = f"{d.name} | {d.brand} | CSS {d.css_w}×{d.css_h} | fisica {d.phys_w}×{d.phys_h} | {d.inches}\" | {d.mm_w:.0f}×{d.mm_h:.0f} mm"
            cb = ttk.Checkbutton(inner, text=text, variable=var, command=lambda: self.preset_var.set("Personalizzata"))
            cb.grid(row=i, column=0, sticky="w", padx=8, pady=3)

        custom = ttk.LabelFrame(frm, text="Aggiungi dispositivo custom")
        custom.pack(fill="x", **pad)
        self.c_name = tk.StringVar(value="Mio dispositivo")
        self.c_css_w = tk.StringVar(value="390")
        self.c_css_h = tk.StringVar(value="844")
        self.c_phys_w = tk.StringVar(value="1170")
        self.c_phys_h = tk.StringVar(value="2532")
        self.c_inches = tk.StringVar(value="6.1")
        fields = [("Nome", self.c_name, 18), ("CSS W", self.c_css_w, 7), ("CSS H", self.c_css_h, 7), ("Fisica W", self.c_phys_w, 8), ("Fisica H", self.c_phys_h, 8), ('Pollici', self.c_inches, 7)]
        for idx, (label, var, width) in enumerate(fields):
            ttk.Label(custom, text=label).grid(row=0, column=idx*2, padx=5, pady=6, sticky="w")
            ttk.Entry(custom, textvariable=var, width=width).grid(row=0, column=idx*2+1, padx=5, pady=6, sticky="w")
        ttk.Button(custom, text="Aggiungi", command=self.add_custom_device).grid(row=0, column=12, padx=8, pady=6)

        actions = ttk.Frame(frm)
        actions.pack(fill="x", **pad)
        ttk.Button(actions, text="Apri dashboard proporzionata", command=self.open_dashboard).pack(side="left", padx=5)
        ttk.Button(actions, text="Apri finestre browser separate", command=self.open_windows).pack(side="left", padx=5)
        ttk.Button(actions, text="Esporta lista dispositivi JSON", command=self.export_json).pack(side="left", padx=5)
        ttk.Button(actions, text="Seleziona tutti", command=lambda: self.select_all(True)).pack(side="left", padx=5)
        ttk.Button(actions, text="Deseleziona tutti", command=lambda: self.select_all(False)).pack(side="left", padx=5)

        status = ttk.Label(frm, textvariable=self.status_var, foreground="#444")
        status.pack(fill="x", padx=16, pady=(0, 12))

    def select_all(self, value: bool) -> None:
        for var in self.device_vars.values():
            var.set(value)
        self.preset_var.set("Personalizzata")

    def apply_preset(self, preset: str) -> None:
        if preset == "Personalizzata":
            return
        selected = set(PRESETS.get(preset, []))
        for name, var in self.device_vars.items():
            var.set(name in selected)

    def selected_devices(self) -> list[Device]:
        selected_names = {name for name, var in self.device_vars.items() if var.get()}
        return [d for d in DEVICES if d.name in selected_names]

    def add_custom_device(self) -> None:
        try:
            name = self.c_name.get().strip() or "Custom"
            css_w = int(self.c_css_w.get())
            css_h = int(self.c_css_h.get())
            phys_w = int(self.c_phys_w.get())
            phys_h = int(self.c_phys_h.get())
            inches = float(self.c_inches.get().replace(",", "."))
            dpr = round(phys_w / css_w, 3) if css_w else 1.0
            device = Device(name, "Custom", css_w, css_h, phys_w, phys_h, inches, dpr, "Mobile")
        except Exception as exc:
            messagebox.showerror("Errore", f"Dati custom non validi: {exc}")
            return
        DEVICES.append(device)
        messagebox.showinfo("OK", "Dispositivo custom aggiunto. Riapri il programma per vederlo stabilmente nella lista oppure usa esporta JSON.")

    def open_dashboard(self) -> None:
        devices = self.selected_devices()
        if not devices:
            messagebox.showwarning("Nessun dispositivo", "Seleziona almeno un dispositivo.")
            return
        url = normalize_url(self.base_var.get(), self.page_var.get())
        scale = float(self.scale_var.get())
        content = build_dashboard(devices, url, scale, "Anteprima responsive multi-dispositivo")
        out_dir = os.path.join(tempfile.gettempdir(), "dojo_responsive_preview")
        os.makedirs(out_dir, exist_ok=True)
        out_path = os.path.join(out_dir, "anteprima_responsive_dashboard.html")
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(content)
        open_file(out_path)
        self.status_var.set(f"Dashboard aperta: {out_path}")

    def open_windows(self) -> None:
        devices = self.selected_devices()
        if not devices:
            messagebox.showwarning("Nessun dispositivo", "Seleziona almeno un dispositivo.")
            return
        url = normalize_url(self.base_var.get(), self.page_var.get())
        browser = self.browser_var.get()
        x, y = 0, 0
        for idx, d in enumerate(devices):
            w = min(max(d.css_w + 80, 360), 1500)
            h = min(max(d.css_h + 160, 520), 1100)
            open_browser_window(url, w, h, x, y, browser)
            x += min(w + 30, 520)
            if x > 1800:
                x = 0
                y += 80
        self.status_var.set(f"Aperte {len(devices)} finestre browser separate.")

    def export_json(self) -> None:
        path = filedialog.asksaveasfilename(defaultextension=".json", filetypes=[("JSON", "*.json")], initialfile="dispositivi_responsive.json")
        if not path:
            return
        data = [asdict(d) | {"mm_w": round(d.mm_w, 1), "mm_h": round(d.mm_h, 1)} for d in DEVICES]
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        self.status_var.set(f"JSON esportato: {path}")


if __name__ == "__main__":
    app = App()
    app.mainloop()
