import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import sharp from 'sharp';
import { ImageHash } from '../entities/image-hash.entity';
import { LogImageVerificationResult } from '../entities/log-image-verification-result.entity';
import { Log } from 'src/modules/crop-management/entities/log.entity';
import { FileStorageService } from 'src/core/file-storage/interfaces/file-storage.interface';
import { ImageAnalysisResult, ImagePerImageResult } from '../interfaces/image-analysis.interface';
import { VerificationIdentifier } from '../enums/verification-identifier.enum';

const AGRICULTURAL_LABELS = [
    // General agriculture
    'agriculture', 'farm', 'crop', 'plant', 'soil', 'field', 'harvest',
    'vegetable', 'fruit', 'seed', 'irrigation', 'greenhouse', 'livestock',
    'garden', 'land', 'terrain', 'leaf', 'flower', 'tree', 'grass',
    'organic', 'plantation', 'cultivation', 'fertilizer', 'compost',
    'tractor', 'plowing', 'rice', 'corn', 'wheat', 'paddy', 'orchard',
    'farming', 'rural', 'countryside', 'food', 'produce', 'growth',
    'nursery', 'mulch', 'pruning', 'spraying', 'pesticide', 'herbicide',
    'vegetation', 'flora', 'nature', 'tropical', 'canopy', 'branch',
    'trunk', 'woody plant', 'shrub', 'bush', 'grove', 'jungle',
    'rainforest', 'forest', 'outdoor', 'natural environment',
    'durian', 'mango', 'banana', 'coconut', 'jackfruit', 'dragon fruit',
    'pineapple', 'lychee', 'longan', 'papaya', 'guava', 'rambutan',
    'mangosteen', 'pomelo', 'orange', 'lemon', 'lime', 'coffee',
    'rubber', 'cacao', 'cocoa', 'pepper', 'sugarcane', 'cassava',
    'sweet potato', 'pumpkin', 'eggplant', 'chili', 'ginger', 'turmeric',
    'tomato', 'cucumber', 'cabbage', 'lettuce', 'spinach', 'broccoli',
    'soybean', 'peanut', 'sesame', 'sunflower', 'strawberry', 'grape',
    'watermelon', 'melon', 'avocado', 'passion fruit',
];

@Injectable()
export class ImageVerificationService {
    private readonly logger = new Logger(ImageVerificationService.name);
    private readonly visionClient: ImageAnnotatorClient | null = null;
    private readonly HAMMING_THRESHOLD = 10;

