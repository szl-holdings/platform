ALTER TABLE "ot_ics_conversations" ADD COLUMN IF NOT EXISTS "payload_hex" text NOT NULL DEFAULT '';
--> statement-breakpoint
UPDATE "ot_ics_conversations" SET "payload_hex" = '', "bytes" = 54
  WHERE "session_id" = 'INC-2024-0329' AND "seq" IN (1, 2);
--> statement-breakpoint
UPDATE "ot_ics_conversations" SET "payload_hex" = '03 00 00 16 11 E0 00 00 00 01 00 C0 01 0A C1 02 01 00 C2 02 01 02', "bytes" = 76
  WHERE "session_id" = 'INC-2024-0329' AND "seq" = 3;
--> statement-breakpoint
UPDATE "ot_ics_conversations" SET "payload_hex" = '03 00 00 16 11 D0 00 01 00 01 00 C0 01 0A C1 02 01 00 C2 02 01 02', "bytes" = 76
  WHERE "session_id" = 'INC-2024-0329' AND "seq" = 4;
--> statement-breakpoint
UPDATE "ot_ics_conversations" SET "payload_hex" = '03 00 00 19 02 F0 80 32 01 00 00 00 00 00 08 00 00 F0 00 00 03 00 03 01 E0', "bytes" = 79
  WHERE "session_id" = 'INC-2024-0329' AND "seq" = 5;
--> statement-breakpoint
UPDATE "ot_ics_conversations" SET "payload_hex" = '03 00 00 21 02 F0 80 32 01 00 00 04 00 00 0E 00 00 05 01 12 04 11 44 01 00 FF 09 00 04 00 01 00 00', "bytes" = 87
  WHERE "session_id" = 'INC-2024-0329' AND "seq" = 6;
--> statement-breakpoint
UPDATE "ot_ics_conversations" SET "payload_hex" = '00 17 00 00 00 06 01 03 00 00 00 15', "bytes" = 66
  WHERE "session_id" = 'INC-2024-0329' AND "seq" = 7;
--> statement-breakpoint
UPDATE "ot_ics_conversations" SET "payload_hex" = '05 64 1A 44 03 00 04 00 BD 71 C0 C7 81 00 00 1E 02 00 00 00 00 8A 05', "bytes" = 77
  WHERE "session_id" = 'INC-2024-0329' AND "seq" = 8;
--> statement-breakpoint
UPDATE "ot_ics_conversations" SET "payload_hex" = '00 19 00 00 00 06 01 06 00 14 07 D0', "bytes" = 66
  WHERE "session_id" = 'INC-2024-0329' AND "seq" = 9;
--> statement-breakpoint
UPDATE "ot_ics_conversations" SET "payload_hex" = '00 1A 00 00 00 06 01 03 00 14 00 01', "bytes" = 66
  WHERE "session_id" = 'INC-2024-0329' AND "seq" = 10;
