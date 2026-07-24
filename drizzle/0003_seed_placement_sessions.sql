INSERT INTO "sessions" ("day_label", "session_no", "quota")
VALUES
	('Senin, 7 September 2026', 1, 40),
	('Senin, 7 September 2026', 2, 40),
	('Selasa, 8 September 2026', 1, 40),
	('Selasa, 8 September 2026', 2, 40),
	('Rabu, 9 September 2026', 1, 40),
	('Rabu, 9 September 2026', 2, 40),
	('Kamis, 10 September 2026', 1, 40),
	('Kamis, 10 September 2026', 2, 40),
	('Jumat, 11 September 2026', 1, 40),
	('Jumat, 11 September 2026', 2, 40),
	('Sabtu, 12 September 2026', 1, 40),
	('Sabtu, 12 September 2026', 2, 40),
	('Minggu, 13 September 2026', 1, 40),
	('Minggu, 13 September 2026', 2, 40)
ON CONFLICT ("day_label", "session_no")
DO UPDATE SET "quota" = EXCLUDED."quota";
