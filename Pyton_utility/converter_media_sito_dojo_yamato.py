# -*- coding: utf-8 -*-
"""
Convertitore Media Sito Dojo Yamato
-----------------------------------
Programma semplice con interfaccia grafica per convertire/comprimere immagini e video
per il sito web A.S.D. Dojo Yamato.

Requisiti consigliati:
    py -m pip install pillow pillow-heif moviepy

Per i video è consigliato avere FFmpeg disponibile.
MoviePy normalmente usa imageio-ffmpeg, ma se hai problemi installa anche:
    py -m pip install imageio-ffmpeg

Avvio:
    py .\converter_media_sito_dojo_yamato.py
"""

import os
import sys
import threading
import traceback
from pathlib import Path
from datetime import datetime
import tkinter as tk
from tkinter import filedialog, messagebox, ttk

# -----------------------------
# Dipendenze immagini
# -----------------------------
try:
    from PIL import Image, ImageOps
except ModuleNotFoundError:
    raise SystemExit(
        "ERRORE: manca Pillow. Installa con:\n\n"
        "py -m pip install pillow\n"
    )

try:
    import pillow_heif
    pillow_heif.register_heif_opener()
    HEIF_ENABLED = True
except ModuleNotFoundError:
    HEIF_ENABLED = False

# -----------------------------
# Dipendenze video
# -----------------------------
try:
    from moviepy import VideoFileClip
    MOVIEPY_ENABLED = True
except Exception:
    try:
        from moviepy.editor import VideoFileClip
        MOVIEPY_ENABLED = True
    except Exception:
        MOVIEPY_ENABLED = False


APP_TITLE = "Convertitore Media Sito Dojo Yamato"

# Formati immagine input molto ampliati
IMAGE_EXTENSIONS = [
    ".jpg", ".jpeg", ".jpe", ".jfif", ".png", ".webp",
    ".heic", ".heif", ".hif",
    ".bmp", ".dib", ".tif", ".tiff",
    ".gif", ".avif", ".ppm", ".pgm", ".pbm", ".pnm",
]

# Formati video input molto ampliati
VIDEO_EXTENSIONS = [
    ".mp4", ".mov", ".m4v", ".avi", ".mkv", ".webm",
    ".wmv", ".flv", ".mpeg", ".mpg", ".mpe", ".mpv",
    ".3gp", ".3g2", ".mts", ".m2ts", ".ts", ".vob",
    ".ogv", ".ogg", ".rm", ".rmvb", ".asf", ".divx",
]

ALL_MEDIA_EXTENSIONS = IMAGE_EXTENSIONS + VIDEO_EXTENSIONS

IMAGE_FILETYPES = " ".join([f"*{e}" for e in IMAGE_EXTENSIONS] + [f"*{e.upper()}" for e in IMAGE_EXTENSIONS])
VIDEO_FILETYPES = " ".join([f"*{e}" for e in VIDEO_EXTENSIONS] + [f"*{e.upper()}" for e in VIDEO_EXTENSIONS])
ALL_FILETYPES = IMAGE_FILETYPES + " " + VIDEO_FILETYPES


# -----------------------------
# Utility
# -----------------------------
def safe_filename(name: str) -> str:
    allowed = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_ .()[]"
    cleaned = "".join(c if c in allowed else "_" for c in name)
    return cleaned.strip().replace("  ", " ")


def unique_path(path: Path) -> Path:
    if not path.exists():
        return path
    stem = path.stem
    suffix = path.suffix
    parent = path.parent
    i = 2
    while True:
        candidate = parent / f"{stem}_{i}{suffix}"
        if not candidate.exists():
            return candidate
        i += 1


def bytes_to_kb(size_bytes: int) -> float:
    return size_bytes / 1024


def get_ext(file_path: str) -> str:
    return Path(file_path).suffix.lower()


def is_image(file_path: str) -> bool:
    return get_ext(file_path) in IMAGE_EXTENSIONS


def is_video(file_path: str) -> bool:
    return get_ext(file_path) in VIDEO_EXTENSIONS


def ensure_folder(path: str) -> Path:
    folder = Path(path)
    folder.mkdir(parents=True, exist_ok=True)
    return folder


