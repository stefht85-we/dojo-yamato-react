import csv
import io
import shutil
import subprocess
import threading
import time
from pathlib import Path
import tkinter as tk
from tkinter import filedialog, messagebox, ttk

from PIL import Image, ImageTk
import pillow_heif


pillow_heif.register_heif_opener()

APP_NAME = "Media ASD Dojo Yamato"

# Palette grafica semplice e coerente con il sito Dojo Yamato.
COLOR_BG = "#f6f1ea"
COLOR_PANEL = "#ffffff"
COLOR_PRIMARY = "#9f1d1d"
COLOR_PRIMARY_DARK = "#731414"
COLOR_ACCENT = "#d7a02c"
COLOR_TEXT = "#231f20"
COLOR_MUTED = "#6b625d"
COLOR_SOFT = "#fff7ea"

SUPPORTED_IMAGE_EXTENSIONS = {
    ".heic", ".heif", ".hif",
    ".jpg", ".jpeg", ".jpe", ".jfif", ".pjpeg", ".pjp",
    ".png", ".apng", ".webp", ".bmp", ".dib", ".tif", ".tiff",
    ".gif", ".avif", ".ppm", ".pgm", ".pbm", ".pnm", ".ico", ".dds", ".tga"
}

SUPPORTED_VIDEO_EXTENSIONS = {
    ".mov", ".mp4", ".m4v", ".avi", ".mkv", ".webm",
    ".wmv", ".mpg", ".mpeg", ".mpe", ".mpv", ".3gp", ".3g2",
    ".mts", ".m2ts", ".ts", ".flv", ".f4v", ".ogv", ".ogg",
    ".vob", ".asf", ".divx", ".mxf"
}

IMAGE_OUTPUT_FORMATS = {
    "WEBP - consigliato sito": {"pil_format": "WEBP", "extension": ".webp"},
    "JPG - fotografie": {"pil_format": "JPEG", "extension": ".jpg"},
    "PNG - loghi/grafiche": {"pil_format": "PNG", "extension": ".png"}
}

CROP_OUTPUT_FORMATS = {
    "WEBP": {"pil_format": "WEBP", "extension": ".webp"},
    "JPG": {"pil_format": "JPEG", "extension": ".jpg"},
    "PNG": {"pil_format": "PNG", "extension": ".png"}
}

IMAGE_PRESETS = {
    "Sito standard - 1920px / 300KB": {"format": "WEBP - consigliato sito", "quality": 88, "max_kb": 300, "min_quality": 50, "long_side": 1920, "dpi": 96},
    "Sito leggero - 1600px / 200KB": {"format": "WEBP - consigliato sito", "quality": 78, "max_kb": 200, "min_quality": 40, "long_side": 1600, "dpi": 96},
    "Compressione forte - 1400px / 150KB": {"format": "WEBP - consigliato sito", "quality": 72, "max_kb": 150, "min_quality": 35, "long_side": 1400, "dpi": 96},
    "Hero sito - 2400px / 500KB": {"format": "WEBP - consigliato sito", "quality": 84, "max_kb": 500, "min_quality": 45, "long_side": 2400, "dpi": 96},
    "Logo/grafica PNG": {"format": "PNG - loghi/grafiche", "quality": 100, "max_kb": 500, "min_quality": 80, "long_side": 1920, "dpi": 96}
}

VIDEO_PRESETS = {
    "Web leggero 720p": {"width": 1280, "height": 720, "crf": 30, "video_bitrate": "1200k", "audio_bitrate": "96k"},
    "Web standard 1080p": {"width": 1920, "height": 1080, "crf": 28, "video_bitrate": "1800k", "audio_bitrate": "128k"},
    "Web alta qualità 1080p": {"width": 1920, "height": 1080, "crf": 24, "video_bitrate": "3500k", "audio_bitrate": "128k"},
    "Compressione forte 720p": {"width": 1280, "height": 720, "crf": 32, "video_bitrate": "900k", "audio_bitrate": "96k"},
    "Reel / verticale 1080x1920": {"width": 1080, "height": 1920, "crf": 28, "video_bitrate": "2200k", "audio_bitrate": "128k"},
    "Personalizzato": {"width": 1920, "height": 1080, "crf": 28, "video_bitrate": "1800k", "audio_bitrate": "128k"}
}

CROP_PRESETS = {
    "Home hero desktop 1920x900": {"width": 1920, "height": 900, "folder": "HOME_HERO"},
    "Cover news / album 1200x630": {"width": 1200, "height": 630, "folder": "COVER_NEWS"},
    "Card news 800x600": {"width": 800, "height": 600, "folder": "CARD_NEWS"},
    "Galleria 4:3 - 1200x900": {"width": 1200, "height": 900, "folder": "GALLERIA_4_3"},
    "Profilo insegnante 4:5 - 1200x1500": {"width": 1200, "height": 1500, "folder": "PROFILI_4_5"},
    "Quadrata social 1080x1080": {"width": 1080, "height": 1080, "folder": "SOCIAL_QUADRATA"},
    "Story/Reel cover 1080x1920": {"width": 1080, "height": 1920, "folder": "STORY_REEL"},
    "Banner largo 1600x600": {"width": 1600, "height": 600, "folder": "BANNER_LARGO"},
}


def app_dir() -> Path:
    return Path(__file__).resolve().parent


def find_ffmpeg() -> str | None:
    for candidate in [app_dir() / "ffmpeg" / "bin" / "ffmpeg.exe", app_dir() / "ffmpeg.exe"]:
        if candidate.exists():
            return str(candidate)
    return shutil.which("ffmpeg")


def file_size_kb(path: Path) -> float:
    try:
        return path.stat().st_size / 1024
    except Exception:
        return 0


def safe_name(text: str) -> str:
    invalid = '<>:"/\\|?*'
    cleaned = "".join("_" if c in invalid else c for c in text.strip()).replace(" ", "_")
    while "__" in cleaned:
        cleaned = cleaned.replace("__", "_")
    return cleaned.strip("_") or "media"


class ScrollableFrame(ttk.Frame):
    def __init__(self, parent):
        super().__init__(parent)
        self.canvas = tk.Canvas(self, borderwidth=0, highlightthickness=0)
        self.scrollbar = ttk.Scrollbar(self, orient="vertical", command=self.canvas.yview)
        self.scrollable_frame = ttk.Frame(self.canvas)
        self.window_id = self.canvas.create_window((0, 0), window=self.scrollable_frame, anchor="nw")
        self.scrollable_frame.bind("<Configure>", lambda e: self.canvas.configure(scrollregion=self.canvas.bbox("all")))
        self.canvas.bind("<Configure>", lambda e: self.canvas.itemconfigure(self.window_id, width=e.width))
        self.canvas.configure(yscrollcommand=self.scrollbar.set)
        self.canvas.pack(side="left", fill="both", expand=True)
        self.scrollbar.pack(side="right", fill="y")


