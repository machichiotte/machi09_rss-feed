import { pipeline, env } from '@xenova/transformers';
import path from 'path';
import process from 'node:process';

// Set cache directory to a predictable location
env.cacheDir = './models_cache';

async function downloadModels() {
    console.log('📥 Starting model download...');

    try {
        console.log('🤖 Downloading sentiment analysis model: Xenova/distilbert-base-uncased-finetuned-sst-2-english');
        await pipeline(
            'sentiment-analysis',
            'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
        );

        console.log('✅ Models downloaded and cached successfully in:', path.resolve(env.cacheDir));
    } catch (error) {
        console.error('❌ Failed to download models:', error);
        process.exit(1);
    }
}

downloadModels();
