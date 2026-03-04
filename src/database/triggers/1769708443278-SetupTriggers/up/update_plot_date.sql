CREATE OR REPLACE FUNCTION update_plot_date_fn()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE plot
    SET updated = NOW()
    WHERE plot.id = COALESCE(NEW.plot_id, OLD.plot_id);

	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_plot_date_trg
AFTER INSERT OR UPDATE ON season
FOR EACH ROW
EXECUTE FUNCTION update_plot_date_fn();