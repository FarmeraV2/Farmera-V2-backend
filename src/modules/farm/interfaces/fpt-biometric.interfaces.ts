export interface FptLivenessResult {
    code: string;
    message: string;
    is_live: string;
    spoof_prob?: string;
    need_to_review?: string;
    is_deepfake?: string;
    deepfake_prob?: string;
    warning?: string;
}
export interface FptFaceMatchResult {
    code: string;
    message: string;
    isMatch: string;
    similarity?: string;
    warning?: string;
}
export interface FptFaceMatchError {
    code: string;
    data: string;
}

export interface FptBiometricResponse {
    code: string;
    message: string;
    liveness?: FptLivenessResult;
    face_match?: FptFaceMatchResult;
    face_match_error?: FptFaceMatchError;
    data?: string;
}
