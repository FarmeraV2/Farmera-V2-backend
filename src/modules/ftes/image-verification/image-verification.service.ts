import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import sharp from 'sharp';
import { ImageHash } from '../entities/image-hash.entity';
import { ImageVerificationResult } from '../entities/image-verification-result.entity';
import { Log } from 'src/modules/crop-management/entities/log.entity';
import { FileStorageService } from 'src/core/file-storage/interfaces/file-storage.interface';
import { ImageAnalysisResult, ImagePerImageResult } from '../interfaces/image-analysis.interface';

const AGRICULTURAL_LABELS = [
    'agriculture', 'farm', 'crop', 'plant', 'soil', 'field', 'harvest',
    'vegetable', 'fruit', 'seed', 'irrigation', 'greenhouse', 'livestock',
    'garden', 'land', 'terrain', 'leaf', 'flower', 'tree', 'grass',
    'organic', 'plantation', 'cultivation', 'fertilizer', 'compost',
    'tractor', 'plowing', 'rice', 'corn', 'wheat', 'paddy', 'orchard',
    'farming', 'rural', 'countryside', 'food', 'produce', 'growth',
];

@Injectable()
export class ImageVerificationService {
    private readonly logger = new Logger(ImageVerificationService.name);
    private readonly visionClient: ImageAnnotatorClient | null = null;
    private readonly HAMMING_THRESHOLD = 10;

    constructor(
        @InjectRepository(ImageHash)
        private readonly imageHashRepo: Repository<ImageHash>,
        @InjectRepository(ImageVerificationResult)
        private readonly verificationResultRepo: Repository<ImageVerificationResult>,
        @Inject('FileStorageService')
        private readonly fileStorageService: FileStorageService,
        private readonly configService: ConfigService,
    ) {
        const credentialsPath = this.configService.get<string>('GOOGLE_APPLICATION_CREDENTIALS');
        if (credentialsPath) {
            this.visionClient = new ImageAnnotatorClient({
                keyFilename: credentialsPath,
            });
            this.logger.log('Google Cloud Vision API initialized');
        } else {
            this.logger.warn('GOOGLE_APPLICATION_CREDENTIALS not set, image verification AI analysis disabled');
        }
    }

    /**
     * Main entry point — called fire-and-forget after log creation.
     * Orchestrates pHash computation, duplicate detection, and AI analysis.
     */
    /**
     * Main entry point — called synchronously during log creation.
     * Orchestrates pHash computation, duplicate detection, and AI analysis.
     * Returns true if images pass verification (score >= threshold).
     */
    async verifyLogImages(log: Log): Promise<boolean> {
        const VERIFICATION_THRESHOLD = 0.5;

        try {
            this.logger.debug(`Starting image verification for log ${log.id} (${log.image_urls.length} images)`);

            if (!log.image_urls || log.image_urls.length === 0) {
                await this.saveResult(log, 1.0, false, undefined, undefined);
                return true;
            }

            // 1. Fetch image buffers from storage
            const imageBuffers = await this.fetchImageBuffers(log.image_urls);
            if (imageBuffers.length === 0) {
                this.logger.warn(`No images could be fetched for log ${log.id}`);
                await this.saveResult(log, 0.5, false, undefined, undefined);
                return false;
            }

            // 2. Compute perceptual hashes
            const hashes: { phash: string; image_url: string }[] = [];
            for (const img of imageBuffers) {
                try {
                    const phash = await this.computePerceptualHash(img.buffer);
                    hashes.push({ phash, image_url: img.url });
                } catch (err) {
                    this.logger.error(`Failed to compute pHash for ${img.url}: ${err.message}`);
                }
            }

            // 3. Check for duplicates (cross-farm)
            const duplicateResult = await this.checkDuplicates(hashes, log.farm_id, log.id);

            // 4. Save perceptual hashes
            await this.saveHashes(hashes, log.id, log.farm_id);

            // 5. AI analysis with Google Cloud Vision
            const aiAnalysis = await this.analyzeWithVision(imageBuffers);

            // 6. Calculate overall score
            const overallScore = this.calculateOverallScore(aiAnalysis, duplicateResult.isDuplicate);

            // 7. Persist verification result
            await this.saveResult(
                log,
                overallScore,
                duplicateResult.isDuplicate,
                duplicateResult.sourceLogId,
                aiAnalysis,
            );

            const passed = overallScore >= VERIFICATION_THRESHOLD;
            this.logger.debug(`Image verification complete for log ${log.id}: score=${overallScore}, duplicate=${duplicateResult.isDuplicate}, passed=${passed}`);
            return passed;
        } catch (error) {
            this.logger.error(`Image verification failed for log ${log.id}: ${error.message}`);
            return false;
        }
    }

