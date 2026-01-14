CREATE OR REPLACE FUNCTION handle_after_add_step_fn()
RETURNS TRIGGER AS $$
DECLARE season_st season_status;
BEGIN
	SELECT season.status INTO season_st
    FROM season
    WHERE season.id = NEW.season_id;

    IF (season_st = 'PENDING') THEN
        UPDATE season
        SET "status" = 'IN_PROGRESS'
        WHERE season.id = NEW.season_id;
    END IF;

	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER handle_after_add_step_trg
AFTER INSERT ON season_detail
FOR EACH ROW
EXECUTE FUNCTION handle_after_add_step_fn();