class MediaASDDojoYamatoApp:
    def __init__(self, root):
        self.root = root
        self.root.title(APP_NAME)
        self.root.geometry("1320x930")
        self.root.minsize(1000, 720)
        self.configure_theme()
        self.ffmpeg_path = find_ffmpeg()

        self.main_container = tk.Frame(root)
        self.main_container.pack(fill="both", expand=True)

        # Media converter variables
        self.input_source_label = tk.StringVar(value="Nessun input selezionato")
        self.ffmpeg_status = tk.StringVar()
        self.output_folder = tk.StringVar()
        self.last_input_folder = None
        self.include_subfolders = tk.BooleanVar(value=False)
        self.media_filter = tk.StringVar(value="Tutto: immagini e video")
        self.convert_mode = tk.StringVar(value="Tutti i file caricati")
        self.rename_enabled = tk.BooleanVar(value=True)
        self.rename_base_mode = tk.StringVar(value="Nome cartella input")
        self.custom_base_name = tk.StringVar(value="Dojo_Yamato")
        self.image_word = tk.StringVar(value="Immagine")
        self.video_word = tk.StringVar(value="Video")
        self.start_number = tk.IntVar(value=1)
        self.number_digits = tk.IntVar(value=2)

        self.image_preset = tk.StringVar(value="Sito standard - 1920px / 300KB")
        self.image_format = tk.StringVar(value="WEBP - consigliato sito")
        self.image_quality = tk.IntVar(value=88)
        self.image_use_max_kb = tk.BooleanVar(value=True)
        self.image_max_kb = tk.IntVar(value=300)
        self.image_min_quality = tk.IntVar(value=50)
        self.image_use_resize = tk.BooleanVar(value=True)
        self.image_resize_mode = tk.StringVar(value="Lato lungo massimo")
        self.image_long_side = tk.IntVar(value=1920)
        self.image_width = tk.IntVar(value=1920)
        self.image_height = tk.IntVar(value=1080)
        self.image_use_dpi = tk.BooleanVar(value=True)
        self.image_dpi = tk.IntVar(value=96)

        self.video_preset = tk.StringVar(value="Web standard 1080p")
        self.video_width = tk.IntVar(value=1920)
        self.video_height = tk.IntVar(value=1080)
        self.video_crf = tk.IntVar(value=28)
        self.video_bitrate = tk.StringVar(value="1800k")
        self.audio_bitrate = tk.StringVar(value="128k")
        self.video_fps = tk.StringVar(value="30")
        self.video_remove_audio = tk.BooleanVar(value=False)

        self.selected_files = []
        self.conversion_results = []
        self.details_folder = None
        self.details_csv_path = None
        self.is_converting = False
        self.pause_event = threading.Event()
        self.pause_event.set()
        self.stop_requested = False
        self.current_process = None
        self.progress_percent = tk.StringVar(value="0%")
        self.operation_status = tk.StringVar(value="Pronto")

        # Crop studio variables
        self.crop_images = []
        self.crop_current_index = None
        self.crop_image_path = None
        self.crop_original = None
        self.crop_preview_image = None
        self.crop_tk_image = None
        self.crop_scale = 1.0
        self.crop_offset_x = 0
        self.crop_offset_y = 0
        self.crop_selection = None
        self.crop_selections_by_image = {}
        self.crop_assigned_presets = {}
        self.drag_mode = None
        self.drag_start = None
        self.selection_start = None
        self.handle_size = 10

        self.crop_preset = tk.StringVar(value="Cover news / album 1200x630")
        self.crop_width = tk.IntVar(value=1200)
        self.crop_height = tk.IntVar(value=630)
        self.crop_output_format = tk.StringVar(value="WEBP")
        self.crop_quality = tk.IntVar(value=82)
        self.crop_output_folder = tk.StringVar()
        self.crop_status = tk.StringVar(value="Nessuna immagine caricata.")
        self.lock_ratio = tk.BooleanVar(value=True)
        self.show_grid = tk.BooleanVar(value=True)
        self.crop_export_status = tk.StringVar(value="Coda export vuota.")
        self.crop_progress_percent = tk.StringVar(value="0%")

        self.apply_image_preset()
        self.apply_video_preset()
        self.apply_crop_preset()
        self.show_home()


    def configure_theme(self):
        """Applica uno stile più moderno/colorato senza cambiare le funzionalità."""
        self.root.configure(bg=COLOR_BG)
        try:
            style = ttk.Style(self.root)
            style.theme_use("clam")
            style.configure(".", font=("Segoe UI", 10))
            style.configure("TFrame", background=COLOR_BG)
            style.configure("TLabelframe", background=COLOR_PANEL, bordercolor="#ead8c6", relief="solid")
            style.configure("TLabelframe.Label", background=COLOR_PANEL, foreground=COLOR_PRIMARY_DARK, font=("Segoe UI", 10, "bold"))
            style.configure("TNotebook", background=COLOR_BG, borderwidth=0)
            style.configure("TNotebook.Tab", padding=(16, 8), font=("Segoe UI", 10, "bold"))
            style.map("TNotebook.Tab", background=[("selected", COLOR_PRIMARY)], foreground=[("selected", "white")])
            style.configure("TCombobox", padding=4)
            style.configure("Treeview.Heading", font=("Segoe UI", 9, "bold"), foreground=COLOR_PRIMARY_DARK)
            style.configure("Horizontal.TProgressbar", troughcolor="#ead8c6", background=COLOR_PRIMARY)
        except Exception:
            pass

    def make_button(self, parent, text, command, kind="primary", height=2, font_size=11):
        if kind == "primary":
            bg, fg, active = COLOR_PRIMARY, "white", COLOR_PRIMARY_DARK
        elif kind == "accent":
            bg, fg, active = COLOR_ACCENT, COLOR_TEXT, "#bf8d21"
        else:
            bg, fg, active = "#ffffff", COLOR_PRIMARY_DARK, "#f0e5db"
        return tk.Button(
            parent,
            text=text,
            command=command,
            height=height,
            font=("Segoe UI", font_size, "bold"),
            bg=bg,
            fg=fg,
            activebackground=active,
            activeforeground=fg,
            relief="flat",
            bd=0,
            padx=14,
            pady=8,
            cursor="hand2"
        )

    def clear_main(self):
        for widget in self.main_container.winfo_children():
            widget.destroy()

    def show_home(self):
        self.clear_main()
        frame = tk.Frame(self.main_container, bg=COLOR_BG)
        frame.pack(fill="both", expand=True)

        hero = tk.Frame(frame, bg=COLOR_PRIMARY, padx=34, pady=30)
        hero.pack(fill="x")
        tk.Label(
            hero,
            text=APP_NAME,
            font=("Segoe UI", 30, "bold"),
            bg=COLOR_PRIMARY,
            fg="white"
        ).pack(anchor="w")
        tk.Label(
            hero,
            text="Converti, comprimi e ritaglia foto/video per il sito ASD Dojo Yamato",
            font=("Segoe UI", 13),
            bg=COLOR_PRIMARY,
            fg="#fff3d8"
        ).pack(anchor="w", pady=(6, 0))

        body = tk.Frame(frame, bg=COLOR_BG, padx=34, pady=28)
        body.pack(fill="both", expand=True)

        cards = tk.Frame(body, bg=COLOR_BG)
        cards.pack(fill="both", expand=True)

        left = tk.Frame(cards, bg=COLOR_PANEL, padx=26, pady=24, highlightthickness=1, highlightbackground="#ead8c6")
        left.pack(side="left", fill="both", expand=True, padx=(0, 14))
        tk.Label(left, text="Convertitore media", font=("Segoe UI", 18, "bold"), bg=COLOR_PANEL, fg=COLOR_PRIMARY_DARK).pack(anchor="w")
        tk.Label(
            left,
            text="Comprimi immagini e video per il sito.\nPreset WEBP/JPG/PNG, video MP4, rinomina automatica,\nreport dettagliato e supporto HEIC iPhone.",
            justify="left",
            font=("Segoe UI", 11),
            bg=COLOR_PANEL,
            fg=COLOR_TEXT
        ).pack(fill="x", pady=(12, 24))
        self.make_button(left, "ENTRA IN CONVERTITORE MEDIA", self.show_converter_section, kind="primary", height=3, font_size=12).pack(fill="x")

        right = tk.Frame(cards, bg=COLOR_PANEL, padx=26, pady=24, highlightthickness=1, highlightbackground="#ead8c6")
        right.pack(side="left", fill="both", expand=True, padx=(14, 0))
        tk.Label(right, text="Crop Studio", font=("Segoe UI", 18, "bold"), bg=COLOR_PANEL, fg=COLOR_PRIMARY_DARK).pack(anchor="w")
        tk.Label(
            right,
            text="Ritaglia immagini per hero, news, galleria e social.\nAssegna più preset, sposta il riquadro con il mouse\ned esporta tutto in batch.",
            justify="left",
            font=("Segoe UI", 11),
            bg=COLOR_PANEL,
            fg=COLOR_TEXT
        ).pack(fill="x", pady=(12, 24))
        self.make_button(right, "ENTRA IN RITAGLIO IMMAGINI", self.show_crop_section, kind="accent", height=3, font_size=12).pack(fill="x")

        info = tk.Frame(body, bg=COLOR_SOFT, padx=18, pady=12, highlightthickness=1, highlightbackground="#ead8c6")
        info.pack(fill="x", pady=(22, 0))
        tk.Label(
            info,
            text="Consiglio sito: usa WEBP per foto e immagini di pagina, JPG per fotografie semplici, PNG solo per loghi o grafiche con trasparenza.",
            bg=COLOR_SOFT,
            fg=COLOR_MUTED,
            font=("Segoe UI", 10),
            justify="left"
        ).pack(anchor="w")

    # ==========================================================
    # CONVERTER SECTION
    # ==========================================================

    def show_converter_section(self):
        self.clear_main()
        top = tk.Frame(self.main_container)
        top.pack(fill="x", padx=12, pady=(10, 0))
        tk.Button(top, text="← Home", command=self.show_home).pack(side="left")
        tk.Label(top, text="Convertitore Media", font=("Segoe UI", 18, "bold")).pack(side="left", padx=16)

        self.converter_notebook = ttk.Notebook(self.main_container)
        self.converter_notebook.pack(fill="both", expand=True, padx=12, pady=10)

        self.converter_tab = tk.Frame(self.converter_notebook)
        self.details_tab = tk.Frame(self.converter_notebook)
        self.converter_notebook.add(self.converter_tab, text="Convertitore media")
        self.converter_notebook.add(self.details_tab, text="Dettagli conversione")

        self._build_converter_tab()
        self._build_details_tab()
        self.update_ffmpeg_status()

    def _build_converter_tab(self):
        scroll_container = ScrollableFrame(self.converter_tab)
        scroll_container.pack(fill="both", expand=True)
        main = scroll_container.scrollable_frame

        status_frame = tk.LabelFrame(main, text="Stato video / FFmpeg", padx=10, pady=6)
        status_frame.pack(fill="x", padx=8, pady=4)
        tk.Label(status_frame, textvariable=self.ffmpeg_status, anchor="w").pack(side="left", fill="x", expand=True)
        tk.Button(status_frame, text="Ricontrolla FFmpeg", command=self.refresh_ffmpeg).pack(side="right")

        input_frame = tk.LabelFrame(main, text="1. INPUT - file singoli/multipli oppure cartella intera", padx=10, pady=8)
        input_frame.pack(fill="x", padx=8, pady=4)
        input_buttons = tk.Frame(input_frame)
        input_buttons.pack(fill="x")
        tk.Button(input_buttons, text="Seleziona singoli file / file multipli", command=self.choose_multiple_files, height=2).pack(side="left", fill="x", expand=True, padx=(0, 6))
        tk.Button(input_buttons, text="Seleziona intera cartella", command=self.choose_input_folder, height=2).pack(side="left", fill="x", expand=True, padx=(6, 0))

        input_options = tk.Frame(input_frame)
        input_options.pack(fill="x", pady=(6, 0))
        tk.Checkbutton(input_options, text="Includi sottocartelle", variable=self.include_subfolders).pack(side="left")
        tk.Label(input_options, text="Tipo file da caricare:").pack(side="left", padx=(18, 4))
        ttk.Combobox(input_options, textvariable=self.media_filter, values=["Tutto: immagini e video", "Solo immagini", "Solo video"], state="readonly", width=24).pack(side="left")
        tk.Label(input_frame, textvariable=self.input_source_label, anchor="w", fg="#555555").pack(fill="x", pady=(4, 0))

        list_frame = tk.LabelFrame(main, text="2. File caricati", padx=10, pady=8)
        list_frame.pack(fill="both", expand=True, padx=8, pady=4)
        self.file_listbox = tk.Listbox(list_frame, selectmode=tk.EXTENDED, height=5)
        self.file_listbox.pack(side="left", fill="both", expand=True)
        scrollbar = tk.Scrollbar(list_frame, orient="vertical", command=self.file_listbox.yview)
        scrollbar.pack(side="right", fill="y")
        self.file_listbox.config(yscrollcommand=scrollbar.set)
        self.refresh_file_listbox()

        list_buttons = tk.Frame(main)
        list_buttons.pack(fill="x", padx=8, pady=4)
        tk.Button(list_buttons, text="Seleziona tutti", command=self.select_all_files).pack(side="left", padx=(0, 8))
        tk.Button(list_buttons, text="Deseleziona tutti", command=self.clear_selection).pack(side="left", padx=(0, 8))
        tk.Button(list_buttons, text="Rimuovi selezionati", command=self.remove_selected_from_list).pack(side="left", padx=(0, 8))
        tk.Button(list_buttons, text="Svuota lista", command=self.clear_file_list).pack(side="left")

        output_frame = tk.LabelFrame(main, text="3. OUTPUT - cartella unica di destinazione", padx=10, pady=8)
        output_frame.pack(fill="x", padx=8, pady=4)
        tk.Entry(output_frame, textvariable=self.output_folder).pack(side="left", fill="x", expand=True, padx=(0, 8))
        tk.Button(output_frame, text="Seleziona cartella output", command=self.choose_output_folder).pack(side="left")

        rename_frame = tk.LabelFrame(main, text="4. Rinomina automatica file convertiti", padx=10, pady=8)
        rename_frame.pack(fill="x", padx=8, pady=4)
        row_r1 = tk.Frame(rename_frame)
        row_r1.pack(fill="x", pady=(0, 4))
        tk.Checkbutton(row_r1, text="Attiva rinomina automatica", variable=self.rename_enabled).pack(side="left")
        tk.Label(row_r1, text="Base nome:").pack(side="left", padx=(18, 4))
        ttk.Combobox(row_r1, textvariable=self.rename_base_mode, values=["Nome cartella input", "Nome personalizzato"], state="readonly", width=22).pack(side="left")
        tk.Label(row_r1, text="Nome personalizzato:").pack(side="left", padx=(18, 4))
        tk.Entry(row_r1, textvariable=self.custom_base_name, width=22).pack(side="left")
        row_r2 = tk.Frame(rename_frame)
        row_r2.pack(fill="x")
        tk.Label(row_r2, text="Parola immagini:").pack(side="left")
        tk.Entry(row_r2, textvariable=self.image_word, width=14).pack(side="left", padx=(4, 12))
        tk.Label(row_r2, text="Parola video:").pack(side="left")
        tk.Entry(row_r2, textvariable=self.video_word, width=14).pack(side="left", padx=(4, 12))
        tk.Label(row_r2, text="Numero iniziale:").pack(side="left")
        tk.Entry(row_r2, textvariable=self.start_number, width=7).pack(side="left", padx=(4, 12))
        tk.Label(row_r2, text="Cifre numero:").pack(side="left")
        tk.Entry(row_r2, textvariable=self.number_digits, width=7).pack(side="left", padx=(4, 0))

        settings_frame = tk.Frame(main)
        settings_frame.pack(fill="x", padx=8, pady=4)
        image_frame = tk.LabelFrame(settings_frame, text="5A. Impostazioni immagini", padx=10, pady=8)
        image_frame.pack(fill="x", pady=(0, 6))
        self._build_image_settings(image_frame)
        video_frame = tk.LabelFrame(settings_frame, text="5B. Impostazioni video", padx=10, pady=8)
        video_frame.pack(fill="x", pady=(6, 0))
        self._build_video_settings(video_frame)

        final_frame = tk.LabelFrame(main, text="6. Conversione finale", padx=10, pady=10)
        final_frame.pack(fill="x", padx=8, pady=6)
        mode_row = tk.Frame(final_frame)
        mode_row.pack(fill="x", pady=(0, 8))
        tk.Label(mode_row, text="Cosa vuoi convertire?").pack(side="left")
        ttk.Combobox(mode_row, textvariable=self.convert_mode, values=["Tutti i file caricati", "Solo file selezionati nella lista"], state="readonly", width=30).pack(side="left", padx=(10, 0))
        controls = tk.Frame(final_frame)
        controls.pack(fill="x")
        self.start_button = tk.Button(controls, text="AVVIA CONVERSIONE FOTO E VIDEO", command=self.start_conversion_from_button, height=2, font=("Segoe UI", 12, "bold"))
        self.start_button.pack(side="left", fill="x", expand=True, padx=(0, 6))
        self.pause_button = tk.Button(controls, text="PAUSA", command=self.toggle_pause, height=2, font=("Segoe UI", 11, "bold"), state="disabled")
        self.pause_button.pack(side="left", fill="x", expand=True, padx=(6, 6))
        self.stop_button = tk.Button(controls, text="STOP", command=self.request_stop, height=2, font=("Segoe UI", 11, "bold"), state="disabled")
        self.stop_button.pack(side="left", fill="x", expand=True, padx=(6, 0))
        progress_frame = tk.Frame(main)
        progress_frame.pack(fill="x", padx=8, pady=(6, 14))
        self.progress = ttk.Progressbar(progress_frame, orient="horizontal", mode="determinate")
        self.progress.pack(side="left", fill="x", expand=True)
        tk.Label(progress_frame, textvariable=self.progress_percent, width=8, font=("Segoe UI", 10, "bold")).pack(side="left", padx=(8, 0))
        tk.Label(main, textvariable=self.operation_status, anchor="w").pack(fill="x", padx=8, pady=(0, 12))

    def _build_scrolled_textbox(self, parent, text):
        frame = tk.Frame(parent)
        frame.pack(fill="both", expand=True)
        txt = tk.Text(frame, height=8, wrap="word", bg="#f7f7f7", fg="#333333", relief="solid", borderwidth=1)
        scroll = ttk.Scrollbar(frame, orient="vertical", command=txt.yview)
        txt.configure(yscrollcommand=scroll.set)
        txt.insert("1.0", text)
        txt.config(state="disabled")
        txt.pack(side="left", fill="both", expand=True)
        scroll.pack(side="right", fill="y")

    def _build_image_settings(self, parent):
        container = tk.Frame(parent)
        container.pack(fill="x")
        controls = tk.Frame(container)
        controls.pack(side="left", fill="both", expand=True, padx=(0, 10))
        tips = tk.LabelFrame(container, text="Consigli compressione immagini", padx=8, pady=8)
        tips.pack(side="left", fill="both", expand=True)
        row0 = tk.Frame(controls)
        row0.pack(fill="x", pady=(0, 5))
        tk.Label(row0, text="Preset foto:").pack(side="left")
        preset_combo = ttk.Combobox(row0, textvariable=self.image_preset, values=list(IMAGE_PRESETS.keys()), state="readonly", width=30)
        preset_combo.pack(side="left", padx=(5, 8))
        preset_combo.bind("<<ComboboxSelected>>", lambda event: self.apply_image_preset())
        tk.Button(row0, text="Applica", command=self.apply_image_preset).pack(side="left")
        row1 = tk.Frame(controls)
        row1.pack(fill="x", pady=(0, 5))
        tk.Label(row1, text="Formato:").pack(side="left")
        ttk.Combobox(row1, textvariable=self.image_format, values=list(IMAGE_OUTPUT_FORMATS.keys()), state="readonly", width=22).pack(side="left", padx=(5, 12))
        tk.Label(row1, text="Qualità:").pack(side="left")
        tk.Entry(row1, textvariable=self.image_quality, width=6).pack(side="left", padx=(5, 0))
        row2 = tk.Frame(controls)
        row2.pack(fill="x", pady=(0, 5))
        tk.Checkbutton(row2, text="Limite KB", variable=self.image_use_max_kb).pack(side="left")
        tk.Label(row2, text="Max KB:").pack(side="left", padx=(10, 4))
        tk.Entry(row2, textvariable=self.image_max_kb, width=7).pack(side="left")
        tk.Label(row2, text="Qualità min:").pack(side="left", padx=(10, 4))
        tk.Entry(row2, textvariable=self.image_min_quality, width=7).pack(side="left")
        row3 = tk.Frame(controls)
        row3.pack(fill="x", pady=(0, 5))
        tk.Checkbutton(row3, text="Ridimensiona", variable=self.image_use_resize).pack(side="left")
        ttk.Combobox(row3, textvariable=self.image_resize_mode, values=["Lato lungo massimo", "Larghezza massima", "Altezza massima", "Dimensione esatta"], state="readonly", width=19).pack(side="left", padx=(8, 0))
        row4 = tk.Frame(controls)
        row4.pack(fill="x", pady=(0, 5))
        tk.Label(row4, text="Lato lungo:").pack(side="left")
        tk.Entry(row4, textvariable=self.image_long_side, width=7).pack(side="left", padx=(4, 8))
        tk.Label(row4, text="W:").pack(side="left")
        tk.Entry(row4, textvariable=self.image_width, width=7).pack(side="left", padx=(4, 8))
        tk.Label(row4, text="H:").pack(side="left")
        tk.Entry(row4, textvariable=self.image_height, width=7).pack(side="left", padx=(4, 0))
        row5 = tk.Frame(controls)
        row5.pack(fill="x")
        tk.Checkbutton(row5, text="DPI", variable=self.image_use_dpi).pack(side="left")
        tk.Entry(row5, textvariable=self.image_dpi, width=7).pack(side="left", padx=(5, 0))
        self._build_scrolled_textbox(tips, "Per ridurre molto:\n• WEBP\n• Lato lungo 1400–1600 px\n• Qualità 72–80\n• Max 150–250 KB\n• Qualità minima 35–45\n\nHEIC iPhone è già compresso.\nPNG solo per loghi/grafiche.")

    def _build_video_settings(self, parent):
        container = tk.Frame(parent)
        container.pack(fill="x")
        controls = tk.Frame(container)
        controls.pack(side="left", fill="both", expand=True, padx=(0, 10))
        tips = tk.LabelFrame(container, text="Consigli compressione video", padx=8, pady=8)
        tips.pack(side="left", fill="both", expand=True)
        row1 = tk.Frame(controls)
        row1.pack(fill="x", pady=(0, 5))
        tk.Label(row1, text="Preset video:").pack(side="left")
        preset_combo = ttk.Combobox(row1, textvariable=self.video_preset, values=list(VIDEO_PRESETS.keys()), state="readonly", width=27)
        preset_combo.pack(side="left", padx=(5, 8))
        preset_combo.bind("<<ComboboxSelected>>", lambda event: self.apply_video_preset())
        tk.Button(row1, text="Applica", command=self.apply_video_preset).pack(side="left")
        row2 = tk.Frame(controls)
        row2.pack(fill="x", pady=(0, 5))
        tk.Label(row2, text="W:").pack(side="left")
        tk.Entry(row2, textvariable=self.video_width, width=7).pack(side="left", padx=(4, 10))
        tk.Label(row2, text="H:").pack(side="left")
        tk.Entry(row2, textvariable=self.video_height, width=7).pack(side="left", padx=(4, 10))
        tk.Label(row2, text="FPS:").pack(side="left")
        ttk.Combobox(row2, textvariable=self.video_fps, values=["originale", "24", "25", "30", "50", "60"], state="readonly", width=9).pack(side="left", padx=(4, 0))
        row3 = tk.Frame(controls)
        row3.pack(fill="x", pady=(0, 5))
        tk.Label(row3, text="Bitrate video:").pack(side="left")
        tk.Entry(row3, textvariable=self.video_bitrate, width=9).pack(side="left", padx=(4, 10))
        tk.Label(row3, text="Audio:").pack(side="left")
        tk.Entry(row3, textvariable=self.audio_bitrate, width=9).pack(side="left", padx=(4, 0))
        row4 = tk.Frame(controls)
        row4.pack(fill="x", pady=(0, 5))
        tk.Label(row4, text="CRF:").pack(side="left")
        tk.Entry(row4, textvariable=self.video_crf, width=7).pack(side="left", padx=(4, 12))
        tk.Checkbutton(row4, text="Rimuovi audio", variable=self.video_remove_audio).pack(side="left")
        self._build_scrolled_textbox(tips, "Per ridurre molto:\n• Evita 4K\n• Usa 720p o 1080p\n• FPS 30\n• CRF 28–32\n• Bitrate 900k–1800k\n• Audio 96k/128k\n\nCRF più alto = file più leggero.")

    def _build_details_tab(self):
        main = tk.Frame(self.details_tab)
        main.pack(fill="both", expand=True, padx=8, pady=8)
        summary_frame = tk.LabelFrame(main, text="Riepilogo riduzione", padx=10, pady=8)
        summary_frame.pack(fill="x", pady=(0, 8))
        self.summary_label = tk.Label(summary_frame, text="Nessuna conversione eseguita.", anchor="w", justify="left")
        self.summary_label.pack(fill="x")
        table_frame = tk.LabelFrame(main, text="Originali a sinistra / Convertiti a destra", padx=10, pady=8)
        table_frame.pack(fill="both", expand=True)
        columns = ("type", "original_name", "original_kb", "converted_name", "converted_kb", "reduction", "output_path", "status")
        self.details_tree = ttk.Treeview(table_frame, columns=columns, show="headings", height=20)
        headings = {"type": "Tipo", "original_name": "File originale", "original_kb": "KB originale", "converted_name": "File convertito", "converted_kb": "KB convertito", "reduction": "Riduzione", "output_path": "Percorso output", "status": "Stato"}
        widths = {"type": 80, "original_name": 210, "original_kb": 100, "converted_name": 210, "converted_kb": 100, "reduction": 90, "output_path": 330, "status": 90}
        for col in columns:
            self.details_tree.heading(col, text=headings[col])
            self.details_tree.column(col, width=widths[col], anchor="e" if "kb" in col or col == "reduction" else "w")
        self.details_tree.column("type", anchor="center")
        self.details_tree.column("status", anchor="center")
        self.details_tree.pack(side="left", fill="both", expand=True)
        y_scroll = ttk.Scrollbar(table_frame, orient="vertical", command=self.details_tree.yview)
        y_scroll.pack(side="right", fill="y")
        self.details_tree.configure(yscrollcommand=y_scroll.set)

    # ==========================================================
    # CROP STUDIO
    # ==========================================================

    def show_crop_section(self):
        self.clear_main()
        top = tk.Frame(self.main_container)
        top.pack(fill="x", padx=12, pady=(10, 0))
        tk.Button(top, text="← Home", command=self.show_home).pack(side="left")
        tk.Label(top, text="Crop Studio - Ritaglio immagini", font=("Segoe UI", 18, "bold")).pack(side="left", padx=16)
        self._build_crop_page(self.main_container)

    def _build_crop_page(self, parent):
        main = tk.Frame(parent)
        main.pack(fill="both", expand=True, padx=12, pady=10)

        left = tk.Frame(main, width=320)
        left.pack(side="left", fill="y", padx=(0, 10))

        center = tk.Frame(main)
        center.pack(side="left", fill="both", expand=True)

        right = tk.Frame(main, width=360)
        right.pack(side="left", fill="y", padx=(10, 0))

        import_frame = tk.LabelFrame(left, text="1. Import immagini", padx=8, pady=8)
        import_frame.pack(fill="x", pady=(0, 8))
        tk.Button(import_frame, text="Apri file singoli/multipli", command=self.crop_import_files).pack(fill="x", pady=(0, 5))
        tk.Button(import_frame, text="Apri cartella immagini", command=self.crop_import_folder).pack(fill="x", pady=(0, 5))
        tk.Button(import_frame, text="Svuota lista", command=self.crop_clear_images).pack(fill="x")

        list_frame = tk.LabelFrame(left, text="2. Lista immagini importate", padx=8, pady=8)
        list_frame.pack(fill="both", expand=True)
        self.crop_listbox = tk.Listbox(list_frame, height=20)
        self.crop_listbox.pack(side="left", fill="both", expand=True)
        self.crop_listbox.bind("<<ListboxSelect>>", self.crop_on_select_image)
        crop_scroll = ttk.Scrollbar(list_frame, orient="vertical", command=self.crop_listbox.yview)
        crop_scroll.pack(side="right", fill="y")
        self.crop_listbox.config(yscrollcommand=crop_scroll.set)

        preset_frame = tk.LabelFrame(right, text="3. Preset ritaglio per immagine", padx=8, pady=8)
        preset_frame.pack(fill="x", pady=(0, 8))

        self.crop_preset_vars = {}
        for preset_name in CROP_PRESETS:
            var = tk.BooleanVar(value=False)
            self.crop_preset_vars[preset_name] = var
            tk.Checkbutton(preset_frame, text=preset_name, variable=var, command=self.crop_update_current_preset_assignment).pack(anchor="w")

        buttons_preset = tk.Frame(preset_frame)
        buttons_preset.pack(fill="x", pady=(6, 0))
        tk.Button(buttons_preset, text="Applica preset selezionati a tutte", command=self.crop_apply_selected_presets_to_all).pack(fill="x", pady=(0, 4))
        tk.Button(buttons_preset, text="Deseleziona preset", command=self.crop_clear_preset_checks).pack(fill="x")

        options_frame = tk.LabelFrame(right, text="4. Export batch", padx=8, pady=8)
        options_frame.pack(fill="x", pady=(0, 8))

        tk.Label(options_frame, text="Formato:").pack(anchor="w")
        ttk.Combobox(options_frame, textvariable=self.crop_output_format, values=list(CROP_OUTPUT_FORMATS.keys()), state="readonly", width=12).pack(fill="x", pady=(0, 5))

        tk.Label(options_frame, text="Qualità bassa risoluzione:").pack(anchor="w")
        tk.Entry(options_frame, textvariable=self.crop_quality).pack(fill="x", pady=(0, 5))

        tk.Label(options_frame, text="Cartella output:").pack(anchor="w")
        tk.Entry(options_frame, textvariable=self.crop_output_folder).pack(fill="x", pady=(0, 5))
        tk.Button(options_frame, text="Scegli cartella output", command=self.choose_crop_output_folder).pack(fill="x", pady=(0, 8))

        tk.Button(options_frame, text="ESPORTA TUTTO", command=self.crop_export_all, height=2, font=("Segoe UI", 11, "bold")).pack(fill="x")
        self.crop_progress = ttk.Progressbar(options_frame, orient="horizontal", mode="determinate")
        self.crop_progress.pack(fill="x", pady=(8, 2))
        tk.Label(options_frame, textvariable=self.crop_progress_percent).pack(anchor="e")
        tk.Label(options_frame, textvariable=self.crop_export_status, justify="left", anchor="w").pack(fill="x")

        preview_controls = tk.LabelFrame(center, text="5. Editor ritaglio immagine selezionata", padx=8, pady=8)
        preview_controls.pack(fill="x", pady=(0, 8))

        tk.Label(preview_controls, text="Preset anteprima:").pack(side="left")
        combo = ttk.Combobox(preview_controls, textvariable=self.crop_preset, values=list(CROP_PRESETS.keys()), state="readonly", width=30)
        combo.pack(side="left", padx=(5, 8))
        combo.bind("<<ComboboxSelected>>", lambda e: self.apply_crop_preset_and_default_box())
        tk.Button(preview_controls, text="Applica griglia preset", command=self.apply_crop_preset_and_default_box).pack(side="left", padx=(0, 8))
        tk.Checkbutton(preview_controls, text="Blocca proporzione", variable=self.lock_ratio).pack(side="left")
        tk.Checkbutton(preview_controls, text="Mostra griglia", variable=self.show_grid, command=self.redraw_crop_overlay).pack(side="left", padx=(8, 0))

        canvas_frame = tk.LabelFrame(center, text="Anteprima - manina al centro per spostare, angoli per ridimensionare", padx=8, pady=8)
        canvas_frame.pack(fill="both", expand=True)

        self.crop_canvas = tk.Canvas(canvas_frame, bg="#222222", cursor="crosshair")
        self.crop_canvas.pack(fill="both", expand=True)
        self.crop_canvas.bind("<ButtonPress-1>", self.crop_mouse_down)
        self.crop_canvas.bind("<B1-Motion>", self.crop_mouse_drag)
        self.crop_canvas.bind("<ButtonRelease-1>", self.crop_mouse_up)
        self.crop_canvas.bind("<Motion>", self.crop_mouse_move)
        self.crop_canvas.bind("<Configure>", lambda event: self.display_crop_image())

        tk.Label(center, textvariable=self.crop_status, anchor="w").pack(fill="x", pady=(6, 0))

        queue_frame = tk.LabelFrame(center, text="6. Coda export preset / immagini", padx=8, pady=8)
        queue_frame.pack(fill="x", pady=(8, 0))
        self.crop_queue_tree = ttk.Treeview(queue_frame, columns=("image", "presets"), show="headings", height=5)
        self.crop_queue_tree.heading("image", text="Immagine")
        self.crop_queue_tree.heading("presets", text="Preset assegnati")
        self.crop_queue_tree.column("image", width=260)
        self.crop_queue_tree.column("presets", width=520)
        self.crop_queue_tree.pack(fill="x")

        self.crop_refresh_listbox()
        self.crop_refresh_queue()

    def crop_import_files(self):
        filetypes = [("Immagini supportate", "*.heic *.heif *.hif *.jpg *.jpeg *.jpe *.jfif *.png *.webp *.bmp *.tif *.tiff *.gif *.avif"), ("Tutti i file", "*.*")]
        files = filedialog.askopenfilenames(title="Importa immagini", filetypes=filetypes)
        if not files:
            return
        self.crop_add_images([Path(f) for f in files if Path(f).suffix.lower() in SUPPORTED_IMAGE_EXTENSIONS])

    def crop_import_folder(self):
        folder = filedialog.askdirectory(title="Importa cartella immagini")
        if not folder:
            return
        folder_path = Path(folder)
        files = [p for p in folder_path.iterdir() if p.is_file() and p.suffix.lower() in SUPPORTED_IMAGE_EXTENSIONS]
        self.crop_add_images(sorted(files))
        if not self.crop_output_folder.get():
            self.crop_output_folder.set(str(folder_path / "RITAGLI_BATCH"))

    def crop_add_images(self, files):
        existing = {str(p.resolve()) for p in self.crop_images}
        added = 0
        for path in files:
            try:
                resolved = str(path.resolve())
            except Exception:
                resolved = str(path)
            if resolved not in existing:
                self.crop_images.append(path)
                self.crop_assigned_presets.setdefault(str(path), set())
                existing.add(resolved)
                added += 1
        self.crop_refresh_listbox()
        if self.crop_current_index is None and self.crop_images:
            self.crop_current_index = 0
            self.crop_load_current_image()
        self.crop_status.set(f"Immagini importate: {len(self.crop_images)}. Aggiunte ora: {added}")
        self.crop_refresh_queue()

    def crop_clear_images(self):
        self.crop_images = []
        self.crop_current_index = None
        self.crop_original = None
        self.crop_image_path = None
        self.crop_selection = None
        self.crop_selections_by_image = {}
        self.crop_assigned_presets = {}
        self.crop_refresh_listbox()
        self.crop_refresh_queue()
        if hasattr(self, "crop_canvas"):
            self.crop_canvas.delete("all")
        self.crop_status.set("Lista immagini svuotata.")

    def crop_refresh_listbox(self):
        if not hasattr(self, "crop_listbox"):
            return
        self.crop_listbox.delete(0, tk.END)
        for idx, path in enumerate(self.crop_images):
            count = len(self.crop_assigned_presets.get(str(path), set()))
            marker = f" [{count} preset]" if count else ""
            self.crop_listbox.insert(tk.END, f"{idx+1:02d}. {path.name}{marker}")

    def crop_on_select_image(self, event=None):
        sel = self.crop_listbox.curselection()
        if not sel:
            return
        self.crop_save_current_selection()
        self.crop_current_index = sel[0]
        self.crop_load_current_image()

    def crop_save_current_selection(self):
        if self.crop_image_path and self.crop_selection:
            self.crop_selections_by_image[str(self.crop_image_path)] = self.crop_selection

    def crop_load_current_image(self):
        if self.crop_current_index is None or self.crop_current_index >= len(self.crop_images):
            return
        path = self.crop_images[self.crop_current_index]
        try:
            self.crop_image_path = path
            self.crop_original = Image.open(path).convert("RGB")
            self.crop_selection = self.crop_selections_by_image.get(str(path))
            self.crop_status.set(f"Immagine selezionata: {path.name} - {self.crop_original.size[0]}x{self.crop_original.size[1]} px")
            if not self.crop_output_folder.get():
                self.crop_output_folder.set(str(path.parent / "RITAGLI_BATCH"))
            self.crop_load_preset_checks_for_current()
            self.display_crop_image()
            if not self.crop_selection:
                self.create_default_crop_box()
        except Exception as exc:
            messagebox.showerror("Errore apertura immagine", str(exc))

    def crop_load_preset_checks_for_current(self):
        path_key = str(self.crop_image_path) if self.crop_image_path else None
        assigned = self.crop_assigned_presets.get(path_key, set()) if path_key else set()
        for name, var in self.crop_preset_vars.items():
            var.set(name in assigned)

    def crop_update_current_preset_assignment(self):
        if not self.crop_image_path:
            return
        assigned = set()
        for name, var in self.crop_preset_vars.items():
            if var.get():
                assigned.add(name)
        self.crop_assigned_presets[str(self.crop_image_path)] = assigned
        self.crop_refresh_listbox()
        self.crop_refresh_queue()

    def crop_apply_selected_presets_to_all(self):
        selected = {name for name, var in self.crop_preset_vars.items() if var.get()}
        if not selected:
            messagebox.showwarning("Nessun preset", "Seleziona almeno un preset.")
            return
        for path in self.crop_images:
            self.crop_assigned_presets[str(path)] = set(selected)
        self.crop_refresh_listbox()
        self.crop_refresh_queue()

    def crop_clear_preset_checks(self):
        for var in self.crop_preset_vars.values():
            var.set(False)
        self.crop_update_current_preset_assignment()

    def crop_refresh_queue(self):
        if not hasattr(self, "crop_queue_tree"):
            return
        for item in self.crop_queue_tree.get_children():
            self.crop_queue_tree.delete(item)
        for path in self.crop_images:
            presets = sorted(self.crop_assigned_presets.get(str(path), set()))
            if presets:
                self.crop_queue_tree.insert("", "end", values=(path.name, ", ".join(presets)))

    def apply_crop_preset(self):
        preset = CROP_PRESETS[self.crop_preset.get()]
        # width/height are implicit in preview now; no entry fields for crop studio
        return preset

    def apply_crop_preset_and_default_box(self):
        self.apply_crop_preset()
        self.create_default_crop_box()

    def choose_crop_output_folder(self):
        folder = filedialog.askdirectory(title="Scegli cartella output ritagli")
        if folder:
            self.crop_output_folder.set(folder)

    def display_crop_image(self):
        if self.crop_original is None or not hasattr(self, "crop_canvas"):
            return
        canvas_w = max(100, self.crop_canvas.winfo_width())
        canvas_h = max(100, self.crop_canvas.winfo_height())
        img_w, img_h = self.crop_original.size
        scale = min(canvas_w / img_w, canvas_h / img_h)
        preview_w = max(1, int(img_w * scale))
        preview_h = max(1, int(img_h * scale))
        self.crop_scale = scale
        self.crop_offset_x = (canvas_w - preview_w) // 2
        self.crop_offset_y = (canvas_h - preview_h) // 2
        self.crop_preview_image = self.crop_original.resize((preview_w, preview_h), Image.Resampling.LANCZOS)
        self.crop_tk_image = ImageTk.PhotoImage(self.crop_preview_image)
        self.crop_canvas.delete("all")
        self.crop_canvas.create_image(self.crop_offset_x, self.crop_offset_y, anchor="nw", image=self.crop_tk_image)
        self.redraw_crop_overlay()

    def create_default_crop_box(self):
        if self.crop_original is None:
            return
        img_w, img_h = self.crop_original.size
        preset = CROP_PRESETS[self.crop_preset.get()]
        ratio = preset["width"] / preset["height"]
        box_w = int(img_w * 0.7)
        box_h = int(box_w / ratio)
        if box_h > img_h * 0.7:
            box_h = int(img_h * 0.7)
            box_w = int(box_h * ratio)
        x1 = max(0, (img_w - box_w) // 2)
        y1 = max(0, (img_h - box_h) // 2)
        self.crop_selection = (x1, y1, x1 + box_w, y1 + box_h)
        if self.crop_image_path:
            self.crop_selections_by_image[str(self.crop_image_path)] = self.crop_selection
        self.redraw_crop_overlay()

    def canvas_to_image_coords(self, x, y):
        if self.crop_original is None:
            return 0, 0
        img_w, img_h = self.crop_original.size
        ix = int((x - self.crop_offset_x) / self.crop_scale)
        iy = int((y - self.crop_offset_y) / self.crop_scale)
        return max(0, min(img_w, ix)), max(0, min(img_h, iy))

    def image_to_canvas_coords(self, x, y):
        return self.crop_offset_x + x * self.crop_scale, self.crop_offset_y + y * self.crop_scale

    def normalized_crop_selection(self):
        if not self.crop_selection:
            return None
        x1, y1, x2, y2 = self.crop_selection
        return min(x1, x2), min(y1, y2), max(x1, x2), max(y1, y2)

    def get_handle_at(self, cx, cy):
        selection = self.normalized_crop_selection()
        if not selection:
            return None
        x1, y1, x2, y2 = selection
        points = {"nw": self.image_to_canvas_coords(x1, y1), "ne": self.image_to_canvas_coords(x2, y1), "sw": self.image_to_canvas_coords(x1, y2), "se": self.image_to_canvas_coords(x2, y2)}
        for name, (hx, hy) in points.items():
            if abs(cx - hx) <= self.handle_size and abs(cy - hy) <= self.handle_size:
                return name
        ix, iy = self.canvas_to_image_coords(cx, cy)
        if x1 <= ix <= x2 and y1 <= iy <= y2:
            return "move"
        return None

    def crop_mouse_move(self, event):
        mode = self.get_handle_at(event.x, event.y)
        if mode == "move":
            self.crop_canvas.config(cursor="fleur")
        elif mode in ("nw", "se"):
            self.crop_canvas.config(cursor="size_nw_se")
        elif mode in ("ne", "sw"):
            self.crop_canvas.config(cursor="size_ne_sw")
        else:
            self.crop_canvas.config(cursor="crosshair")

    def crop_mouse_down(self, event):
        if self.crop_original is None:
            return
        mode = self.get_handle_at(event.x, event.y)
        ix, iy = self.canvas_to_image_coords(event.x, event.y)
        self.drag_mode = mode or "new"
        self.drag_start = (ix, iy)
        self.selection_start = self.crop_selection
        if self.drag_mode == "new":
            self.crop_selection = (ix, iy, ix, iy)
        self.redraw_crop_overlay()

    def crop_mouse_drag(self, event):
        if self.crop_original is None or not self.drag_start:
            return
        ix, iy = self.canvas_to_image_coords(event.x, event.y)
        img_w, img_h = self.crop_original.size
        if self.drag_mode == "move" and self.selection_start:
            sx, sy = self.drag_start
            dx, dy = ix - sx, iy - sy
            x1, y1, x2, y2 = self.selection_start
            w, h = x2 - x1, y2 - y1
            nx1 = max(0, min(img_w - w, x1 + dx))
            ny1 = max(0, min(img_h - h, y1 + dy))
            self.crop_selection = (nx1, ny1, nx1 + w, ny1 + h)
        elif self.drag_mode in ("nw", "ne", "sw", "se") and self.selection_start:
            x1, y1, x2, y2 = self.selection_start
            if self.drag_mode == "nw":
                x1, y1 = ix, iy
            elif self.drag_mode == "ne":
                x2, y1 = ix, iy
            elif self.drag_mode == "sw":
                x1, y2 = ix, iy
            elif self.drag_mode == "se":
                x2, y2 = ix, iy
            self.crop_selection = self.apply_ratio_if_needed(x1, y1, x2, y2)
        else:
            x1, y1 = self.drag_start
            self.crop_selection = self.apply_ratio_if_needed(x1, y1, ix, iy)
        self.redraw_crop_overlay()

    def apply_ratio_if_needed(self, x1, y1, x2, y2):
        if not self.lock_ratio.get():
            return (x1, y1, x2, y2)
        preset = CROP_PRESETS[self.crop_preset.get()]
        ratio = preset["width"] / preset["height"]
        dx = x2 - x1
        dy = y2 - y1
        sign_x = 1 if dx >= 0 else -1
        sign_y = 1 if dy >= 0 else -1
        abs_dx, abs_dy = abs(dx), abs(dy)
        if abs_dx / max(1, abs_dy) > ratio:
            abs_dx = int(abs_dy * ratio)
        else:
            abs_dy = int(abs_dx / ratio)
        x2 = x1 + sign_x * abs_dx
        y2 = y1 + sign_y * abs_dy
        img_w, img_h = self.crop_original.size
        x1 = max(0, min(img_w, x1))
        y1 = max(0, min(img_h, y1))
        x2 = max(0, min(img_w, x2))
        y2 = max(0, min(img_h, y2))
        return (x1, y1, x2, y2)

    def crop_mouse_up(self, event):
        if self.crop_image_path and self.crop_selection:
            self.crop_selections_by_image[str(self.crop_image_path)] = self.crop_selection
        self.drag_mode = None
        self.drag_start = None
        self.selection_start = None
        selection = self.normalized_crop_selection()
        if selection:
            x1, y1, x2, y2 = selection
            self.crop_status.set(f"Riquadro: {x2-x1}x{y2-y1} px")

    def redraw_crop_overlay(self):
        if self.crop_original is None or not hasattr(self, "crop_canvas"):
            return
        self.crop_canvas.delete("overlay")
        selection = self.normalized_crop_selection()
        if not selection:
            return
        x1, y1, x2, y2 = selection
        cx1, cy1 = self.image_to_canvas_coords(x1, y1)
        cx2, cy2 = self.image_to_canvas_coords(x2, y2)
        self.crop_canvas.create_rectangle(cx1, cy1, cx2, cy2, outline="#00ff88", width=3, tags="overlay")
        for hx, hy in [(cx1, cy1), (cx2, cy1), (cx1, cy2), (cx2, cy2)]:
            self.crop_canvas.create_rectangle(hx-self.handle_size/2, hy-self.handle_size/2, hx+self.handle_size/2, hy+self.handle_size/2, fill="#00ff88", outline="#003322", tags="overlay")
        mx, my = (cx1+cx2)/2, (cy1+cy2)/2
        self.crop_canvas.create_oval(mx-8, my-8, mx+8, my+8, fill="#00ff88", outline="#003322", tags="overlay")
        if self.show_grid.get():
            for i in range(1, 3):
                gx = cx1 + (cx2 - cx1) * i / 3
                gy = cy1 + (cy2 - cy1) * i / 3
                self.crop_canvas.create_line(gx, cy1, gx, cy2, fill="#00ff88", dash=(4, 4), tags="overlay")
                self.crop_canvas.create_line(cx1, gy, cx2, gy, fill="#00ff88", dash=(4, 4), tags="overlay")

    def crop_export_all(self):
        if not self.crop_images:
            messagebox.showwarning("Nessuna immagine", "Importa prima una o più immagini.")
            return
        if not self.crop_output_folder.get():
            messagebox.showwarning("Output mancante", "Scegli una cartella output.")
            return
        tasks = []
        for path in self.crop_images:
            presets = sorted(self.crop_assigned_presets.get(str(path), set()))
            for preset_name in presets:
                tasks.append((path, preset_name))
        if not tasks:
            messagebox.showwarning("Nessun preset", "Assegna almeno un preset a una o più immagini.")
            return
        threading.Thread(target=self.crop_export_tasks, args=(tasks,), daemon=True).start()

    def crop_export_tasks(self, tasks):
        output_root = Path(self.crop_output_folder.get())
        output_root.mkdir(parents=True, exist_ok=True)
        self.root.after(0, lambda: self.crop_progress.config(maximum=len(tasks), value=0))
        exported = 0
        errors = []
        for idx, (path, preset_name) in enumerate(tasks, start=1):
            try:
                self.crop_export_single(path, preset_name, output_root)
                exported += 1
            except Exception as exc:
                errors.append(f"{path.name} / {preset_name}: {exc}")
            percent = round((idx / len(tasks)) * 100)
            self.root.after(0, lambda i=idx, p=percent: (self.crop_progress.config(value=i), self.crop_progress_percent.set(f"{p}%")))
            self.root.after(0, lambda i=idx, total=len(tasks): self.crop_export_status.set(f"Export {i}/{total} in corso/completato..."))
        msg = f"Export completati: {exported}/{len(tasks)}\nCartella:\n{output_root}"
        if errors:
            msg += "\n\nErrori:\n" + "\n".join(errors[:10])
            self.root.after(0, lambda: messagebox.showwarning("Export batch completato con errori", msg))
        else:
            self.root.after(0, lambda: messagebox.showinfo("Export batch completato", msg))
        self.root.after(0, lambda: self.crop_export_status.set(f"Export completato: {exported}/{len(tasks)}"))

    def crop_export_single(self, path: Path, preset_name: str, output_root: Path):
        preset = CROP_PRESETS[preset_name]
        fmt = CROP_OUTPUT_FORMATS[self.crop_output_format.get()]
        quality = int(self.crop_quality.get())
        folder = output_root / preset["folder"]
        folder.mkdir(parents=True, exist_ok=True)
        selection = self.crop_selections_by_image.get(str(path))
        with Image.open(path) as original:
            original = original.convert("RGB")
            if selection is None:
                # default centered crop per preset
                img_w, img_h = original.size
                ratio = preset["width"] / preset["height"]
                box_w = int(img_w * 0.8)
                box_h = int(box_w / ratio)
                if box_h > img_h * 0.8:
                    box_h = int(img_h * 0.8)
                    box_w = int(box_h * ratio)
                x1 = max(0, (img_w - box_w) // 2)
                y1 = max(0, (img_h - box_h) // 2)
                selection = (x1, y1, x1 + box_w, y1 + box_h)
            x1, y1, x2, y2 = selection
            cropped = original.crop((x1, y1, x2, y2)).resize((preset["width"], preset["height"]), Image.Resampling.LANCZOS)
            out_name = f"{safe_name(path.stem)}_{safe_name(preset_name)}{fmt['extension']}"
            output_path = folder / out_name
            counter = 1
            while output_path.exists():
                output_path = folder / f"{safe_name(path.stem)}_{safe_name(preset_name)}_{counter}{fmt['extension']}"
                counter += 1
            if fmt["pil_format"] in ("JPEG", "WEBP"):
                cropped.save(output_path, fmt["pil_format"], quality=quality, optimize=True)
            else:
                cropped.save(output_path, fmt["pil_format"], optimize=True)

    # ==========================================================
    # MEDIA CONVERSION METHODS
    # ==========================================================

    def apply_image_preset(self):
        preset = IMAGE_PRESETS[self.image_preset.get()]
        self.image_format.set(preset["format"])
        self.image_quality.set(preset["quality"])
        self.image_max_kb.set(preset["max_kb"])
        self.image_min_quality.set(preset["min_quality"])
        self.image_long_side.set(preset["long_side"])
        self.image_dpi.set(preset["dpi"])
        self.image_resize_mode.set("Lato lungo massimo")

    def apply_video_preset(self):
        preset = VIDEO_PRESETS[self.video_preset.get()]
        self.video_width.set(preset["width"])
        self.video_height.set(preset["height"])
        self.video_crf.set(preset["crf"])
        self.video_bitrate.set(preset["video_bitrate"])
        self.audio_bitrate.set(preset["audio_bitrate"])

    def refresh_ffmpeg(self):
        self.ffmpeg_path = find_ffmpeg()
        self.update_ffmpeg_status()

    def update_ffmpeg_status(self):
        if self.ffmpeg_path:
            self.ffmpeg_status.set(f"FFmpeg trovato ✅  {self.ffmpeg_path}")
        else:
            self.ffmpeg_status.set("FFmpeg non trovato ⚠️ Le immagini funzionano. Per i video metti ffmpeg.exe in ffmpeg/bin/.")

    def refresh_file_listbox(self):
        if hasattr(self, "file_listbox"):
            self.file_listbox.delete(0, tk.END)
            for file_path in self.selected_files:
                kind = "IMMAGINE" if self.is_image(file_path) else "VIDEO"
                self.file_listbox.insert(tk.END, f"{kind} | {file_path.name} | {file_path.parent}")

    def choose_multiple_files(self):
        filetypes = [
            ("Media supportati", "*.heic *.heif *.hif *.jpg *.jpeg *.jpe *.jfif *.pjpeg *.pjp *.png *.apng *.webp *.bmp *.dib *.tif *.tiff *.gif *.avif *.ppm *.pgm *.pbm *.pnm *.ico *.dds *.tga *.mov *.mp4 *.m4v *.avi *.mkv *.webm *.wmv *.mpg *.mpeg *.mpe *.mpv *.3gp *.3g2 *.mts *.m2ts *.ts *.flv *.f4v *.ogv *.ogg *.vob *.asf *.divx *.mxf"),
            ("Immagini", "*.heic *.heif *.hif *.jpg *.jpeg *.jpe *.jfif *.png *.webp *.bmp *.tif *.tiff *.gif *.avif"),
            ("Video", "*.mov *.mp4 *.m4v *.avi *.mkv *.webm *.wmv *.mpg *.mpeg *.3gp *.mts *.m2ts *.ts *.flv *.ogv *.vob *.asf *.mxf"),
            ("Tutti i file", "*.*")
        ]
        files = filedialog.askopenfilenames(title="Seleziona file input", filetypes=filetypes)
        if files:
            paths = [Path(f) for f in files if self.is_supported_by_filter(Path(f))]
            self.input_source_label.set(f"Input selezionato: {len(paths)} file singoli/multipli")
            self.add_files_to_list(paths)
            if paths:
                self.last_input_folder = paths[0].parent
            if not self.output_folder.get() and paths:
                self.output_folder.set(str(paths[0].parent / "WEB_convertiti"))

    def choose_input_folder(self):
        folder = filedialog.askdirectory(title="Scegli cartella input")
        if folder:
            folder_path = Path(folder)
            self.last_input_folder = folder_path
            self.input_source_label.set(f"Input selezionato: cartella - {folder_path}")
            if not self.output_folder.get():
                self.output_folder.set(str(folder_path / "WEB_convertiti"))
            self.load_media_from_folder(folder_path)

    def choose_output_folder(self):
        folder = filedialog.askdirectory(title="Scegli cartella output")
        if folder:
            self.output_folder.set(folder)

    def is_image(self, path):
        return path.suffix.lower() in SUPPORTED_IMAGE_EXTENSIONS

    def is_video(self, path):
        return path.suffix.lower() in SUPPORTED_VIDEO_EXTENSIONS

    def is_supported_by_filter(self, path):
        if self.media_filter.get() == "Solo immagini":
            return self.is_image(path)
        if self.media_filter.get() == "Solo video":
            return self.is_video(path)
        return self.is_image(path) or self.is_video(path)

    def load_media_from_folder(self, folder):
        candidates = [p for p in folder.rglob("*") if p.is_file()] if self.include_subfolders.get() else [p for p in folder.iterdir() if p.is_file()]
        files = [p for p in candidates if self.is_supported_by_filter(p)]
        self.selected_files = []
        self.add_files_to_list(sorted(files))

    def add_files_to_list(self, files):
        existing = {str(p.resolve()) for p in self.selected_files}
        added = 0
        for file_path in files:
            try:
                resolved = str(file_path.resolve())
            except Exception:
                resolved = str(file_path)
            if resolved not in existing:
                self.selected_files.append(file_path)
                existing.add(resolved)
                added += 1
        self.refresh_file_listbox()
        self.operation_status.set(f"File caricati: {len(self.selected_files)}. Aggiunti ora: {added}.")

    def select_all_files(self):
        self.file_listbox.select_set(0, tk.END)

    def clear_selection(self):
        self.file_listbox.selection_clear(0, tk.END)

    def remove_selected_from_list(self):
        indexes = list(self.file_listbox.curselection())
        for i in reversed(indexes):
            del self.selected_files[i]
        self.refresh_file_listbox()
        self.operation_status.set(f"File caricati: {len(self.selected_files)}.")

    def clear_file_list(self):
        self.selected_files = []
        self.refresh_file_listbox()
        self.input_source_label.set("Nessun input selezionato")
        self.operation_status.set("Lista svuotata.")

    def get_selected_file_paths(self):
        return [self.selected_files[i] for i in self.file_listbox.curselection()]

    def get_base_rename_name(self) -> str:
        if self.rename_base_mode.get() == "Nome personalizzato":
            return safe_name(self.custom_base_name.get())
        if self.last_input_folder:
            return safe_name(self.last_input_folder.name)
        if self.selected_files:
            return safe_name(self.selected_files[0].parent.name)
        return safe_name(self.custom_base_name.get())

    def get_output_filename(self, file_path: Path, output_folder: Path, extension: str, image_index: int, video_index: int) -> Path:
        if not self.rename_enabled.get():
            return self.get_output_path_without_rename(file_path, output_folder, extension)
        base = self.get_base_rename_name()
        digits = max(1, int(self.number_digits.get()))
        if self.is_image(file_path):
            word = safe_name(self.image_word.get())
            number = str(image_index).zfill(digits)
        else:
            word = safe_name(self.video_word.get())
            number = str(video_index).zfill(digits)
        output_file = output_folder / f"{base}_{word}{number}{extension}"
        counter = 1
        while output_file.exists():
            output_file = output_folder / f"{base}_{word}{number}_{counter}{extension}"
            counter += 1
        return output_file

    def get_output_path_without_rename(self, input_file, output_folder, extension):
        output_file = output_folder / f"{input_file.stem}{extension}"
        counter = 1
        while output_file.exists():
            output_file = output_folder / f"{input_file.stem}_{counter}{extension}"
            counter += 1
        return output_file

    def start_conversion_from_button(self):
        if self.is_converting:
            return
        files = self.get_selected_file_paths() if self.convert_mode.get() == "Solo file selezionati nella lista" else self.selected_files
        if not files:
            messagebox.showwarning("Nessun file", "Scegli o seleziona almeno un file.")
            return
        self.start_conversion(files)

    def validate_options(self):
        try:
            int(self.image_quality.get()); int(self.image_max_kb.get()); int(self.image_min_quality.get())
            int(self.image_long_side.get()); int(self.image_width.get()); int(self.image_height.get()); int(self.image_dpi.get())
            int(self.video_width.get()); int(self.video_height.get()); int(self.video_crf.get())
            int(self.start_number.get()); int(self.number_digits.get())
        except Exception:
            messagebox.showwarning("Valori non validi", "Controlla qualità, KB, pixel, DPI, video e rinomina.")
            return False
        return True

    def check_ffmpeg_if_needed(self, files):
        has_video = any(self.is_video(p) for p in files)
        if not has_video:
            return True
        self.refresh_ffmpeg()
        if self.ffmpeg_path:
            return True
        messagebox.showerror("FFmpeg mancante", "Per i video serve ffmpeg/bin/ffmpeg.exe oppure FFmpeg nel PATH.")
        return False

    def setup_details_folder(self, output: Path):
        self.details_folder = output / "Dettagli_conversione"
        self.details_folder.mkdir(parents=True, exist_ok=True)
        self.details_csv_path = self.details_folder / "dettagli_conversione.csv"
        with open(self.details_csv_path, "w", newline="", encoding="utf-8-sig") as f:
            csv.writer(f, delimiter=";").writerow(["Tipo", "File originale", "KB originale", "File convertito", "KB convertito", "Riduzione %", "Percorso originale", "Percorso convertito", "Stato"])

    def start_conversion(self, files):
        if not self.output_folder.get():
            messagebox.showwarning("Output mancante", "Scegli prima la cartella output.")
            return
        if not self.validate_options() or not self.check_ffmpeg_if_needed(files):
            return
        output = Path(self.output_folder.get())
        output.mkdir(parents=True, exist_ok=True)
        self.setup_details_folder(output)
        self.conversion_results = []
        self.clear_details()
        self.progress["value"] = 0
        self.progress["maximum"] = len(files)
        self.progress_percent.set("0%")
        self.operation_status.set("Conversione in corso...")
        self.is_converting = True
        self.stop_requested = False
        self.pause_event.set()
        self.set_buttons_for_running(True)
        threading.Thread(target=self.convert_files, args=(files, output), daemon=True).start()

    def set_buttons_for_running(self, running: bool):
        self.start_button.config(state="disabled" if running else "normal")
        self.pause_button.config(state="normal" if running else "disabled")
        self.stop_button.config(state="normal" if running else "disabled")
        if not running:
            self.pause_button.config(text="PAUSA")

    def toggle_pause(self):
        if not self.is_converting:
            return
        if self.pause_event.is_set():
            self.pause_event.clear()
            self.pause_button.config(text="RIPRENDI")
            self.operation_status.set("Conversione in pausa...")
        else:
            self.pause_event.set()
            self.pause_button.config(text="PAUSA")
            self.operation_status.set("Conversione ripresa...")

    def request_stop(self):
        if not self.is_converting:
            return
        self.stop_requested = True
        self.pause_event.set()
        self.operation_status.set("Stop richiesto...")
        if self.current_process and self.current_process.poll() is None:
            try:
                self.current_process.terminate()
            except Exception:
                pass

    def wait_if_paused_or_stopped(self):
        while not self.pause_event.is_set():
            time.sleep(0.2)
            if self.stop_requested:
                break
        return not self.stop_requested

    def convert_files(self, files, output_folder):
        converted = 0
        warnings = []
        errors = []
        image_counter = int(self.start_number.get())
        video_counter = int(self.start_number.get())
        for index, file_path in enumerate(files, start=1):
            if self.stop_requested or not self.wait_if_paused_or_stopped():
                break
            result_row = {"type": "IMMAGINE" if self.is_image(file_path) else "VIDEO" if self.is_video(file_path) else "ALTRO", "original_path": str(file_path), "original_name": file_path.name, "original_kb": file_size_kb(file_path), "converted_path": "", "converted_name": "", "converted_kb": 0, "reduction_percent": 0, "status": "OK"}
            try:
                if self.is_image(file_path):
                    output_path, warning = self.convert_image(file_path, output_folder, image_counter, video_counter)
                    image_counter += 1
                    if warning:
                        warnings.append(warning)
                elif self.is_video(file_path):
                    output_path = self.convert_video(file_path, output_folder, image_counter, video_counter)
                    video_counter += 1
                else:
                    result_row["status"] = "SKIP"
                    continue
                result_row["converted_path"] = str(output_path)
                result_row["converted_name"] = output_path.name
                result_row["converted_kb"] = file_size_kb(output_path)
                if result_row["original_kb"] > 0:
                    result_row["reduction_percent"] = (1 - (result_row["converted_kb"] / result_row["original_kb"])) * 100
                converted += 1
            except Exception as exc:
                result_row["status"] = "ERRORE"
                errors.append(f"{file_path.name}: {exc}")
            self.add_result_row(result_row)
            self.append_csv_result(result_row)
            if hasattr(self, "details_tree"):
                self.root.after(0, self.add_tree_row, result_row)
            self.root.after(0, self.update_progress, index, len(files), file_path.name)
        self.root.after(0, self.finish_conversion, converted, warnings, errors, output_folder)

    def resize_image_if_needed(self, img):
        if not self.image_use_resize.get():
            return img
        mode = self.image_resize_mode.get()
        w, h = img.size
        if mode == "Lato lungo massimo":
            max_side = int(self.image_long_side.get())
            current_max = max(w, h)
            if current_max <= max_side:
                return img
            scale = max_side / current_max
            new_size = (round(w * scale), round(h * scale))
        elif mode == "Larghezza massima":
            target_w = int(self.image_width.get())
            if w <= target_w:
                return img
            scale = target_w / w
            new_size = (target_w, round(h * scale))
        elif mode == "Altezza massima":
            target_h = int(self.image_height.get())
            if h <= target_h:
                return img
            scale = target_h / h
            new_size = (round(w * scale), target_h)
        else:
            new_size = (int(self.image_width.get()), int(self.image_height.get()))
        return img.resize(new_size, Image.Resampling.LANCZOS)

    def prepare_image(self, img, pil_format):
        img = self.resize_image_if_needed(img)
        if pil_format in ("JPEG", "WEBP"):
            if img.mode in ("RGBA", "LA"):
                background = Image.new("RGB", img.size, (255, 255, 255))
                alpha = img.getchannel("A") if "A" in img.getbands() else None
                background.paste(img, mask=alpha)
                return background
            return img.convert("RGB")
        return img

    def convert_image(self, file_path, output_folder, image_counter, video_counter):
        fmt = IMAGE_OUTPUT_FORMATS[self.image_format.get()]
        output_file = self.get_output_filename(file_path, output_folder, fmt["extension"], image_counter, video_counter)
        pil_format = fmt["pil_format"]
        with Image.open(file_path) as img:
            img = self.prepare_image(img, pil_format)
            save_base = {}
            if self.image_use_dpi.get():
                dpi = int(self.image_dpi.get())
                save_base["dpi"] = (dpi, dpi)
            if pil_format == "PNG":
                img.save(output_file, "PNG", optimize=True, **save_base)
                return output_file, "PNG esportato, limite KB non garantito." if self.image_use_max_kb.get() else None
            start_q = int(self.image_quality.get())
            min_q = int(self.image_min_quality.get())
            if not self.image_use_max_kb.get():
                img.save(output_file, pil_format, quality=start_q, optimize=True, **save_base)
                return output_file, None
            max_bytes = int(self.image_max_kb.get()) * 1024
            best_data = None
            best_quality = min_q
            for q in range(start_q, min_q - 1, -5):
                buffer = io.BytesIO()
                img.save(buffer, pil_format, quality=q, optimize=True, **save_base)
                data = buffer.getvalue()
                best_data = data
                best_quality = q
                if len(data) <= max_bytes:
                    break
            with open(output_file, "wb") as f:
                f.write(best_data)
            final_size = output_file.stat().st_size
            if final_size > max_bytes:
                return output_file, f"{file_path.name}: {round(final_size / 1024)} KB anche con qualità {best_quality}."
            return output_file, None

    def convert_video(self, file_path, output_folder, image_counter, video_counter):
        """
        Conversione video robusta per file iPhone/MOV/MP4.
        Nota: FFmpeg scrive normalmente molte righe su stderr; con -loglevel error
        facciamo comparire solo i veri errori, evitando falsi allarmi nel programma.
        """
        if not self.ffmpeg_path:
            raise RuntimeError("FFmpeg non trovato.")

        output_file = self.get_output_filename(file_path, output_folder, ".mp4", image_counter, video_counter)

        width = int(self.video_width.get())
        height = int(self.video_height.get())
        crf = str(int(self.video_crf.get()))
        video_bitrate = self.video_bitrate.get().strip()
        audio_bitrate = self.audio_bitrate.get().strip()

        # Mantiene proporzioni, non deforma il video e riempie con bande nere se serve.
        video_filter = (
            f"scale={width}:{height}:force_original_aspect_ratio=decrease,"
            f"pad={width}:{height}:(ow-iw)/2:(oh-ih)/2"
        )

        cmd = [
            self.ffmpeg_path,
            "-hide_banner",
            "-loglevel", "error",
            "-y",
            "-ignore_unknown",
            "-i", str(file_path),
            "-map", "0:v:0",
        ]

        # Audio opzionale: alcuni file iPhone/MOV hanno tracce audio/metadata particolari.
        # La mappa con ? evita errore se l'audio manca.
        if self.video_remove_audio.get():
            cmd.extend(["-an"])
        else:
            cmd.extend(["-map", "0:a:0?", "-c:a", "aac", "-b:a", audio_bitrate, "-ac", "2"])

        cmd.extend([
            "-sn",              # ignora sottotitoli
            "-dn",              # ignora data streams/metadata extra
            "-map_metadata", "-1",
            "-vf", video_filter,
            "-c:v", "libx264",
            "-preset", "medium",
            "-crf", crf,
            "-b:v", video_bitrate,
            "-pix_fmt", "yuv420p",
            "-movflags", "+faststart",
        ])

        if self.video_fps.get() != "originale":
            cmd.extend(["-r", self.video_fps.get()])

        cmd.append(str(output_file))

        self.current_process = subprocess.Popen(
            cmd,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
            text=True,
            errors="replace"
        )

        stderr_chunks = []
        while True:
            if self.stop_requested and self.current_process.poll() is None:
                try:
                    self.current_process.terminate()
                except Exception:
                    pass

            line = self.current_process.stderr.readline()
            if line:
                stderr_chunks.append(line.strip())
                stderr_chunks = stderr_chunks[-20:]

            if self.current_process.poll() is not None:
                # Recupera eventuali ultime righe rimaste nel buffer.
                remaining = self.current_process.stderr.read()
                if remaining:
                    stderr_chunks.append(remaining.strip())
                break

            time.sleep(0.05)

        return_code = self.current_process.returncode
        self.current_process = None

        if self.stop_requested:
            raise RuntimeError("Conversione interrotta dall'utente.")

        if return_code != 0:
            error_text = "\n".join([x for x in stderr_chunks if x]).strip()
            if not error_text:
                error_text = "FFmpeg ha terminato con errore, ma non ha restituito un dettaglio leggibile."
            raise RuntimeError(error_text[-1200:])

        if not output_file.exists() or output_file.stat().st_size == 0:
            raise RuntimeError("Il file video di output non è stato creato correttamente o risulta vuoto.")

        return output_file

    def add_result_row(self, row):
        self.conversion_results.append(row)

    def append_csv_result(self, row):
        if not self.details_csv_path:
            return
        with open(self.details_csv_path, "a", newline="", encoding="utf-8-sig") as f:
            csv.writer(f, delimiter=";").writerow([row["type"], row["original_name"], f"{row['original_kb']:.1f}", row["converted_name"], f"{row['converted_kb']:.1f}" if row["converted_kb"] else "", f"{row['reduction_percent']:.1f}" if row["original_kb"] and row["converted_kb"] else "", row["original_path"], row["converted_path"], row["status"]])

    def clear_details(self):
        if hasattr(self, "details_tree"):
            for item in self.details_tree.get_children():
                self.details_tree.delete(item)
        if hasattr(self, "summary_label"):
            self.summary_label.config(text="Nessuna conversione eseguita.")

    def add_tree_row(self, row):
        original_kb = row["original_kb"]
        converted_kb = row["converted_kb"]
        reduction_text = f"{row['reduction_percent']:.1f}%" if row["status"] == "OK" and original_kb > 0 else ""
        self.details_tree.insert("", "end", values=(row["type"], row["original_name"], f"{original_kb:.1f}", row["converted_name"], f"{converted_kb:.1f}" if converted_kb else "", reduction_text, row["converted_path"], row["status"]))
        self.update_summary()

    def update_summary(self):
        total_original = sum(row["original_kb"] for row in self.conversion_results)
        total_converted = sum(row["converted_kb"] for row in self.conversion_results)
        ok_count = sum(1 for row in self.conversion_results if row["status"] == "OK")
        error_count = sum(1 for row in self.conversion_results if row["status"] == "ERRORE")
        if total_original > 0 and total_converted > 0:
            total_reduction = (1 - (total_converted / total_original)) * 100
            summary = f"File OK: {ok_count} | Errori: {error_count}\nTotale originali: {total_original / 1024:.2f} MB | Totale convertiti: {total_converted / 1024:.2f} MB | Riduzione totale: {total_reduction:.1f}%"
        else:
            summary = f"File OK: {ok_count} | Errori: {error_count}"
        if self.details_folder:
            summary += f"\nCartella dettagli: {self.details_folder}"
        if hasattr(self, "summary_label"):
            self.summary_label.config(text=summary)

    def update_progress(self, current, total, filename):
        self.progress["value"] = current
        percent = round((current / total) * 100) if total else 0
        self.progress_percent.set(f"{percent}%")
        self.operation_status.set(f"Convertito {current}/{total}: {filename}")

    def finish_conversion(self, converted, warnings, errors, output_folder):
        self.is_converting = False
        self.set_buttons_for_running(False)
        self.current_process = None
        self.operation_status.set(f"Completato. File convertiti: {converted}" if not self.stop_requested else f"Conversione interrotta. File convertiti: {converted}")
        self.update_summary()
        if hasattr(self, "converter_notebook"):
            self.converter_notebook.select(self.details_tab)
        message = f"File convertiti: {converted}\nCartella output:\n{output_folder}"
        if self.details_folder:
            message += f"\nCartella dettagli:\n{self.details_folder}"
        if self.stop_requested:
            message = "Conversione interrotta dall'utente.\n\n" + message
        if warnings:
            message += "\n\nAvvisi:\n" + "\n".join(warnings[:10])
        if errors:
            message += "\n\nErrori:\n" + "\n".join(errors[:10])
            messagebox.showwarning("Conversione completata con errori/avvisi", message)
        elif warnings or self.stop_requested:
            messagebox.showwarning("Conversione completata con avvisi", message)
        else:
            messagebox.showinfo("Conversione completata", message)


if __name__ == "__main__":
    root = tk.Tk()
    app = MediaASDDojoYamatoApp(root)
    root.mainloop()
