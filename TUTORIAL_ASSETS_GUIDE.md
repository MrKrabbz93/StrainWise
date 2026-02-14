# Tutorial Asset Generation Guide

The StrainWise tutorial requires 5 high-fidelity images that embody the "Tech-meets-Nature" aesthetic. Due to current image generation capacity constraints, please generate these assets using your preferred AI image generation service (Midjourney, DALL-E 3, Stable Diffusion, etc.).

## Required Assets

All images should be saved to: `public/assets/tutorial/`

### 1. Circuit Leaf (`1-circuit-leaf.webp`)
**Prompt:**
```
A hyper-realistic cannabis leaf formed by glowing green computer motherboard traces, dark background, 8k resolution, cyberpunk organic style. No text, high luxury aesthetic.
```
**Specifications:**
- Format: WebP
- Aspect Ratio: 1:1 (square)
- Resolution: Minimum 1024x1024px
- Style: Photorealistic, dark background, neon green accents

---

### 2. Digital Brain (`2-digital-brain.webp`)
**Prompt:**
```
A glowing digital brain made of green fiber optic cables, synapses firing, dark void background, representing artificial intelligence, 3D render. Tech-meets-Nature aesthetic. No text.
```
**Specifications:**
- Format: WebP
- Aspect Ratio: 1:1 (square)
- Resolution: Minimum 1024x1024px
- Style: 3D render, bioluminescent green, neural network aesthetic

---

### 3. Floating Flower (`3-floating-flower.webp`)
**Prompt:**
```
A single high-quality 3D render of a cannabis flower floating in a dark studio space, cinematic lighting, sharp focus on trichomes, macro photography style. Luxury presentation. No text.
```
**Specifications:**
- Format: WebP
- Aspect Ratio: 1:1 (square)
- Resolution: Minimum 1024x1024px
- Style: Macro photography, studio lighting, premium product shot

---

### 4. Global Network (`4-global-network.webp`)
**Prompt:**
```
A 3D stylized globe, dark mode, glowing neon green location pins sticking out of Australia and Thailand, connecting lines, data visualization style. Professional luxury look. No text.
```
**Specifications:**
- Format: WebP
- Aspect Ratio: 1:1 (square)
- Resolution: Minimum 1024x1024px
- Style: Data visualization, holographic globe, green accent lighting

---

### 5. Mycelium Network (`5-mycelium-network.webp`)
**Prompt:**
```
Glowing bioluminescent mycelium roots connecting in a network, neural network style, neon green and teal, dark background, representing connection. Organic technology. No text.
```
**Specifications:**
- Format: WebP
- Aspect Ratio: 1:1 (square)
- Resolution: Minimum 1024x1024px
- Style: Bioluminescent, organic neural network, teal and green palette

---

## Design Principles

All tutorial assets should follow these core principles:

1. **Dark Backgrounds**: Deep blacks (#0f172a or darker) to maintain the premium aesthetic
2. **Neon Accents**: Emerald green (#10b981), cyan (#06b6d4), and teal (#14b8a6)
3. **High Contrast**: Sharp, cinematic lighting with dramatic shadows
4. **No Text**: Assets should be purely visual to maintain flexibility
5. **Tech-meets-Nature**: Blend organic cannabis imagery with digital/technological elements

## Implementation

Once generated, place all 5 images in:
```
d:\cannabis-consultant\public\assets\tutorial\
```

The tutorial component (`src/components/TutorialOverlay.jsx`) is already configured to use these paths.

---

**Status**: Awaiting asset generation due to current AI image service capacity constraints.
