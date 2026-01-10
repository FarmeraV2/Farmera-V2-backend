CREATE OR REPLACE FUNCTION handle_before_add_logs_fn()
RETURNS TRIGGER AS $$
DECLARE num_steps INT;
DECLARE min_logs INT;
DECLARE step_st step_status; 
BEGIN
    SELECT s.min_logs, sd.step_status INTO min_logs, step_st
    FROM season_detail sd JOIN step s ON s.id = sd.step_id
    WHERE sd.season_id = NEW.season_id AND sd.step_id = NEW.step_id;

    IF step_st = 'DONE' THEN 
		RAISE EXCEPTION 'Cannot add logs to a step that is already DONE.'
		USING ERRCODE = 'LG001';
    END IF;

    SELECT COUNT(lg.id) INTO num_steps
    FROM "log" lg
    WHERE lg.season_id = NEW.season_id AND lg.step_id = NEW.step_id;

    IF (NEW."type" = 'DONE') AND (num_steps < min_logs - 1) THEN 
		RAISE EXCEPTION 'Not enough logs to mark step as DONE. Minimum required: %', min_logs
		USING ERRCODE = 'LG002';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_before_add_logs_trg ON "log";
CREATE TRIGGER handle_before_add_logs_trg
BEFORE INSERT ON "log"
FOR EACH ROW
EXECUTE FUNCTION handle_before_add_logs_fn();