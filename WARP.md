# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

YPrompt is an intelligent AI prompt generation tool built with Vue 3 + TypeScript. It guides users through conversational interaction to create high-quality AI prompts based on professional prompt engineering principles. The application supports multiple AI providers (OpenAI, Anthropic, Google Gemini) and features both streaming and non-streaming modes.

## Development Commands

### Core Development Commands
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check without emitting
npm run type-check

# Lint and fix code
npm run lint

# Format code with Prettier
npm run format
```

### Testing and Quality Assurance
Currently no test framework is configured. When adding tests, consider:
- Unit tests for services and utilities
- Component tests for Vue components
- Integration tests for AI service interactions

## Project Architecture

### High-Level Architecture

The application follows a **service-oriented architecture** with clear separation of concerns:

1. **UI Layer**: Vue 3 components with Tailwind CSS styling
2. **State Management**: Pinia stores for reactive state
3. **Service Layer**: Singleton services for business logic
4. **Configuration Layer**: Centralized prompt rules and configurations

### Key Architectural Patterns

#### Service Pattern
All major business logic is encapsulated in singleton services:
- `AIService`: Handles multi-provider AI API communication
- `PromptGeneratorService`: Manages prompt generation workflows  
- `AIGuideService`: Controls conversational guidance flow

#### Provider Abstraction
The AI service abstracts multiple providers behind a unified interface:
- **OpenAI**: Standard chat completions API
- **Anthropic**: Claude API with system message separation
- **Google**: Gemini API with content/parts structure
- **Custom**: Flexible provider support

#### State Architecture
```
PromptStore (conversation state)
├── Chat messages and attachments
├── Step progression (6-step workflow)
├── Generated prompt data
└── Execution modes (auto/manual)

SettingsStore (configuration state)
├── Provider configurations
├── Model selections
├── Stream mode preferences
└── Prompt editing rules
```

### Core Components

#### ChatInterface (`src/components/ChatInterface.vue`)
- Real-time conversational interface
- Streaming message support with think-tag filtering
- Multimodal attachment handling (images, documents, audio, video)
- Mobile-responsive design with collapsible panels

#### PreviewPanel (`src/components/PreviewPanel.vue`)  
- Live prompt preview and editing
- Multi-language support (Chinese/English)
- Format switching (Markdown/XML)
- Export functionality

#### PromptGenerator (`src/components/PromptGenerator.vue`)
- 4-step GPrompt methodology execution
- Auto/manual execution modes
- Progress tracking and step management

### Critical Business Logic

#### Multi-Provider AI Integration (`src/services/aiService.ts`)
The `AIService` is the heart of the application, providing:

```typescript
// Core method signature
async callAI(messages: ChatMessage[], provider: ProviderConfig, modelId: string, stream: boolean): Promise<string>
```

**Key Features**:
- **Think Tag Filtering**: Automatically filters `<think></think>` content from streaming responses
- **Multimodal Support**: Handles images, documents, audio, video with provider-specific formatting
- **Error Handling**: Friendly error messages with troubleshooting suggestions
- **Timeout Management**: Extended timeouts for reasoning models (GPT-5, Claude, etc.)

#### Prompt Generation Pipeline (`src/services/promptGeneratorService.ts`)
Implements the GPrompt methodology:

1. **Thinking Points**: Extract key directives from user description
2. **Initial Prompt**: Generate structured prompt using standardized template
3. **Optimization Advice**: Analyze and suggest improvements
4. **Final Prompt**: Apply optimizations for production-ready prompt

#### Conversational Guide (`src/services/aiGuideService.ts`)
Manages the 6-step user guidance workflow:
1. Task Definition
2. Usage Context  
3. Output Format
4. Quality Criteria
5. Execution Parameters
6. Optimization Confirmation

### Configuration System

#### Prompt Rules (`src/config/prompts/`)
Centralized prompt engineering rules:
- `systemPromptRules.ts`: Core system prompt principles
- `userGuidedRules.ts`: Conversational guidance rules
- `requirementReportRules.ts`: Requirement analysis templates

#### Provider Templates (`src/stores/settingsStore.ts`)
Pre-configured templates for major AI providers with appropriate models and endpoints.

### Data Flow

```
User Input → ChatInterface → AIGuideService → AIService → Provider API
                                ↓
Generated Response ← PromptStore ← PromptGeneratorService
                                ↓
PreviewPanel ← Formatted Output
```

### Mobile Responsiveness

The application implements a **collapsible panel system** for mobile devices:
- Toggle between chat and preview panels
- Responsive breakpoint at 1024px (Tailwind `lg`)
- Touch-friendly interface elements

## Configuration Files

### Build Configuration
- `vite.config.ts`: Vite build configuration with Vue plugin and path aliases
- `tsconfig.json`: TypeScript configuration with strict mode enabled
- `tailwind.config.js`: Tailwind CSS with typography plugin
- `postcss.config.js`: PostCSS configuration for Tailwind

### Deployment
- `vercel.json`: Vercel deployment configuration with SPA routing
- Framework detection: Vite
- Output directory: `dist`

## Development Guidelines

### Code Organization
- **Services**: Use singleton pattern for stateful services
- **Components**: Keep components focused on presentation logic
- **Stores**: Use Pinia for reactive state management
- **Types**: Define interfaces in component files or dedicated type files

### AI Integration Patterns
- Always handle streaming and non-streaming modes
- Implement proper error handling with user-friendly messages
- Support multimodal content where applicable
- Use provider-specific formatting for optimal results

### Styling Conventions
- Use Tailwind CSS utility classes
- Responsive design with mobile-first approach
- Consistent color scheme (blue primary, gray neutrals)
- Typography plugin for markdown content rendering

### State Management
- Keep UI state local to components when possible
- Use stores for shared application state
- Implement proper cleanup for async operations
- Handle loading and error states consistently

## Key Dependencies

### Core Framework
- `vue@^3.4.0`: Vue 3 with Composition API
- `pinia@^2.1.7`: State management
- `vue-router@^4.2.5`: Routing (single page application)

### UI and Styling
- `tailwindcss@^3.3.6`: Utility-first CSS framework
- `@tailwindcss/typography@^0.5.18`: Rich text styling
- `lucide-vue-next@^0.544.0`: Icon library

### Content Processing
- `marked@^16.3.0`: Markdown parsing and rendering
- `@types/marked@^5.0.2`: TypeScript definitions

### Build Tools
- `vite@^5.0.0`: Fast build tool and dev server
- `vue-tsc@^1.8.25`: Vue TypeScript compiler
- `typescript@~5.3.0`: TypeScript language support

## Deployment Notes

### Vercel Deployment
The application is optimized for Vercel deployment with:
- Automatic framework detection (Vite)
- SPA routing configuration
- Asset caching headers
- Build command: `npm run build`
- Output directory: `dist`

### Environment Variables
No environment variables are required for basic functionality. API keys are managed through the application's settings interface.

### Performance Considerations
- Streaming responses for better user experience
- Lazy loading of components where appropriate
- Efficient state updates to minimize re-renders
- Proper cleanup of event listeners and subscriptions

## Troubleshooting Common Issues

### AI Provider Configuration
- Ensure correct API endpoint formats for each provider type
- Verify model availability and naming conventions
- Check API key validity and permissions

### Streaming Issues
- Monitor think-tag filtering for proper content display
- Handle network interruptions gracefully
- Implement fallback to non-streaming mode

### Mobile Layout Issues
- Test panel toggling functionality
- Verify responsive breakpoints
- Check touch interaction areas