    /**
     * Fetch image buffers from storage service.
     */
    private async fetchImageBuffers(imageUrls: string[]): Promise<{ buffer: Buffer; url: string; mimeType: string }[]> {
        const results: { buffer: Buffer; url: string; mimeType: string }[] = [];

        for (const url of imageUrls) {
            try {
                if (!this.fileStorageService.serveFile) {
                    this.logger.warn('FileStorageService does not implement serveFile');
                    break;
                }
                const filePath = url.substring(url.indexOf("uploads"));
                const { buffer, mimeType } = await this.fileStorageService.serveFile(filePath);
                if (buffer) {
                    results.push({ buffer: buffer, url, mimeType: mimeType });
                }
            } catch (err) {
                this.logger.error(`Failed to fetch image ${url}: ${err.message}`);
            }
        }

        return results;
    }

    // ──────────────────────────────────────────────
    //  Perceptual Hashing (aHash via sharp)
    // ──────────────────────────────────────────────

    /**
     * Compute an average perceptual hash (aHash) for an image.
     * Resize to 8x8 grayscale, compare each pixel to mean → 64-bit binary → 16-char hex.
     */
    private async computePerceptualHash(imageBuffer: Buffer): Promise<string> {
        const { data } = await sharp(imageBuffer)
            .resize(8, 8, { fit: 'fill' })
            .grayscale()
            .raw()
            .toBuffer({ resolveWithObject: true });

        const pixels = Array.from(data) as number[];
        const mean = pixels.reduce((sum, val) => sum + val, 0) / pixels.length;

        let hash = '';
        for (const pixel of pixels) {
            hash += pixel >= mean ? '1' : '0';
        }

        // Convert 64-bit binary to 16-char hex
        let hex = '';
        for (let i = 0; i < 64; i += 4) {
            hex += parseInt(hash.substring(i, i + 4), 2).toString(16);
        }

        return hex;
    }

    /**
     * Compute Hamming distance between two hex hash strings.
     */
    private hammingDistance(hash1: string, hash2: string): number {
        if (hash1.length !== hash2.length) return 64;

        let distance = 0;
        for (let i = 0; i < hash1.length; i++) {
            const xor = parseInt(hash1[i], 16) ^ parseInt(hash2[i], 16);
            // Count bits in xor (Brian Kernighan's algorithm for 4-bit nibble)
            let bits = xor;
            while (bits) {
                bits &= bits - 1;
                distance++;
            }
        }
        return distance;
    }

    // ──────────────────────────────────────────────
    //  Duplicate Detection (Cross-Farm)
    // ──────────────────────────────────────────────

    /**
     * Check if any of the new image hashes match existing hashes from other farms.
     */
    private async checkDuplicates(
        hashes: { phash: string; image_url: string }[],
        farmId: number,
        logId: number,
    ): Promise<{ isDuplicate: boolean; sourceLogId?: number }> {
        if (hashes.length === 0) return { isDuplicate: false };

        try {
            // Fetch all existing hashes (excluding current farm)
            const existingHashes = await this.imageHashRepo
                .createQueryBuilder('ih')
                .select(['ih.phash', 'ih.log_id', 'ih.farm_id'])
                .where('ih.farm_id != :farmId', { farmId })
                .getMany();

            for (const newHash of hashes) {
                for (const existing of existingHashes) {
                    const distance = this.hammingDistance(newHash.phash, existing.phash);
                    if (distance <= this.HAMMING_THRESHOLD) {
                        this.logger.warn(
                            `Duplicate detected: log ${logId} image matches log ${existing.log_id} ` +
                            `from farm ${existing.farm_id} (distance=${distance})`
                        );
                        return { isDuplicate: true, sourceLogId: existing.log_id };
                    }
                }
            }

            return { isDuplicate: false };
        } catch (error) {
            this.logger.error(`Duplicate check failed: ${error.message}`);
            return { isDuplicate: false };
        }
    }

