#!/usr/bin/env python3
"""
Dojo Yamato - Responsive visual audit helper.
Uso: avvia prima npm run dev, poi python tools/responsive_visual_audit.py
Apre più finestre Edge/Chrome con dimensioni device e stampa una checklist.
Non modifica il sito.
"""
from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from dataclasses import dataclass

@dataclass
class Device:
    name: str
    width: int
    height: int

DEVICES = [
    Device("iPhone SE", 375, 667),
    Device("iPhone 15 Pro", 393, 852),
    Device("iPhone 15 Pro Max", 430, 932),
    Device("Samsung Galaxy S24", 412, 915),
    Device("Google Pixel 8", 412, 915),
    Device("iPad Mini", 768, 1024),
    Device("iPad Air", 820, 1180),
    Device("Desktop", 1440, 950),
]

PAGES = ["/", "/corsi", "/galleria", "/teoria", "/documenti", "/calendario-eventi", "/contatti", "/area-utente"]

BROWSER_CANDIDATES = {
    "edge": ["msedge", "microsoft-edge", "microsoft-edge-stable"],
    "chrome": ["chrome", "google-chrome", "google-chrome-stable"],
}

def find_browser(preferred: str) -> str | None:
    names = BROWSER_CANDIDATES.get(preferred, []) + BROWSER_CANDIDATES["edge"] + BROWSER_CANDIDATES["chrome"]
    for name in names:
        path = shutil.which(name)
        if path:
            return path
    return None

def open_window(browser: str, url: str, device: Device, x: int, y: int):
    args = [
        browser,
        "--new-window",
        f"--window-size={device.width},{device.height}",
        f"--window-position={x},{y}",
        url,
    ]
    subprocess.Popen(args, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="http://localhost:5173")
    parser.add_argument("--page", default="/")
    parser.add_argument("--browser", choices=["edge", "chrome"], default="edge")
    parser.add_argument("--set", choices=["mobile", "tablet", "all"], default="all")
    args = parser.parse_args()

    browser = find_browser(args.browser)
    if not browser:
        print("Browser non trovato. Prova con --browser chrome oppure apri manualmente gli URL.")
        return 1

    if args.set == "mobile":
        devices = DEVICES[:5]
    elif args.set == "tablet":
        devices = DEVICES[5:7]
    else:
        devices = DEVICES

    page = args.page if args.page.startswith("/") else "/" + args.page
    url = args.base.rstrip("/") + page

    print("Apro anteprime:")
    x = 0
    for i, device in enumerate(devices):
        print(f"- {device.name}: {device.width}x{device.height} -> {url}")
        open_window(browser, url, device, x, 0)
        x += min(device.width + 18, 520)

    print("\nChecklist visiva mobile:")
    print("1. Header non deve coprire il titolo.")
    print("2. Menu hamburger deve aprirsi senza uscire dallo schermo.")
    print("3. Card e immagini devono stare in una sola colonna su cellulare.")
    print("4. Bottoni devono essere leggibili e non sovrapposti.")
    print("5. Tabelle admin devono scorrere in orizzontale, non schiacciarsi.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
