CREATE OR REPLACE FUNCTION validate_add_step_fn()
RETURNS TRIGGER AS $$
DECLARE prev_step_order INT;
DECLARE cur_step_order INT;
DECLARE plot_crop_type crop_type_enum;
DECLARE step_crop_type crop_type_enum;
DECLARE prev_step_status season_detail_step_status_enum;
BEGIN
	SELECT crop_type INTO plot_crop_type
	FROM plot JOIN season ON plot.id = season.plot_id
	WHERE season.id = NEW.season_id AND plot.farm_id = NEW.farm_id;

	SELECT for_crop_type, "order" INTO step_crop_type, cur_step_order
	FROM step
	WHERE step.id = NEW.step_id;

	IF (step_crop_type != plot_crop_type) THEN
		RAISE EXCEPTION 'Invalid step for %', plot_crop_type;
	END IF;

	SELECT MAX("order"), step_status INTO prev_step_order, prev_step_status
	FROM season_detail 
		JOIN step ON season_detail.step_id = step.id
	WHERE season_id = NEW.season_id AND ("order" % 10 = 0)
	GROUP BY step_status;

	IF (prev_step_status != 'DONE') THEN
		RAISE EXCEPTION 'Previous step is in process';
	END IF;

	IF (prev_step_order IS NOT NULL) AND (prev_step_order >= cur_step_order OR cur_step_order > prev_step_order + 10) THEN
		RAISE EXCEPTION 'The current step''s order must greater than previous step''s and less than or equal previous step''s order + 1';
	END IF;

	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER validate_add_step_trg
BEFORE INSERT ON season_detail
FOR EACH ROW
EXECUTE FUNCTION validate_add_step_fn();