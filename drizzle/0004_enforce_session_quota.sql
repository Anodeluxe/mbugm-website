CREATE OR REPLACE FUNCTION "enforce_session_quota"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
	"session_quota" integer;
BEGIN
	IF NEW."session_id" IS NULL
		OR (TG_OP = 'UPDATE' AND NEW."session_id" IS NOT DISTINCT FROM OLD."session_id")
	THEN
		RETURN NEW;
	END IF;

	SELECT "quota"
	INTO "session_quota"
	FROM "sessions"
	WHERE "id" = NEW."session_id"
	FOR UPDATE;

	IF (
		SELECT count(*)
		FROM "applicants"
		WHERE "session_id" = NEW."session_id"
	) >= "session_quota" THEN
		RAISE EXCEPTION 'placement session is full'
			USING
				ERRCODE = '23514',
				CONSTRAINT = 'session_quota_not_exceeded';
	END IF;

	RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER "applicants_enforce_session_quota"
BEFORE INSERT OR UPDATE OF "session_id" ON "applicants"
FOR EACH ROW
EXECUTE FUNCTION "enforce_session_quota"();
