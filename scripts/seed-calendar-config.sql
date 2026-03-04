-- Dane startowe konfiguracji kalendarzy (faza2a).
-- Zamień [id_wesela_diament] itd. na prawdziwe ID z Google Calendar → Ustawienia kalendarza → ID kalendarza.

INSERT INTO calendar_config (calendarId, calendarName, eventType, roomName) VALUES
('[id wesela diament]', 'Wesela Sala Diamentowa', 'WESELE', 'Sala Diamentowa'),
('[id wesela zlota]', 'Wesela Sala Złota', 'WESELE', 'Sala Złota'),
('[id chrzciny]', 'Chrzciny', 'CHRZCINY', NULL),
('[id komunia]', 'I Komunia', 'KOMUNIA', NULL),
('[id urodziny]', 'Urodziny Rocznice', 'URODZINY_ROCZNICA', NULL),
('[id stypy]', 'Stypy', 'STYPA', NULL),
('[id imp_firmowe]', 'Imprezy Firmowe', 'IMPREZA_FIRMOWA', NULL),
('[id catering]', 'Catering Imprezowy', 'CATERING', NULL),
('[id spotkania]', 'Spotkania firmowe', 'SPOTKANIE', NULL),
('[id poprawiny]', 'Poprawiny KARCZMA', 'POPRAWINY', NULL),
('[id sylwester]', 'Sylwester', 'SYLWESTER', NULL);
