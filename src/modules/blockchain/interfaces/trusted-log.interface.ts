export interface TrustedLog {
    // provenance
    verified: boolean;

    // spatial plausibility
    logLocation: { latitude: number, longitude: number }
    plotLocation: { latitude: number, longitude: number }

    // evidence completeness
    imageCount: number;
    videoCount: number

    // temporal plausibility
}