    // ──────────────────────────────────────────────
    //  Google Cloud Vision API Analysis
    // ──────────────────────────────────────────────

    /**
     * Analyze images using Google Cloud Vision API.
     * Uses: label detection, web detection, safe search, and image properties.
     */
    private async analyzeWithVision(
        imageBuffers: { buffer: Buffer; url: string; mimeType: string }[],
    ): Promise<ImageAnalysisResult> {
        const defaultAnalysis: ImageAnalysisResult = {
            safe_search: { adult: 'UNKNOWN', violence: 'UNKNOWN', racy: 'UNKNOWN' },
            web_detection: {
                full_matching_images_count: 0,
                pages_with_matching_images_count: 0,
                is_stock_or_web_image: false,
            },
            label_annotations: [],
            is_agricultural: true,
            manipulation_indicators: [],
            per_image_results: [],
        };

        if (!this.visionClient) {
            this.logger.warn('Vision API client not initialized, returning default analysis');
            return defaultAnalysis;
        }

        try {
            let totalFullMatches = 0;
            let totalPageMatches = 0;
            let isAnyStockImage = false;
            const allLabels: Set<string> = new Set();
            const allFlags: string[] = [];
            const perImageResults: ImagePerImageResult[] = [];
            let safeSearch = defaultAnalysis.safe_search;

            for (const img of imageBuffers) {
                // Resize for API efficiency (max 1024px)
                const resizedBuffer = await sharp(img.buffer)
                    .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
                    .toBuffer();

                const [result] = await this.visionClient.annotateImage({
                    image: { content: resizedBuffer.toString('base64') },
                    features: [
                        { type: 'LABEL_DETECTION', maxResults: 15 },
                        { type: 'WEB_DETECTION', maxResults: 10 },
                        { type: 'SAFE_SEARCH_DETECTION' },
                        { type: 'IMAGE_PROPERTIES' },
                    ],
                });

                // Label detection
                const labels = (result.labelAnnotations ?? [])
                    .map(l => l.description?.toLowerCase() ?? '')
                    .filter(Boolean);
                labels.forEach(l => allLabels.add(l));

                const isAgricultural = labels.some(label =>
                    AGRICULTURAL_LABELS.some(agLabel => label.includes(agLabel))
                );

                // Web detection
                const webDetection = result.webDetection;
                const fullMatchCount = webDetection?.fullMatchingImages?.length ?? 0;
                const pageMatchCount = webDetection?.pagesWithMatchingImages?.length ?? 0;
                totalFullMatches += fullMatchCount;
                totalPageMatches += pageMatchCount;

                // Check if image is stock/web sourced
                const bestGuessLabels = webDetection?.bestGuessLabels?.map(l => l.label?.toLowerCase() ?? '') ?? [];
                const isStockImage = bestGuessLabels.some(l =>
                    l.includes('stock') || l.includes('getty') || l.includes('shutterstock') || l.includes('adobe')
                ) || fullMatchCount >= 3;

                if (isStockImage) isAnyStockImage = true;

                // Safe search
                if (result.safeSearchAnnotation) {
                    safeSearch = {
                        adult: result.safeSearchAnnotation.adult as string ?? 'UNKNOWN',
                        violence: result.safeSearchAnnotation.violence as string ?? 'UNKNOWN',
                        racy: result.safeSearchAnnotation.racy as string ?? 'UNKNOWN',
                    };
                }

                // Compile flags
                const imageFlags: string[] = [];
                if (!isAgricultural) imageFlags.push('irrelevant_content');
                if (isStockImage) imageFlags.push('stock_photo');
                if (fullMatchCount >= 3) imageFlags.push('web_sourced');
                if (safeSearch.adult === 'LIKELY' || safeSearch.adult === 'VERY_LIKELY') imageFlags.push('inappropriate_content');
                imageFlags.forEach(f => { if (!allFlags.includes(f)) allFlags.push(f); });

                perImageResults.push({
                    image_url: img.url,
                    is_agricultural: isAgricultural,
                    web_match_count: fullMatchCount,
                    labels,
                    flags: imageFlags,
                });
            }

            // Aggregate agricultural check
            const agriculturalCount = perImageResults.filter(r => r.is_agricultural).length;
            const isOverallAgricultural = agriculturalCount >= perImageResults.length * 0.5;

            return {
                safe_search: safeSearch,
                web_detection: {
                    full_matching_images_count: totalFullMatches,
                    pages_with_matching_images_count: totalPageMatches,
                    is_stock_or_web_image: isAnyStockImage,
                },
                label_annotations: Array.from(allLabels),
                is_agricultural: isOverallAgricultural,
                manipulation_indicators: allFlags,
                per_image_results: perImageResults,
            };
        } catch (error) {
            this.logger.error(`Vision API analysis failed: ${error.message}`);
            return defaultAnalysis;
        }
    }

