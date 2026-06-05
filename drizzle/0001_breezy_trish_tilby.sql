CREATE TYPE "public"."app_status" AS ENUM('submitted', 'under_review', 'accepted', 'waitlisted', 'rejected', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."blood_type" AS ENUM('A', 'B', 'AB', 'O');--> statement-breakpoint
CREATE TYPE "public"."housing_type" AS ENUM('Kos', 'Asrama', 'Rumah orang tua', 'Rumah saudara', 'Lainnya');--> statement-breakpoint
CREATE TYPE "public"."sex" AS ENUM('Laki-laki', 'Perempuan');--> statement-breakpoint
CREATE TYPE "public"."study_level" AS ENUM('D3', 'D4', 'S1', 'S2', 'S3', 'Profesi');--> statement-breakpoint
CREATE TABLE "applicants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference_number" text NOT NULL,
	"submission_token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip" text,
	"status" "app_status" DEFAULT 'submitted' NOT NULL,
	"nim" text NOT NULL,
	"nama_lengkap" text NOT NULL,
	"nama_panggilan" text,
	"tempat_lahir" text,
	"tanggal_lahir" date,
	"jenis_kelamin" "sex",
	"agama" text,
	"golongan_darah" "blood_type",
	"tinggi_badan_cm" integer,
	"berat_badan_kg" integer,
	"riwayat_penyakit" text,
	"alergi" text,
	"hobi" text,
	"jenjang_studi" "study_level",
	"fakultas" text,
	"prodi" text,
	"asal_sma" text,
	"no_telp" text,
	"email" text,
	"alamat_asal" text,
	"jenis_tempat" "housing_type",
	"alamat_jogja" text,
	"nama_ortu" text,
	"no_ortu" text,
	"alamat_ortu" text,
	"id_line" text,
	"id_instagram" text,
	"id_facebook" text,
	"id_twitter" text,
	"bidang_tari" text,
	"bidang_musik" text,
	"organisasi" text,
	"pernah_mb" boolean DEFAULT false NOT NULL,
	"unit_sebelumnya" text,
	"section" text,
	"kemampuan_alat" text,
	"session_id" integer,
	"pas_foto_drive_id" text,
	"foto_ktm_drive_id" text,
	"pdf_drive_id" text,
	"payment_proof_drive_id" text,
	"payment_status" boolean DEFAULT false NOT NULL,
	"paid_at" timestamp with time zone,
	"pdf_generated" boolean DEFAULT false NOT NULL,
	"drive_synced" boolean DEFAULT false NOT NULL,
	"sheet_synced" boolean DEFAULT false NOT NULL,
	CONSTRAINT "applicants_reference_number_unique" UNIQUE("reference_number"),
	CONSTRAINT "applicants_submission_token_unique" UNIQUE("submission_token"),
	CONSTRAINT "applicants_nim_unique" UNIQUE("nim")
);
--> statement-breakpoint
ALTER TABLE "applicants" ADD CONSTRAINT "applicants_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_applicants_email" ON "applicants" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_applicants_created_at" ON "applicants" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_applicants_status" ON "applicants" USING btree ("status");--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_day_session_unique" UNIQUE("day_label","session_no");