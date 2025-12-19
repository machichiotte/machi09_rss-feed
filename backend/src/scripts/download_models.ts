import { pipeline, env } from '@xenova/transformers';
import path from 'path';
import process from 'node:process';

// Set cache directory to a predictable location
env.cacheDir = './models_cache';

async function downloadModels() {
    console.log('📥 Starting model download...');

    try {
        console.log('🤖 Downloading sentiment analysis model: Xenova/bert-base-multilingual-uncased-sentiment');
        await pipeline(
            'sentiment-analysis',
            'Xenova/bert-base-multilingual-uncased-sentiment'
        );

        console.log('📚 Downloading summarization model: Xenova/distilbart-cnn-6-6');
        await pipeline(
            'summarization',
            'Xenova/distilbart-cnn-6-6'
        );

        console.log('🌐 Downloading translation model: Xenova/m2m100_418M');
        await pipeline(
            'translation',
            'Xenova/m2m100_418M'
        );

        console.log('✅ Models downloaded and cached successfully in:', path.resolve(env.cacheDir));
    } catch (error) {
        console.error('❌ Failed to download models:', error);
        process.exit(1);
    }
}

downloadModels();
