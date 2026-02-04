export class TrustedLog {
    id: number;

    // provenance
    verified: boolean;

    // spatial plausibility
    log_location: { lat: number, lng: number }
    plot_location: { lat: number, lng: number }

    // evidence completeness
    image_count: number;
    video_count: number

    // step compliance
    is_compliant: boolean;

    // temporal plausibility
}