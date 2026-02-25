export interface TrustedLogDefault {
    // spatial plausibility
    logLocation: { latitude: number, longitude: number }
    plotLocation: { latitude: number, longitude: number }

    // evidence completeness
    imageCount: number;
    videoCount: number

    // temporal plausibility
}

export interface TrustedLogAuditor {
    identifier: string,
    id: number,
    imageCount: number;
    videoCount: number
    logLocation: { latitude: number, longitude: number }
    plotLocation: { latitude: number, longitude: number }
}