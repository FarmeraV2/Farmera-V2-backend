CREATE OR REPLACE FUNCTION validate_add_season_fn()
RETURNS TRIGGER AS $$
DECLARE cur_crop_type crop_type;
DECLARE season_id INT;
DECLARE prev_season_status season_status;
BEGIN
    IF (NEW.start_date < CURRENT_DATE) THEN
        RAISE EXCEPTION 'Start date (%) cannot be earlier than today (%)',
            NEW.start_date, CURRENT_DATE
			USING ERRCODE = 'SS000';
    END IF;

	SELECT status INTO prev_season_status
	FROM season
	WHERE season.plot_id = NEW.plot_id
	ORDER BY season.id
	LIMIT 1;

	IF (prev_season_status != 'DONE') THEN
		RAISE EXCEPTION 'Previous season is in process'
		USING ERRCODE = 'SS002';
	END IF;

	SELECT crop_type, season.id INTO cur_crop_type, season_id
	FROM plot LEFT JOIN season ON plot.id = season.plot_id
	WHERE plot.id = NEW.plot_id;

	IF (cur_crop_type = 'SHORT_TERM' AND season_id IS NOT NULL) THEN
		RAISE EXCEPTION 'Short term crops can not have more than 1 season'
		USING ERRCODE = 'SS001';
	END IF;

	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER validate_add_season_trg
BEFORE INSERT ON season
FOR EACH ROW
EXECUTE FUNCTION validate_add_season_fn();