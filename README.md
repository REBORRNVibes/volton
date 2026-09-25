# Volton × REBORRN workspace

Ο κοινός χώρος για την επικοινωνία με την ομάδα της Volton, για τα δύο streams του έργου, το online acquisition και τον λογαριασμό.

**Site:** https://reborrnvibes.github.io/volton/

| Σελίδα | Διαδρομή |
|---|---|
| Αρχική | `index.html` |
| Παρουσίαση kick-off (1/10) | `kickoff/index.html` |
| Λίστα υλικών | `materials/index.html` |

## Πρόσβαση

Οι σελίδες είναι κρυπτογραφημένες (AES-GCM, κλειδί από τον κωδικό με PBKDF2). Στο repo υπάρχει μόνο η κρυπτογραφημένη εκδοχή. Τα αρχικά HTML ζουν στο `_src/`, που δεν ανεβαίνει (`.gitignore`). Ο κωδικός δεν γράφεται πουθενά στο repo, τον ξέρει η ομάδα του έργου.

## Προσθήκη ή αλλαγή εγγράφου

1. Αλλαγή ή νέα σελίδα μέσα στο `_src/`, π.χ. `_src/session-notes/index.html`, με το `assets/site.css` και το ίδιο header.
2. Νέα κάρτα στο `_src/index.html` (ενότητα «Έγγραφα») και γραμμή στις «Ενημερώσεις».
3. `VOLTON_PASS='…' node build.js` για να ξαναβγούν οι κρυπτογραφημένες σελίδες.
4. Commit και push στο `main`. Το GitHub Pages ανανεώνεται σε 1 με 2 λεπτά.

## Προσοχή

Το repo είναι **public**. Δεν ανεβάζουμε αρχεία της Volton, κόστη, εσωτερικές σημειώσεις ή δεδομένα πελατών. Αυτά μένουν στον κοινό φάκελο.

Το deck χτίζεται από το `volton-kickoff/` του project folder (`python3 src/build.py`) και αντιγράφεται στο `_src/kickoff/index.html`.