    // ──────────────────────────────────────────────
    //  Scoring
    // ──────────────────────────────────────────────

    /**
     * Calculate overall verification score (0-1).
     *
     * Weights:
     *   - Agricultural relevance: 35%
     *   - Originality (not stock/web): 35%
     *   - Not duplicate (cross-farm): 30%
     */
    private calculateOverallScore(
        aiAnalysis: ImageAnalysisResult | null,
        isDuplicate: boolean,
    ): number {
        if (!aiAnalysis) {
            return isDuplicate ? 0.3 : 0.5;
        }

        // Relevance score: is the content agricultural?
        const relevanceScore = aiAnalysis.is_agricultural ? 1.0 : 0.2;

        // Originality score: not from stock/web
        let originalityScore = 1.0;
        if (aiAnalysis.web_detection.is_stock_or_web_image) {
            originalityScore = 0.1;
        } else if (aiAnalysis.web_detection.full_matching_images_count > 0) {
            originalityScore = Math.max(0.3, 1.0 - aiAnalysis.web_detection.full_matching_images_count * 0.15);
        }

        // Duplicate score
        const duplicateScore = isDuplicate ? 0.0 : 1.0;

        const overall =
            relevanceScore * 0.35 +
            originalityScore * 0.35 +
            duplicateScore * 0.30;

        return Math.min(Math.max(overall, 0), 1);
    }

    // ──────────────────────────────────────────────
    //  Persistence
    // ──────────────────────────────────────────────

    private async saveHashes(
        hashes: { phash: string; image_url: string }[],
        logId: number,
        farmId: number,
    ): Promise<void> {
        try {
            const entities = hashes.map(h =>
                this.imageHashRepo.create({
                    phash: h.phash,
                    image_url: h.image_url,
                    log_id: logId,
                    farm_id: farmId,
                }),
            );
            await this.imageHashRepo.save(entities);
        } catch (error) {
            this.logger.error(`Failed to save image hashes: ${error.message}`);
        }
    }

    private async saveResult(
        log: Log,
        overallScore: number,
        isDuplicate: boolean,
        duplicateSourceLogId: number | undefined,
        aiAnalysis: ImageAnalysisResult | undefined,
    ): Promise<void> {
        try {
            const result = this.verificationResultRepo.create({
                log_id: log.id,
                farm_id: log.farm_id,
                overall_score: overallScore,
                is_duplicate: isDuplicate,
                duplicate_source_log_id: duplicateSourceLogId,
                ai_analysis: aiAnalysis,
                manipulation_score: aiAnalysis
                    ? (aiAnalysis.web_detection.is_stock_or_web_image ? 0.8 : 0)
                    : 0,
                relevance_score: aiAnalysis
                    ? (aiAnalysis.is_agricultural ? 1.0 : 0.2)
                    : 0.5,
                processed: true
            })

            await this.verificationResultRepo.save(result);
        } catch (error) {
            this.logger.error(`Failed to save verification result for log ${log.id}: ${error.message}`);
        }
    }

    // ──────────────────────────────────────────────
    //  Public Query Methods (for trust scoring)
    // ──────────────────────────────────────────────

    async getVerificationResult(logId: number): Promise<ImageVerificationResult | null> {
        return this.verificationResultRepo.findOne({
            where: { log_id: logId, processed: true },
        });
    }

    async getVerificationResults(logIds: number[]): Promise<ImageVerificationResult[]> {
        if (logIds.length === 0) return [];
        return this.verificationResultRepo.find({
            where: { log_id: In(logIds), processed: true },
            select: ['log_id', 'overall_score', 'is_duplicate', 'relevance_score', 'manipulation_score'],
        });
    }
}
