export interface ImagePerImageResult {
    image_url: string;
    is_agricultural: boolean;
    web_match_count: number;
    web_partial_match_count: number;
    labels: string[];
    flags: string[];
}

export interface ImageAnalysisResult {
    safe_search: {
        adult: string;
        violence: string;
        racy: string;
    };
    web_detection: {
        full_matching_images_count: number;
        partial_matching_images_count: number;
        pages_with_matching_images_count: number;
        is_stock_or_web_image: boolean;
    };
    label_annotations: string[];
    is_agricultural: boolean;
    manipulation_indicators: string[];
    per_image_results: ImagePerImageResult[];
}
