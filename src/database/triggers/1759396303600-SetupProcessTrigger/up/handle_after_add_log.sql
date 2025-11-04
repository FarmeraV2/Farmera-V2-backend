CREATE OR REPLACE FUNCTION handle_after_add_logs_fn()
RETURNS TRIGGER AS $$
BEGIN
	IF (NEW."type" = 'DONE') THEN
		UPDATE season_detail
		SET step_status = 'DONE'
		WHERE season_detail.id = NEW.season_detail_id;
	END IF;

	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER handle_after_add_logs_trg
AFTER INSERT ON "log"
FOR EACH ROW
EXECUTE FUNCTION handle_after_add_logs_fn();