# -----------------------------
# Conversione immagini
# -----------------------------
def convert_image(
    input_path: str,
    output_folder: Path,
    output_format: str = "JPEG",
    max_width: int = 1920,
    quality: int = 82,
    target_kb: int = 300,
    keep_png_transparency: bool = False,
) -> Path:
    src = Path(input_path)
    out_format = output_format.upper().strip()

    if out_format in ["JPG", "JPEG"]:
        ext = ".jpg"
        pil_format = "JPEG"
    elif out_format == "WEBP":
        ext = ".webp"
        pil_format = "WEBP"
    elif out_format == "PNG":
        ext = ".png"
        pil_format = "PNG"
    else:
        ext = ".jpg"
        pil_format = "JPEG"

    out_name = safe_filename(src.stem) + ext
    out_path = unique_path(output_folder / out_name)

    with Image.open(src) as img:
        # Corregge rotazione da EXIF, utile per foto iPhone
        img = ImageOps.exif_transpose(img)

        # Ridimensiona solo se più larga del limite
        if max_width and max_width > 0 and img.width > max_width:
            ratio = max_width / float(img.width)
            new_height = int(img.height * ratio)
            img = img.resize((max_width, new_height), Image.LANCZOS)

        has_alpha = img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info)

        # JPEG non supporta trasparenza: mette sfondo bianco
        if pil_format == "JPEG":
            if has_alpha:
                background = Image.new("RGB", img.size, (255, 255, 255))
                if img.mode != "RGBA":
                    img = img.convert("RGBA")
                background.paste(img, mask=img.split()[-1])
                img = background
            else:
                img = img.convert("RGB")

        if pil_format == "PNG":
            if not keep_png_transparency and has_alpha:
                background = Image.new("RGB", img.size, (255, 255, 255))
                if img.mode != "RGBA":
                    img = img.convert("RGBA")
                background.paste(img, mask=img.split()[-1])
                img = background
            img.save(out_path, format="PNG", optimize=True)
            return out_path

        # Salvataggio con tentativo target KB per JPEG/WEBP
        q = max(10, min(95, int(quality)))
        target_bytes = int(target_kb) * 1024 if target_kb and int(target_kb) > 0 else 0

        while True:
            save_kwargs = {"format": pil_format, "quality": q, "optimize": True}
            if pil_format == "JPEG":
                save_kwargs["progressive"] = True
            if pil_format == "WEBP":
                save_kwargs["method"] = 6

            img.save(out_path, **save_kwargs)

            if not target_bytes:
                break

            current_size = out_path.stat().st_size
            if current_size <= target_bytes or q <= 35:
                break
            q -= 5

    return out_path


# -----------------------------
# Conversione video
# -----------------------------
def convert_video(
    input_path: str,
    output_folder: Path,
    max_width: int = 1280,
    bitrate: str = "1500k",
    audio_bitrate: str = "128k",
    fps: int = 30,
) -> Path:
    if not MOVIEPY_ENABLED:
        raise RuntimeError(
            "MoviePy non è installato. Installa con:\n"
            "py -m pip install moviepy imageio-ffmpeg"
        )

    src = Path(input_path)
    out_path = unique_path(output_folder / (safe_filename(src.stem) + ".mp4"))

    clip = VideoFileClip(str(src))
    try:
        # Ridimensiona solo se più largo del limite
        if max_width and max_width > 0 and clip.w and clip.w > max_width:
            clip = clip.resized(width=max_width) if hasattr(clip, "resized") else clip.resize(width=max_width)

        final_fps = fps if fps and fps > 0 else None
        clip.write_videofile(
            str(out_path),
            codec="libx264",
            audio_codec="aac",
            bitrate=bitrate,
            audio_bitrate=audio_bitrate,
            fps=final_fps,
            preset="medium",
            threads=4,
            logger=None,
        )
    finally:
        try:
            clip.close()
        except Exception:
            pass

    return out_path


