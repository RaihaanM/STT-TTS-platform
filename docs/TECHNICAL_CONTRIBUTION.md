
# LangLink: Technical Contribution & Research Report

## 1. Problem Statement
Existing web-based translation tools often lack transparency in latency metrics, robustness in poor network conditions (common in rural India), and specific evaluation datasets for Indian languages. LangLink addresses these by integrating a full-stack instrumentation layer, offline capability transparency, and a dedicated benchmarking suite.

## 2. System Architecture Improvements

### Dual-Mode Text-to-Speech (TTS)
We implemented a fallback mechanism for TTS.
- **Primary:** Google Gemini 2.5 Flash Native Audio (High fidelity).
- **Secondary:** Browser `SpeechSynthesis` API (Offline capable, zero latency).
This ensures accessibility remains functional even when the cloud API is unreachable.

### Optimization Layer
- **Client-Side Caching:** An LRU-style caching mechanism stores translation pairs (`Hash(Text + Source + Target)`). This reduces API costs and provides 0ms latency for repeated queries.
- **Latency Instrumentation:** A custom `metricsService` wraps all async calls to measure:
  - STT (Speech-to-Text) latency.
  - Translation inference time.
  - TTS generation and decoding time.

## 3. Offline First Strategy
The `OfflineCapabilityMatrix` module dynamically detects network state changes (`navigator.onLine`).
- **Degraded Mode:** When offline, the UI disables cloud-reliant features (Translation) but keeps local features (History, Playback of cached items, Offline TTS) active.
- **Transparency:** Users are explicitly informed which specific features are unavailable via a matrix view.

## 4. Evaluation Methodology

### Dataset
We constructed a specific evaluation dataset (`src/tests/evaluationDataset.ts`) focusing on:
- **Domains:** Healthcare, Travel, Education, General Conversation.
- **Languages:** Hindi, Tamil, Telugu, Marathi, Bengali, Gujarati, Kannada, Malayalam, Punjabi, Urdu, Sanskrit.

### Benchmarking Tool
The built-in Evaluation Runner iterates through this dataset, capturing:
1. **System Latency:** End-to-end time from request to render.
2. **User Quality Rating:** A 5-point Likert scale for subjective quality assessment.
3. **Data Aggregation:** Results are stored locally and visualized in the `ResultsDashboard`.

## 5. Accessibility & Inclusivity
- **High Contrast Mode:** Dynamic CSS filter injection (`contrast(1.5) saturate(1.2)`).
- **Font Scaling:** Root-level font size adjustment for low-vision users.
- **Keyboard Shortcuts:** `Alt+T` (Translate), `Alt+S` (Record), etc., for motor-impaired users.

## 6. Future Work
- Implementation of "Thinking" models for complex dialect translation.
- Integration of a local lightweight LLM (e.g., Gemma 2B via WebGPU) for true offline translation.
