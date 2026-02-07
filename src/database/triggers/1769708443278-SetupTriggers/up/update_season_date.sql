CREATE OR REPLACE FUNCTION update_season_date_fn()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE season
    SET updated = NOW()
    WHERE season.id = COALESCE(NEW.season_id, OLD.season_id);

	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_season_date_trg
AFTER INSERT OR UPDATE ON season_detail
FOR EACH ROW
EXECUTE FUNCTION update_season_date_fn();