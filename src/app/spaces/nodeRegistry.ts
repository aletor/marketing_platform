export type HandleType = 'image' | 'video' | 'audio' | 'prompt' | 'mask' | 'pdf' | 'txt' | 'url';

export interface NodeMetadata {
  type: string;
  label: string;
  description: string;
  inputs: {
    id: string;
    label: string;
    type: HandleType;
    required?: boolean;
  }[];
  outputs: {
    id: string;
    label: string;
    type: HandleType;
  }[];
  dataSchema: Record<string, any>;
  preferredConnections?: Record<string, string>; // Maps output types to specific input handled IDs
}

export const NODE_REGISTRY: Record<string, NodeMetadata> = {
  background: {
    type: 'background',
    label: 'Background / Canvas',
    description: 'Creates a solid color canvas or base layer for compositions.',
    inputs: [],
    outputs: [
      { id: 'image', label: 'Image Out', type: 'image' }
    ],
    dataSchema: {
      width: 'number (default 1920)',
      height: 'number (default 1080)',
      color: 'string (hex color)'
    }
  },
  imageComposer: {
    type: 'imageComposer',
    label: 'Image Composer',
    description: 'Stacks multiple images or canvas layers together.',
    inputs: [
      { id: 'layer-n', label: 'Layer Input', type: 'image' }
    ],
    outputs: [
      { id: 'image', label: 'Image Out', type: 'image' }
    ],
    dataSchema: {}
  },
  mediaInput: {
    type: 'mediaInput',
    label: 'Media Input',
    description: 'Uploads or fetches external media (Image, Video, Audio, etc).',
    inputs: [],
    outputs: [
      { id: 'media', label: 'Media Asset', type: 'url' } // Semantic type depends on content
    ],
    dataSchema: {
      value: 'string (URL)',
      type: 'video | image | audio | pdf | txt | url'
    }
  },
  imageExport: {
    type: 'imageExport',
    label: 'Image Export',
    description: 'Exports the final composition as a PNG or JPG file.',
    inputs: [
      { id: 'image', label: 'Image Input', type: 'image', required: true }
    ],
    outputs: [],
    dataSchema: {
      format: 'png | jpeg'
    }
  },
  prompt: {
    type: 'promptInput',
    label: 'Prompt',
    description: 'Input text to guide generative models.',
    inputs: [],
    outputs: [
      { id: 'prompt', label: 'Prompt Out', type: 'prompt' }
    ],
    dataSchema: {
      value: 'string'
    }
  },
  runwayProcessor: {
    type: 'runwayProcessor',
    label: 'RunwayML Gen-3',
    description: 'Generates high-quality AI video from a prompt and/or a source video.',
    inputs: [
      { id: 'prompt', label: 'Prompt Input', type: 'prompt' },
      { id: 'video', label: 'Video Input', type: 'video' }
    ],
    outputs: [
      { id: 'video', label: 'Video Out', type: 'video' }
    ],
    dataSchema: {}
  },
  grokProcessor: {
    type: 'grokProcessor',
    label: 'Grok Imagine',
    description: 'Generates artistic images using xAI Grok model.',
    inputs: [
      { id: 'prompt', label: 'Prompt Input', type: 'prompt' }
    ],
    outputs: [
      { id: 'image', label: 'Image Out', type: 'image' }
    ],
    dataSchema: {}
  },
  concatenator: {
    type: 'concatenator',
    label: 'Prompt Concatenator',
    description: 'Combines multiple text strings into a single large prompt.',
    inputs: [
      { id: 'p1', label: 'Part 1', type: 'prompt' },
      { id: 'p2', label: 'Part 2', type: 'prompt' }
    ],
    outputs: [
      { id: 'prompt', label: 'Combined Prompt', type: 'prompt' }
    ],
    dataSchema: {}
  },
  enhancer: {
    type: 'enhancer',
    label: 'Prompt Enhancer',
    description: 'Uses GPT-4o to transform simple prompts into highly detailed descriptions.',
    inputs: [
      { id: 'prompt', label: 'Raw Prompt', type: 'prompt' }
    ],
    outputs: [
      { id: 'prompt', label: 'Enhanced Prompt', type: 'prompt' }
    ],
    dataSchema: {}
  },
  nanoBanana: {
    type: 'nanoBanana',
    label: 'Nano Banana 2',
    description: 'Generates images and supports image-to-image transformations.',
    inputs: [
      { id: 'prompt', label: 'Prompt Input', type: 'prompt' },
      { id: 'image', label: 'Base Image', type: 'image' }
    ],
    outputs: [
      { id: 'image', label: 'Image Out', type: 'image' }
    ],
    dataSchema: {}
  },
  maskExtraction: {
    type: 'maskExtraction',
    label: 'Mask Extraction',
    description: 'Extracts backgrounds or specific subjects (matte/mask) from media.',
    inputs: [
      { id: 'media', label: 'Target Media', type: 'image' }
    ],
    outputs: [
      { id: 'mask', label: 'Extracted Mask', type: 'mask' }
    ],
    dataSchema: {}
  },
  mediaDescriber: {
    type: 'mediaDescriber',
    label: 'Vision Describer',
    description: 'Analyzes an image and returns a text description of its content.',
    inputs: [
      { id: 'media', label: 'Image Input', type: 'image' }
    ],
    outputs: [
      { id: 'prompt', label: 'Visual Prompt', type: 'prompt' }
    ],
    dataSchema: {}
  }
};
