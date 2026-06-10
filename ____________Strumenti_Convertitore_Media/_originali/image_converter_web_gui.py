import io
import threading
import tkinter as tk
from tkinter import filedialog, messagebox, ttk
from pathlib import Path

from PIL import Image
import pillow_heif


pillow_heif.register_heif_opener()


SUPPORTED_INPUT_EXTENSIONS = {
    ".heic", ".heif",
    ".jpg", ".jpeg",
    ".png",
    ".webp",
    ".bmp",
    ".tif", ".tiff"
}

OUTPUT_FORMATS = {
    "JPEG / JPG": {"pil_format": "JPEG", "extension": ".jpg"},
    "WEBP": {"pil_format": "WEBP", "extension": ".webp"},
    "PNG": {"pil_format": "PNG", "extension": ".png"}
}


class ImageConverterApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Convertitore immagini per il web")
        self.root.geometry("980x780")
        self.root.minsize(900, 720)

        self.input_source_label = tk.StringVar(value="Nessun input selezionato")
        self.output_folder = tk.StringVar()

        self.quality = tk.IntVar(value=88)
        self.use_max_size = tk.BooleanVar(value=True)
        self.max_size_kb = tk.IntVar(value=300)
        self.min_quality = tk.IntVar(value=50)
        self.output_format = tk.StringVar(value="JPEG / JPG")

        self.use_resize = tk.BooleanVar(value=True)
        self.resize_mode = tk.StringVar(value="Lato lungo massimo")
        self.max_long_side_px = tk.IntVar(value=1920)
        self.width_px = tk.IntVar(value=1920)
        self.height_px = tk.IntVar(value=1080)

        self.use_dpi = tk.BooleanVar(value=True)
        self.dpi_value = tk.IntVar(value=96)

        self.include_subfolders = tk.BooleanVar(value=False)

        self.selected_files = []

        self._build_ui()

    def _build_ui(self):
        title = tk.Label(
            self.root,
            text="Convertitore immagini per il web",
            font=("Segoe UI", 18, "bold")
        )
        title.pack(pady=(14, 4))

        subtitle = tk.Label(
            self.root,
            text="Input da singoli file o intera cartella. Output in cartella di destinazione scelta da te.",
            font=("Segoe UI", 10)
        )
        subtitle.pack(pady=(0, 10))

        main_frame = tk.Frame(self.root)
        main_frame.pack(fill="both", expand=True, padx=18, pady=8)

        input_frame = tk.LabelFrame(main_frame, text="1. Scegli INPUT: file singoli oppure cartella intera", padx=10, pady=10)
        input_frame.pack(fill="x", pady=5)

        input_buttons = tk.Frame(input_frame)
        input_buttons.pack(fill="x")

        tk.Button(
            input_buttons,
            text="Seleziona singoli file / file multipli",
            command=self.choose_multiple_files,
            height=2
        ).pack(side="left", fill="x", expand=True, padx=(0, 6))

        tk.Button(
            input_buttons,
            text="Seleziona intera cartella",
            command=self.choose_input_folder,
            height=2
        ).pack(side="left", fill="x", expand=True, padx=(6, 0))

        input_options = tk.Frame(input_frame)
        input_options.pack(fill="x", pady=(8, 0))

        tk.Checkbutton(
            input_options,
            text="Quando scelgo una cartella, includi anche sottocartelle",
            variable=self.include_subfolders
        ).pack(side="left")

        tk.Label(
            input_frame,
            textvariable=self.input_source_label,
            anchor="w",
            fg="#555555"
        ).pack(fill="x", pady=(6, 0))

        list_frame = tk.LabelFrame(main_frame, text="2. Immagini caricate", padx=10, pady=10)
        list_frame.pack(fill="both", expand=True, pady=5)

        self.file_listbox = tk.Listbox(list_frame, selectmode=tk.EXTENDED)
        self.file_listbox.pack(side="left", fill="both", expand=True)

        scrollbar = tk.Scrollbar(list_frame, orient="vertical", command=self.file_listbox.yview)
        scrollbar.pack(side="right", fill="y")
        self.file_listbox.config(yscrollcommand=scrollbar.set)

        list_buttons = tk.Frame(main_frame)
        list_buttons.pack(fill="x", pady=5)

        tk.Button(list_buttons, text="Seleziona tutti", command=self.select_all_files).pack(side="left", padx=(0, 8))
        tk.Button(list_buttons, text="Deseleziona tutti", command=self.clear_selection).pack(side="left", padx=(0, 8))
        tk.Button(list_buttons, text="Rimuovi selezionati", command=self.remove_selected_from_list).pack(side="left", padx=(0, 8))
        tk.Button(list_buttons, text="Svuota lista", command=self.clear_file_list).pack(side="left")

        output_frame = tk.LabelFrame(main_frame, text="3. Scegli OUTPUT: cartella di destinazione", padx=10, pady=10)
        output_frame.pack(fill="x", pady=5)

        tk.Entry(output_frame, textvariable=self.output_folder).pack(side="left", fill="x", expand=True, padx=(0, 8))
        tk.Button(
            output_frame,
            text="Seleziona cartella output",
            command=self.choose_output_folder,
            height=1
        ).pack(side="left")

        options_frame = tk.LabelFrame(main_frame, text="4. Formato, qualità e limite KB", padx=10, pady=10)
        options_frame.pack(fill="x", pady=5)

        format_row = tk.Frame(options_frame)
        format_row.pack(fill="x", pady=(0, 6))

        tk.Label(format_row, text="Formato export:").pack(side="left")
        format_combo = ttk.Combobox(
            format_row,
            textvariable=self.output_format,
            values=list(OUTPUT_FORMATS.keys()),
            state="readonly",
            width=16
        )
        format_combo.pack(side="left", padx=(8, 18))
        format_combo.bind("<<ComboboxSelected>>", lambda event: self.update_note())

        tk.Label(format_row, text="Qualità iniziale:").pack(side="left")
        tk.Scale(
            format_row,
            from_=40,
            to=100,
            orient="horizontal",
            variable=self.quality,
            length=220
        ).pack(side="left", padx=8)

        size_row = tk.Frame(options_frame)
        size_row.pack(fill="x", pady=(2, 0))

        tk.Checkbutton(size_row, text="Limita dimensione massima file", variable=self.use_max_size).pack(side="left")
        tk.Label(size_row, text="Max KB per immagine:").pack(side="left", padx=(18, 4))
        tk.Entry(size_row, textvariable=self.max_size_kb, width=8).pack(side="left")

        tk.Label(size_row, text="Qualità minima:").pack(side="left", padx=(18, 4))
        tk.Entry(size_row, textvariable=self.min_quality, width=8).pack(side="left")

        resize_frame = tk.LabelFrame(main_frame, text="5. Risoluzione / ridimensionamento", padx=10, pady=10)
        resize_frame.pack(fill="x", pady=5)

        resize_row_1 = tk.Frame(resize_frame)
        resize_row_1.pack(fill="x", pady=(0, 6))

        tk.Checkbutton(resize_row_1, text="Ridimensiona immagine", variable=self.use_resize).pack(side="left")

        tk.Label(resize_row_1, text="Modalità:").pack(side="left", padx=(18, 4))
        ttk.Combobox(
            resize_row_1,
            textvariable=self.resize_mode,
            values=["Lato lungo massimo", "Larghezza massima", "Altezza massima", "Dimensione esatta"],
            state="readonly",
            width=20
        ).pack(side="left")

        resize_row_2 = tk.Frame(resize_frame)
        resize_row_2.pack(fill="x")

        tk.Label(resize_row_2, text="Lato lungo max px:").pack(side="left")
        tk.Entry(resize_row_2, textvariable=self.max_long_side_px, width=8).pack(side="left", padx=(4, 18))

        tk.Label(resize_row_2, text="Larghezza px:").pack(side="left")
        tk.Entry(resize_row_2, textvariable=self.width_px, width=8).pack(side="left", padx=(4, 18))

        tk.Label(resize_row_2, text="Altezza px:").pack(side="left")
        tk.Entry(resize_row_2, textvariable=self.height_px, width=8).pack(side="left", padx=(4, 18))

        dpi_frame = tk.LabelFrame(main_frame, text="6. DPI esportazione", padx=10, pady=10)
        dpi_frame.pack(fill="x", pady=5)

        tk.Checkbutton(dpi_frame, text="Imposta DPI nel file esportato", variable=self.use_dpi).pack(side="left")
        tk.Label(dpi_frame, text="DPI:").pack(side="left", padx=(18, 4))
        tk.Entry(dpi_frame, textvariable=self.dpi_value, width=8).pack(side="left")

        self.note_label = tk.Label(main_frame, text="", font=("Segoe UI", 8), fg="#555555", anchor="w", justify="left")
        self.note_label.pack(fill="x", pady=(4, 0))
        self.update_note()

        progress_frame = tk.Frame(main_frame)
        progress_frame.pack(fill="x", pady=(8, 4))

        self.progress = ttk.Progressbar(progress_frame, orient="horizontal", mode="determinate")
        self.progress.pack(fill="x", expand=True)

        self.status_label = tk.Label(main_frame, text="Pronto", anchor="w")
        self.status_label.pack(fill="x")

        action_frame = tk.Frame(main_frame)
        action_frame.pack(fill="x", pady=(10, 0))

        tk.Button(action_frame, text="Converti solo file selezionati nella lista", command=self.convert_selected, height=2).pack(
            side="left", fill="x", expand=True, padx=(0, 6)
        )
        tk.Button(action_frame, text="Converti tutti i file caricati", command=self.convert_all, height=2).pack(
            side="left", fill="x", expand=True, padx=(6, 0)
        )

    def update_note(self):
        fmt = self.output_format.get()
        if fmt == "PNG":
            text = "PNG: utile per loghi/grafiche/trasparenze. Il limite KB non è garantito."
        elif fmt == "WEBP":
            text = "WEBP: consigliato per web, leggero e buona qualità. Il limite KB viene gestito con la qualità."
        else:
            text = "JPG: ideale per fotografie web. Il limite KB viene gestito con la qualità."
        text += " Per il web contano soprattutto pixel e peso file; i DPI sono secondari."
        self.note_label.config(text=text)

    def choose_input_folder(self):
        folder = filedialog.askdirectory(title="Scegli una cartella input")
        if folder:
            folder_path = Path(folder)
            self.input_source_label.set(f"Input selezionato: cartella - {folder_path}")
            if not self.output_folder.get():
                self.output_folder.set(str(folder_path / "WEB_convertite"))
            self.load_images_from_folder(folder_path)

    def choose_multiple_files(self):
        filetypes = [
            ("Immagini supportate", "*.heic *.heif *.jpg *.jpeg *.png *.webp *.bmp *.tif *.tiff"),
            ("HEIC / HEIF", "*.heic *.heif"),
            ("JPEG", "*.jpg *.jpeg"),
            ("PNG", "*.png"),
            ("WEBP", "*.webp"),
            ("Tutti i file", "*.*")
        ]

        files = filedialog.askopenfilenames(title="Seleziona uno o più file input", filetypes=filetypes)

        if files:
            paths = [Path(f) for f in files if Path(f).suffix.lower() in SUPPORTED_INPUT_EXTENSIONS]
            self.input_source_label.set(f"Input selezionato: {len(paths)} file singoli/multipli")
            self.add_files_to_list(paths)
            if not self.output_folder.get() and paths:
                self.output_folder.set(str(paths[0].parent / "WEB_convertite"))

    def choose_output_folder(self):
        folder = filedialog.askdirectory(title="Scegli la cartella output / destinazione")
        if folder:
            self.output_folder.set(folder)

    def load_images_from_folder(self, folder):
        if self.include_subfolders.get():
            files = [
                p for p in folder.rglob("*")
                if p.is_file() and p.suffix.lower() in SUPPORTED_INPUT_EXTENSIONS
            ]
        else:
            files = [
                p for p in folder.iterdir()
                if p.is_file() and p.suffix.lower() in SUPPORTED_INPUT_EXTENSIONS
            ]

        self.selected_files = []
        self.file_listbox.delete(0, tk.END)
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
                self.file_listbox.insert(tk.END, f"{file_path.name}   [{file_path.suffix.lower()}]   -   {file_path.parent}")
                existing.add(resolved)
                added += 1

        self.status_label.config(text=f"File caricati: {len(self.selected_files)}. Aggiunti ora: {added}.")

    def select_all_files(self):
        self.file_listbox.select_set(0, tk.END)

    def clear_selection(self):
        self.file_listbox.selection_clear(0, tk.END)

    def remove_selected_from_list(self):
        indexes = list(self.file_listbox.curselection())
        for i in reversed(indexes):
            self.file_listbox.delete(i)
            del self.selected_files[i]
        self.status_label.config(text=f"File caricati: {len(self.selected_files)}.")

    def clear_file_list(self):
        self.selected_files = []
        self.file_listbox.delete(0, tk.END)
        self.input_source_label.set("Nessun input selezionato")
        self.status_label.config(text="Lista svuotata.")

    def get_selected_file_paths(self):
        indexes = self.file_listbox.curselection()
        return [self.selected_files[i] for i in indexes]

    def validate_options(self):
        try:
            max_kb = int(self.max_size_kb.get())
            min_quality = int(self.min_quality.get())
            max_long_side = int(self.max_long_side_px.get())
            width = int(self.width_px.get())
            height = int(self.height_px.get())
            dpi = int(self.dpi_value.get())
        except Exception:
            messagebox.showwarning("Valori non validi", "Inserisci valori numerici per KB, qualità, pixel e DPI.")
            return False

        if max_kb < 10:
            messagebox.showwarning("Max KB troppo basso", "Imposta una dimensione massima di almeno 10 KB.")
            return False
        if min_quality < 10 or min_quality > 95:
            messagebox.showwarning("Qualità minima non valida", "Imposta una qualità minima tra 10 e 95.")
            return False
        if min_quality > self.quality.get():
            messagebox.showwarning("Qualità minima non valida", "La qualità minima non può essere superiore alla qualità iniziale.")
            return False
        if max_long_side < 100 or width < 100 or height < 100:
            messagebox.showwarning("Pixel troppo bassi", "Imposta valori pixel di almeno 100.")
            return False
        if dpi < 1 or dpi > 1200:
            messagebox.showwarning("DPI non validi", "Imposta DPI tra 1 e 1200.")
            return False
        return True

    def convert_selected(self):
        files = self.get_selected_file_paths()
        if not files:
            messagebox.showwarning("Nessun file selezionato", "Seleziona almeno un file dalla lista.")
            return
        self.start_conversion(files)

    def convert_all(self):
        if not self.selected_files:
            messagebox.showwarning("Nessun file caricato", "Scegli file singoli/multipli oppure una cartella intera.")
            return
        self.start_conversion(self.selected_files)

    def start_conversion(self, files):
        if not self.output_folder.get():
            messagebox.showwarning("Cartella output mancante", "Scegli prima la cartella di destinazione output.")
            return

        if not self.validate_options():
            return

        output = Path(self.output_folder.get())
        output.mkdir(parents=True, exist_ok=True)

        self.progress["value"] = 0
        self.progress["maximum"] = len(files)
        self.status_label.config(text="Conversione in corso...")

        thread = threading.Thread(target=self.convert_files, args=(files, output), daemon=True)
        thread.start()

    def get_output_path(self, input_file, output_folder):
        extension = OUTPUT_FORMATS[self.output_format.get()]["extension"]
        output_file = output_folder / f"{input_file.stem}{extension}"

        counter = 1
        while output_file.exists():
            output_file = output_folder / f"{input_file.stem}_{counter}{extension}"
            counter += 1

        return output_file

    def resize_image_if_needed(self, img):
        if not self.use_resize.get():
            return img

        mode = self.resize_mode.get()
        original_width, original_height = img.size

        if mode == "Lato lungo massimo":
            max_side = int(self.max_long_side_px.get())
            current_max = max(original_width, original_height)
            if current_max <= max_side:
                return img
            scale = max_side / current_max
            new_size = (round(original_width * scale), round(original_height * scale))
        elif mode == "Larghezza massima":
            target_width = int(self.width_px.get())
            if original_width <= target_width:
                return img
            scale = target_width / original_width
            new_size = (target_width, round(original_height * scale))
        elif mode == "Altezza massima":
            target_height = int(self.height_px.get())
            if original_height <= target_height:
                return img
            scale = target_height / original_height
            new_size = (round(original_width * scale), target_height)
        elif mode == "Dimensione esatta":
            new_size = (int(self.width_px.get()), int(self.height_px.get()))
        else:
            return img

        return img.resize(new_size, Image.Resampling.LANCZOS)

    def prepare_image_for_format(self, img):
        img = self.resize_image_if_needed(img)
        pil_format = OUTPUT_FORMATS[self.output_format.get()]["pil_format"]

        if pil_format in ("JPEG", "WEBP"):
            if img.mode in ("RGBA", "LA"):
                background = Image.new("RGB", img.size, (255, 255, 255))
                alpha = img.getchannel("A") if "A" in img.getbands() else None
                background.paste(img, mask=alpha)
                return background
            return img.convert("RGB")

        return img

    def get_dpi_tuple(self):
        if self.use_dpi.get():
            dpi = int(self.dpi_value.get())
            return (dpi, dpi)
        return None

    def save_with_options(self, img, output_file):
        pil_format = OUTPUT_FORMATS[self.output_format.get()]["pil_format"]
        dpi_tuple = self.get_dpi_tuple()

        save_kwargs_base = {}
        if dpi_tuple:
            save_kwargs_base["dpi"] = dpi_tuple

        if pil_format == "PNG":
            img.save(output_file, "PNG", optimize=True, **save_kwargs_base)
            return None, output_file.stat().st_size

        start_quality = int(self.quality.get())
        min_quality = int(self.min_quality.get())
        use_limit = bool(self.use_max_size.get())
        max_bytes = int(self.max_size_kb.get()) * 1024

        if not use_limit:
            img.save(output_file, pil_format, quality=start_quality, optimize=True, **save_kwargs_base)
            return start_quality, output_file.stat().st_size

        best_data = None
        best_quality = min_quality

        for q in range(start_quality, min_quality - 1, -5):
            buffer = io.BytesIO()
            img.save(buffer, pil_format, quality=q, optimize=True, **save_kwargs_base)
            data = buffer.getvalue()

            best_data = data
            best_quality = q

            if len(data) <= max_bytes:
                break

        with open(output_file, "wb") as f:
            f.write(best_data)

        return best_quality, output_file.stat().st_size

    def convert_files(self, files, output_folder):
        converted = 0
        errors = []
        warnings = []

        for index, file_path in enumerate(files, start=1):
            try:
                output_file = self.get_output_path(file_path, output_folder)

                with Image.open(file_path) as img:
                    img = self.prepare_image_for_format(img)
                    used_quality, final_size = self.save_with_options(img, output_file)

                converted += 1

                if self.use_max_size.get() and self.output_format.get() != "PNG":
                    max_bytes = int(self.max_size_kb.get()) * 1024
                    if final_size > max_bytes:
                        warnings.append(f"{file_path.name}: {round(final_size / 1024)} KB anche con qualità {used_quality}")

                if self.use_max_size.get() and self.output_format.get() == "PNG":
                    warnings.append(f"{file_path.name}: PNG salvato a {round(final_size / 1024)} KB. Il limite KB non è garantito per PNG.")

            except Exception as exc:
                errors.append(f"{file_path.name}: {exc}")

            self.root.after(0, self.update_progress, index, len(files), file_path.name)

        self.root.after(0, self.finish_conversion, converted, errors, warnings, output_folder)

    def update_progress(self, current, total, filename):
        self.progress["value"] = current
        self.status_label.config(text=f"Convertito {current}/{total}: {filename}")

    def finish_conversion(self, converted, errors, warnings, output_folder):
        message = f"File convertiti: {converted}\nCartella output:\n{output_folder}"

        if warnings:
            message += "\n\nAvvisi:\n" + "\n".join(warnings[:10])
            if len(warnings) > 10:
                message += f"\n...altri {len(warnings) - 10} avvisi."

        if errors:
            message += "\n\nErrori:\n" + "\n".join(errors[:10])
            if len(errors) > 10:
                message += f"\n...altri {len(errors) - 10} errori."
            messagebox.showwarning("Conversione completata con avvisi/errori", message)
        elif warnings:
            messagebox.showwarning("Conversione completata con avvisi", message)
        else:
            messagebox.showinfo("Conversione completata", message)

        self.status_label.config(text=f"Completato. File convertiti: {converted}")


if __name__ == "__main__":
    root = tk.Tk()
    app = ImageConverterApp(root)
    root.mainloop()
