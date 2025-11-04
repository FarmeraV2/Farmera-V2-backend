CREATE OR REPLACE FUNCTION handle_after_update_step_fn()
RETURNS TRIGGER AS $$
DECLARE cur_step_type step_type_enum;
BEGIN
	SELECT "type" INTO cur_step_type
	FROM step 
	WHERE step.id = NEW.step_id;

	IF (NEW.step_status = 'DONE' AND cur_step_type = 'POST_HARVEST') THEN
		UPDATE season
		SET status = 'DONE'
		WHERE NEW.season_id = season.id;
	END IF;

	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER handle_after_update_step_trg
AFTER UPDATE ON season_detail
FOR EACH ROW
EXECUTE FUNCTION handle_after_update_step_fn();