    constructor(
        @InjectRepository(ImageHash) private readonly imageHashRepo: Repository<ImageHash>,
        @InjectRepository(LogImageVerificationResult) private readonly verificationResultRepo: Repository<LogImageVerificationResult>,
        @Inject('FileStorageService') private readonly fileStorageService: FileStorageService,
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

    async verifyLogImages(log: Log): Promise<LogImageVerificationResult> {
        const VERIFICATION_THRESHOLD = 0.5;

        try {
            this.logger.debug(`Starting image verification for log ${log.id} (${log.image_urls.length} images)`);

            if (!log.image_urls || log.image_urls.length === 0) {
                return await this.saveResult(log, 0, false);
            }

            // fetch image buffers from storage (local path or R2 key)
            const imageBuffers = await this.fetchImageBuffers(log.image_urls);
            if (imageBuffers.length === 0) {
                this.logger.warn(`No images could be fetched for log ${log.id}`);
                return await this.saveResult(log, 0, false);
            }

            // check for duplicates (cross-farm)
            const hashes: { phash: string; image_url: string }[] = [];
            for (const img of imageBuffers) {
                try {
                    const phash = await this.computePerceptualHash(img.buffer);
                    hashes.push({ phash, image_url: img.url });
                } catch (err) {
                    this.logger.error(`Failed to compute pHash for ${img.url}: ${err.message}`);
                }
            }
            const duplicateResult = await this.checkDuplicates(hashes, log.farm_id);
            await this.saveHashes(hashes, log.farm_id, log.id, VerificationIdentifier.LOG);

            // AI analysis with Google Cloud Vision
            // const aiAnalysis = this.mockAnalyzeWithVision(imageBuffers, "LOW");
            const aiAnalysis = await this.analyzeWithVision(imageBuffers);

            const overallScore = this.calculateOverallScore(aiAnalysis, duplicateResult.isDuplicate);

            const result = await this.saveResult(
                log,
                overallScore,
                duplicateResult.isDuplicate,
                duplicateResult.sourceLogId,
                aiAnalysis,
            );

            const passed = overallScore >= VERIFICATION_THRESHOLD;
            this.logger.debug(`Image verification complete for log ${log.id}: score=${overallScore}, duplicate=${duplicateResult.isDuplicate}, passed=${passed}`);
            return result;
        } catch (error) {
            this.logger.error(`Image verification failed for log ${log.id}: ${error.message}`);
            throw new Error(error.message);
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

                let key = url;
                if (url.startsWith('http')) {
                    const parsedUrl = new URL(url);
                    const pathname = parsedUrl.pathname;

                    if (pathname.includes('/api/file-storage/')) {
                        // LOCAL
                        key = pathname.split('/api/file-storage/')[1];
                    } else {
                        // R2
                        key = pathname.startsWith('/')
                            ? pathname.substring(1)
                            : pathname;
                    }
                }

                const { buffer, mimeType } = await this.fileStorageService.serveFile(key);
                if (buffer) {
                    results.push({ buffer: buffer, url, mimeType: mimeType });
                }
            } catch (err) {
                this.logger.error(`Failed to fetch image ${url}: ${err.message}`);
            }
        }

        return results;
    }

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
        return hash;
    }

    private async checkDuplicates(hashes: { phash: string; image_url: string }[], farmId: number): Promise<{ isDuplicate: boolean; sourceLogId?: number }> {
        if (hashes.length === 0) return { isDuplicate: false };

        try {
            const phashes = hashes.map(h => h.phash);

            const sql = `
                SELECT ih.farm_id
                FROM image_hash ih
                JOIN unnest($2::bit(64)[]) AS nh(phash)
                ON bit_count(ih.phash # nh.phash) <= $3
                WHERE ih.farm_id != $1
                LIMIT 1
            `;

            const result = await this.imageHashRepo.query(sql, [
                farmId,
                phashes,
                this.HAMMING_THRESHOLD,
            ]);

            if (result.length > 0) {
                return {
                    isDuplicate: true,
                    sourceLogId: result[0].log_id,
                };
            }

            return { isDuplicate: false };
        } catch (error) {
            this.logger.error(`Duplicate check failed: ${error.message}`);
            return { isDuplicate: false };
        }
    }

    /**
     * Analyze images using Google Cloud Vision API.
     * Uses: label detection, object localization, web detection, safe search, and image properties.
     */
    private async analyzeWithVision(
        imageBuffers: { buffer: Buffer; url: string; mimeType: string }[],
    ): Promise<ImageAnalysisResult> {
        const defaultAnalysis: ImageAnalysisResult = {
            safe_search: { adult: 'UNKNOWN', violence: 'UNKNOWN', racy: 'UNKNOWN' },
            web_detection: {
                full_matching_images_count: 0,
                partial_matching_images_count: 0,
                pages_with_matching_images_count: 0,
                is_stock_or_web_image: false,
            },
            label_annotations: [],
            is_agricultural: false,
            manipulation_indicators: [],
            per_image_results: [],
        };

        if (!this.visionClient) {
            this.logger.warn('Vision API client not initialized, returning default analysis');
            return defaultAnalysis;
        }

        try {
            let totalFullMatches = 0;
            let totalPartialMatches = 0;
            let totalPageMatches = 0;
            let isAnyStockImage = false;
            const allLabels: Set<string> = new Set();
            const allFlags: string[] = [];
            const perImageResults: ImagePerImageResult[] = [];
            let safeSearch = defaultAnalysis.safe_search;

            for (const img of imageBuffers) {
                const resizedBuffer = await sharp(img.buffer)
                    .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
                    .toBuffer();

                const [result] = await this.visionClient.annotateImage({
                    image: { content: resizedBuffer.toString('base64') },
                    features: [
                        { type: 'LABEL_DETECTION', maxResults: 30 },
                        { type: 'OBJECT_LOCALIZATION', maxResults: 20 },
                        { type: 'WEB_DETECTION', maxResults: 20 },
                        { type: 'SAFE_SEARCH_DETECTION' },
                        { type: 'IMAGE_PROPERTIES' },
                    ],
                });

                // Label detection — merge general labels + localised objects into one pool.
                // LABEL_DETECTION gives scene-level tags; OBJECT_LOCALIZATION gives specific
                // object names (e.g. "Durian", "Tropical fruit") that label detection may miss.
                const labelNames = (result.labelAnnotations ?? [])
                    .map(l => l.description?.toLowerCase() ?? '')
                    .filter(Boolean);

                const objectNames = (result.localizedObjectAnnotations ?? [])
                    .map(o => o.name?.toLowerCase() ?? '')
                    .filter(Boolean);

                const labels = [...new Set([...labelNames, ...objectNames])];
                labels.forEach(l => allLabels.add(l));

                const isAgricultural = labels.some(label =>
                    AGRICULTURAL_LABELS.some(agLabel => label.includes(agLabel))
                );

                // Web detection
                const webDetection = result.webDetection;
                const fullMatchCount = webDetection?.fullMatchingImages?.length ?? 0;
                const partialMatchCount = webDetection?.partialMatchingImages?.length ?? 0;
                const pageMatchCount = webDetection?.pagesWithMatchingImages?.length ?? 0;

                totalFullMatches += fullMatchCount;
                totalPartialMatches += partialMatchCount;
                totalPageMatches += pageMatchCount;

                const bestGuessLabels =
                    webDetection?.bestGuessLabels?.map(l => l.label?.toLowerCase() ?? '') ?? [];

                const isStockImage =
                    bestGuessLabels.some(l =>
                        l.includes('stock') ||
                        l.includes('getty') ||
                        l.includes('shutterstock') ||
                        l.includes('adobe')
                    ) ||
                    fullMatchCount >= 1 ||                                   // any exact match is definitive
                    partialMatchCount >= 2 ||                                // 2+ partial matches (1 alone is too noisy)
                    pageMatchCount >= 3 ||                                   // appears on 3+ web pages
                    (partialMatchCount >= 1 && pageMatchCount >= 2);          // combination: partial + pages

                if (isStockImage) isAnyStockImage = true;

                // Safe search
                if (result.safeSearchAnnotation) {
                    safeSearch = {
                        adult: result.safeSearchAnnotation.adult as string ?? 'UNKNOWN',
                        violence: result.safeSearchAnnotation.violence as string ?? 'UNKNOWN',
                        racy: result.safeSearchAnnotation.racy as string ?? 'UNKNOWN',
                    };
                }

                // Compile per-image flags (all flags must be added BEFORE the allFlags merge)
                const imageFlags: string[] = [];
                if (!isAgricultural) imageFlags.push('irrelevant_content');
                if (isStockImage) imageFlags.push('stock_photo');
                if (fullMatchCount >= 1 || partialMatchCount >= 2 || pageMatchCount >= 3) imageFlags.push('web_sourced');
                if (partialMatchCount >= 1) imageFlags.push('partial_web_match');
                if (safeSearch.adult === 'LIKELY' || safeSearch.adult === 'VERY_LIKELY') imageFlags.push('inappropriate_content');
                imageFlags.forEach(f => { if (!allFlags.includes(f)) allFlags.push(f); });

                perImageResults.push({
                    image_url: img.url,
                    is_agricultural: isAgricultural,
                    web_match_count: fullMatchCount,
                    web_partial_match_count: partialMatchCount,
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
                    partial_matching_images_count: totalPartialMatches,
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

    private mockAnalyzeWithVision(
        imageBuffers: { buffer: Buffer; url: string; mimeType: string }[],
        scenario: 'LOW' | 'MEDIUM' | 'HIGH',
    ): ImageAnalysisResult {

        const base: ImageAnalysisResult = {
            safe_search: { adult: 'UNKNOWN', violence: 'UNKNOWN', racy: 'UNKNOWN' },
            web_detection: {
                full_matching_images_count: 0,
                pages_with_matching_images_count: 0,
                partial_matching_images_count: 0,
                is_stock_or_web_image: false,
            },
            label_annotations: [],
            is_agricultural: false,
            manipulation_indicators: [],
            per_image_results: [],
        };

        switch (scenario) {
            case 'LOW':
                return {
                    ...base,
                    is_agricultural: false,
                    web_detection: {
                        ...base.web_detection,
                        is_stock_or_web_image: true,
                    },
                };
            case 'MEDIUM':
                return {
                    ...base,
                    is_agricultural: true,
                    web_detection: {
                        ...base.web_detection,
                        full_matching_images_count: 2,
                        is_stock_or_web_image: false,
                    },
                };
            case 'HIGH':
                return {
                    ...base,
                    is_agricultural: true,
                    web_detection: {
                        ...base.web_detection,
                        full_matching_images_count: 0,
                        is_stock_or_web_image: false,
                    },
                };
        }
    }

    /**
     * Calculate overall verification score (0-1).
     *
     * Weights:
     *   - Agricultural relevance: 35%
     *   - Originality (not stock/web): 35%
     *   - Not duplicate (cross-farm): 30%
     */
    private calculateOverallScore(aiAnalysis: ImageAnalysisResult | null, isDuplicate: boolean): number {
        if (!aiAnalysis) {
            return isDuplicate ? 0.3 : 0.5;
        }

        // Relevance score: is the content agricultural?
        const relevanceScore = aiAnalysis.is_agricultural ? 1.0 : 0;

        // Originality score: not from stock/web.
        // Cumulative penalties so that partial matches (common for re-photographed internet
        // images) and page matches both reduce the score even when there are no exact copies.
        let originalityScore = 1.0;
        if (aiAnalysis.web_detection.is_stock_or_web_image) {
            originalityScore = 0;
        } else {
            const fullPenalty = aiAnalysis.web_detection.full_matching_images_count * 0.25;
            const partialPenalty = aiAnalysis.web_detection.partial_matching_images_count * 0.15;
            const pagePenalty = Math.min(aiAnalysis.web_detection.pages_with_matching_images_count * 0.05, 0.25);
            originalityScore = Math.max(0, 1.0 - fullPenalty - partialPenalty - pagePenalty);
        }

        // Duplicate score
        const duplicateScore = isDuplicate ? 0.0 : 1.0;

        if (relevanceScore === 0 || originalityScore === 0 || duplicateScore === 0) return 0;

        const overall =
            relevanceScore * 0.35 +
            originalityScore * 0.35 +
            duplicateScore * 0.30;

        return Math.min(Math.max(overall, 0), 1);
    }

    private async saveHashes(hashes: { phash: string; image_url: string }[], farmId: number, source_id?: number, source?: string): Promise<void> {
        try {
            const entities = hashes.map(h =>
                this.imageHashRepo.create({
                    source: source,
                    source_id: source_id,
                    phash: h.phash,
                    image_url: h.image_url,
                    farm_id: farmId,
                }),
            );
            await this.imageHashRepo.save(entities);
        } catch (error) {
            this.logger.error(`Failed to save image hashes: ${error.message}`);
        }
    }

    private async saveResult(log: Log, overallScore: number, isDuplicate: boolean, duplicateSourceLogId?: number, aiAnalysis?: ImageAnalysisResult): Promise<LogImageVerificationResult> {
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

            return await this.verificationResultRepo.save(result);
        } catch (error) {
            this.logger.error(`Failed to save verification result for log ${log.id}: ${error.message} `);
            throw new Error(error.message);
        }
    }

    async getLogVerificationResultByLogId(logId: number): Promise<LogImageVerificationResult | null> {
        return this.verificationResultRepo.findOne({
            where: { log_id: logId, processed: true },
        });
    }
}
