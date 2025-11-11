CREATE OR REPLACE FUNCTION handle_after_add_logs_fn()
RETURNS TRIGGER AS $$
DECLARE step_st step_status; 
BEGIN
	IF (NEW."type" = 'DONE') THEN
		UPDATE season_detail
		SET step_status = 'DONE'
		WHERE season_detail.id = NEW.season_detail_id;
	ELSE
		SELECT step_status INTO step_st
		FROM season_detail
		WHERE season_detail.id = NEW.season_detail_id;

		IF step_st = "PENDING" THEN
			UPDATE season_detail
			SET step_status = 'IN_PROGRESS'
			WHERE season_detail.id = NEW.season_detail_id;
		END IF;
	END IF;

	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER handle_after_add_logs_trg
AFTER INSERT ON "log"
FOR EACH ROW
EXECUTE FUNCTION handle_after_add_logs_fn();