# -----------------------------
# Interfaccia grafica
# -----------------------------
class MediaConverterApp:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title(APP_TITLE)
        self.root.geometry("1180x780")
        self.root.minsize(980, 650)

        self.selected_files = []
        self.output_folder = tk.StringVar(value=str(Path.cwd() / "01_WEB_CONVERTITI"))

        self.image_format = tk.StringVar(value="JPEG")
        self.image_width = tk.IntVar(value=1920)
        self.image_quality = tk.IntVar(value=82)
        self.image_target_kb = tk.IntVar(value=300)

        self.video_width = tk.IntVar(value=1280)
        self.video_bitrate = tk.StringVar(value="1500k")
        self.video_audio_bitrate = tk.StringVar(value="128k")
        self.video_fps = tk.IntVar(value=30)

        self.status_text = tk.StringVar(value="Pronto")
        self.progress_value = tk.DoubleVar(value=0)

        self.build_ui()
        self.log("Programma avviato.")
        if not HEIF_ENABLED:
            self.log("ATTENZIONE: pillow-heif non installato. HEIC/HEIF potrebbero non aprirsi.")
        if not MOVIEPY_ENABLED:
            self.log("ATTENZIONE: moviepy non installato. I video non potranno essere convertiti.")

    def build_ui(self):
        main = ttk.Frame(self.root, padding=10)
        main.pack(fill="both", expand=True)

        title = ttk.Label(main, text=APP_TITLE, font=("Segoe UI", 18, "bold"))
        title.pack(anchor="w", pady=(0, 8))

        # Area scrollabile principale
        canvas = tk.Canvas(main, highlightthickness=0)
        scrollbar = ttk.Scrollbar(main, orient="vertical", command=canvas.yview)
        scroll_frame = ttk.Frame(canvas)

        scroll_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        canvas.create_window((0, 0), window=scroll_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)

        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")

        def _on_mousewheel(event):
            canvas.yview_scroll(int(-1 * (event.delta / 120)), "units")
        canvas.bind_all("<MouseWheel>", _on_mousewheel)

        # Riga output
        output_box = ttk.LabelFrame(scroll_frame, text="Cartella di destinazione", padding=10)
        output_box.pack(fill="x", pady=6)
        ttk.Entry(output_box, textvariable=self.output_folder).pack(side="left", fill="x", expand=True, padx=(0, 8))
        ttk.Button(output_box, text="Scegli cartella", command=self.choose_output_folder).pack(side="left")

        # Selezione file
        file_box = ttk.LabelFrame(scroll_frame, text="File da convertire / comprimere", padding=10)
        file_box.pack(fill="both", expand=True, pady=6)

        buttons = ttk.Frame(file_box)
        buttons.pack(fill="x", pady=(0, 8))
        ttk.Button(buttons, text="Seleziona file", command=self.choose_files).pack(side="left", padx=(0, 6))
        ttk.Button(buttons, text="Seleziona cartella", command=self.choose_folder).pack(side="left", padx=(0, 6))
        ttk.Button(buttons, text="Svuota lista", command=self.clear_files).pack(side="left", padx=(0, 6))

        list_frame = ttk.Frame(file_box)
        list_frame.pack(fill="both", expand=True)
        self.file_list = tk.Listbox(list_frame, height=8)
        file_scroll = ttk.Scrollbar(list_frame, orient="vertical", command=self.file_list.yview)
        self.file_list.configure(yscrollcommand=file_scroll.set)
        self.file_list.pack(side="left", fill="both", expand=True)
        file_scroll.pack(side="right", fill="y")

        # Settings griglia
        settings_grid = ttk.Frame(scroll_frame)
        settings_grid.pack(fill="x", pady=6)
        settings_grid.columnconfigure(0, weight=1)
        settings_grid.columnconfigure(1, weight=1)

        img_box = ttk.LabelFrame(settings_grid, text="Impostazioni immagini", padding=10)
        img_box.grid(row=0, column=0, sticky="nsew", padx=(0, 6))

        self.add_combo(img_box, "Formato output", self.image_format, ["JPEG", "WEBP", "PNG"], 0)
        self.add_spin(img_box, "Larghezza max px", self.image_width, 1, 400, 6000)
        self.add_spin(img_box, "Qualità iniziale", self.image_quality, 2, 10, 95)
        self.add_spin(img_box, "Target indicativo KB", self.image_target_kb, 3, 0, 5000)

        img_tip = (
            "Consigli immagini sito:\n"
            "• Foto news/galleria: JPEG 1600-1920 px, qualità 75-85, 200-400 KB.\n"
            "• Hero/cover: 1920 px, 300-600 KB se serve più qualità.\n"
            "• WEBP comprime meglio, ma JPEG è più universale.\n"
            "• PNG solo per loghi/grafiche con trasparenza.\n"
            "• HEIC/HEIF richiede pillow-heif installato."
        )
        self.add_scroll_text(img_box, img_tip, row=4, height=7)

        vid_box = ttk.LabelFrame(settings_grid, text="Impostazioni video", padding=10)
        vid_box.grid(row=0, column=1, sticky="nsew", padx=(6, 0))

        self.add_spin(vid_box, "Larghezza max px", self.video_width, 0, 320, 3840)
        self.add_entry(vid_box, "Bitrate video", self.video_bitrate, 1)
        self.add_entry(vid_box, "Bitrate audio", self.video_audio_bitrate, 2)
        self.add_spin(vid_box, "FPS", self.video_fps, 3, 15, 60)

        vid_tip = (
            "Consigli video sito:\n"
            "• Output consigliato: MP4 H.264 + AAC.\n"
            "• 720p: bitrate 1000k-1800k.\n"
            "• 1080p leggero: bitrate 2000k-3500k.\n"
            "• Per clip brevi social/sito: 1280 px e 1500k è un buon compromesso.\n"
            "• File MOV iPhone: convertirli in MP4 per compatibilità web.\n"
            "• Se il video fallisce, installare MoviePy/FFmpeg."
        )
        self.add_scroll_text(vid_box, vid_tip, row=4, height=7)

        # Azioni
        action_box = ttk.Frame(scroll_frame)
        action_box.pack(fill="x", pady=10)
        ttk.Button(action_box, text="AVVIA CONVERSIONE", command=self.start_conversion).pack(side="left", padx=(0, 8))
        ttk.Button(action_box, text="Apri cartella output", command=self.open_output_folder).pack(side="left")

        # Progress
        progress_box = ttk.LabelFrame(scroll_frame, text="Avanzamento", padding=10)
        progress_box.pack(fill="x", pady=6)
        ttk.Progressbar(progress_box, variable=self.progress_value, maximum=100).pack(fill="x", pady=(0, 6))
        ttk.Label(progress_box, textvariable=self.status_text).pack(anchor="w")

        # Log
        log_box = ttk.LabelFrame(scroll_frame, text="Log", padding=10)
        log_box.pack(fill="both", expand=True, pady=6)
        log_frame = ttk.Frame(log_box)
        log_frame.pack(fill="both", expand=True)
        self.log_text = tk.Text(log_frame, height=12, wrap="word")
        log_scroll = ttk.Scrollbar(log_frame, orient="vertical", command=self.log_text.yview)
        self.log_text.configure(yscrollcommand=log_scroll.set)
        self.log_text.pack(side="left", fill="both", expand=True)
        log_scroll.pack(side="right", fill="y")

    def add_entry(self, parent, label, var, row):
        ttk.Label(parent, text=label).grid(row=row, column=0, sticky="w", pady=4)
        ttk.Entry(parent, textvariable=var, width=18).grid(row=row, column=1, sticky="ew", pady=4)
        parent.columnconfigure(1, weight=1)

    def add_spin(self, parent, label, var, row, from_, to_):
        ttk.Label(parent, text=label).grid(row=row, column=0, sticky="w", pady=4)
        ttk.Spinbox(parent, textvariable=var, from_=from_, to=to_, width=18).grid(row=row, column=1, sticky="ew", pady=4)
        parent.columnconfigure(1, weight=1)

    def add_combo(self, parent, label, var, values, row):
        ttk.Label(parent, text=label).grid(row=row, column=0, sticky="w", pady=4)
        combo = ttk.Combobox(parent, textvariable=var, values=values, state="readonly", width=16)
        combo.grid(row=row, column=1, sticky="ew", pady=4)
        parent.columnconfigure(1, weight=1)

    def add_scroll_text(self, parent, text, row, height=6):
        frame = ttk.Frame(parent)
        frame.grid(row=row, column=0, columnspan=2, sticky="nsew", pady=(10, 0))
        txt = tk.Text(frame, height=height, wrap="word")
        scr = ttk.Scrollbar(frame, orient="vertical", command=txt.yview)
        txt.configure(yscrollcommand=scr.set)
        txt.insert("1.0", text)
        txt.configure(state="disabled")
        txt.pack(side="left", fill="both", expand=True)
        scr.pack(side="right", fill="y")

    def log(self, message: str):
        ts = datetime.now().strftime("%H:%M:%S")
        line = f"[{ts}] {message}\n"
        try:
            self.log_text.configure(state="normal")
            self.log_text.insert("end", line)
            self.log_text.see("end")
            self.log_text.configure(state="normal")
        except Exception:
            print(line, end="")

    def choose_output_folder(self):
        folder = filedialog.askdirectory(title="Scegli cartella di destinazione")
        if folder:
            self.output_folder.set(folder)

    def choose_files(self):
        files = filedialog.askopenfilenames(
            title="Seleziona immagini e video",
            filetypes=[
                ("File media supportati", ALL_FILETYPES),
                ("Immagini", IMAGE_FILETYPES),
                ("Video", VIDEO_FILETYPES),
                ("Tutti i file", "*.*"),
            ],
        )
        self.add_files(files)

    def choose_folder(self):
        folder = filedialog.askdirectory(title="Scegli cartella con immagini/video")
        if not folder:
            return
        found = []
        for root, _, files in os.walk(folder):
            for name in files:
                full = os.path.join(root, name)
                if is_image(full) or is_video(full):
                    found.append(full)
        self.add_files(found)
        self.log(f"Trovati {len(found)} file media nella cartella selezionata.")

    def add_files(self, files):
        added = 0
        for f in files:
            if not f:
                continue
            if (is_image(f) or is_video(f)) and f not in self.selected_files:
                self.selected_files.append(f)
                self.file_list.insert("end", f)
                added += 1
            elif f and f not in self.selected_files:
                self.log(f"Saltato formato non supportato: {f}")
        self.status_text.set(f"File selezionati: {len(self.selected_files)}")
        self.log(f"Aggiunti {added} file. Totale: {len(self.selected_files)}")

    def clear_files(self):
        self.selected_files = []
        self.file_list.delete(0, "end")
        self.progress_value.set(0)
        self.status_text.set("Lista svuotata")

    def open_output_folder(self):
        folder = ensure_folder(self.output_folder.get())
        try:
            os.startfile(str(folder))
        except Exception:
            messagebox.showinfo("Cartella output", str(folder))

    def start_conversion(self):
        if not self.selected_files:
            messagebox.showwarning("Nessun file", "Seleziona almeno un file immagine o video.")
            return
        thread = threading.Thread(target=self.convert_all, daemon=True)
        thread.start()

    def convert_all(self):
        out_folder = ensure_folder(self.output_folder.get())
        total = len(self.selected_files)
        ok = 0
        errors = 0

        self.root.after(0, lambda: self.progress_value.set(0))
        self.root.after(0, lambda: self.status_text.set("Conversione in corso..."))

        for idx, file_path in enumerate(list(self.selected_files), start=1):
            try:
                ext = get_ext(file_path)
                self.root.after(0, lambda p=file_path: self.log(f"Elaboro: {p}"))

                if is_image(file_path):
                    result = convert_image(
                        input_path=file_path,
                        output_folder=out_folder,
                        output_format=self.image_format.get(),
                        max_width=int(self.image_width.get()),
                        quality=int(self.image_quality.get()),
                        target_kb=int(self.image_target_kb.get()),
                    )
                    size_kb = bytes_to_kb(result.stat().st_size)
                    self.root.after(0, lambda r=result, s=size_kb: self.log(f"OK immagine: {r.name} - {s:.1f} KB"))
                    ok += 1

                elif is_video(file_path):
                    result = convert_video(
                        input_path=file_path,
                        output_folder=out_folder,
                        max_width=int(self.video_width.get()),
                        bitrate=self.video_bitrate.get().strip(),
                        audio_bitrate=self.video_audio_bitrate.get().strip(),
                        fps=int(self.video_fps.get()),
                    )
                    size_kb = bytes_to_kb(result.stat().st_size)
                    self.root.after(0, lambda r=result, s=size_kb: self.log(f"OK video: {r.name} - {s:.1f} KB"))
                    ok += 1

                else:
                    self.root.after(0, lambda e=ext: self.log(f"Formato saltato: {e}"))

            except Exception as exc:
                errors += 1
                err_msg = f"ERRORE su {file_path}: {exc}"
                self.root.after(0, lambda m=err_msg: self.log(m))
                self.root.after(0, lambda: self.log(traceback.format_exc()))

            progress = (idx / total) * 100
            self.root.after(0, lambda v=progress: self.progress_value.set(v))
            self.root.after(0, lambda i=idx, t=total: self.status_text.set(f"Elaborati {i}/{t}"))

        final_msg = f"Completato. OK: {ok} - Errori: {errors} - Cartella: {out_folder}"
        self.root.after(0, lambda: self.status_text.set(final_msg))
        self.root.after(0, lambda: self.log(final_msg))
        self.root.after(0, lambda: messagebox.showinfo("Conversione completata", final_msg))


def main():
    root = tk.Tk()
    try:
        style = ttk.Style()
        if "vista" in style.theme_names():
            style.theme_use("vista")
    except Exception:
        pass
    app = MediaConverterApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
