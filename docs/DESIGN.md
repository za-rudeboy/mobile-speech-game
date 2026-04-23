---
name: Gentle Focus
colors:
  surface: '#0f141b'
  surface-dim: '#0f141b'
  surface-bright: '#343942'
  surface-container-lowest: '#090e16'
  surface-container-low: '#171c24'
  surface-container: '#1b2028'
  surface-container-high: '#252a33'
  surface-container-highest: '#30353e'
  on-surface: '#dee2ee'
  on-surface-variant: '#c0c7d1'
  inverse-surface: '#dee2ee'
  inverse-on-surface: '#2c3139'
  outline: '#8a919b'
  outline-variant: '#404850'
  surface-tint: '#93ccff'
  primary: '#b1d9ff'
  on-primary: '#003351'
  primary-container: '#72c0ff'
  on-primary-container: '#004d77'
  inverse-primary: '#006397'
  secondary: '#c0c7d6'
  on-secondary: '#2a313d'
  secondary-container: '#404754'
  on-secondary-container: '#aeb5c4'
  tertiary: '#92e7b1'
  on-tertiary: '#00391f'
  tertiary-container: '#76ca97'
  on-tertiary-container: '#005531'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#cce5ff'
  primary-fixed-dim: '#93ccff'
  on-primary-fixed: '#001d31'
  on-primary-fixed-variant: '#004b73'
  secondary-fixed: '#dce3f3'
  secondary-fixed-dim: '#c0c7d6'
  on-secondary-fixed: '#151c27'
  on-secondary-fixed-variant: '#404754'
  tertiary-fixed: '#9ff5be'
  tertiary-fixed-dim: '#84d8a4'
  on-tertiary-fixed: '#002110'
  on-tertiary-fixed-variant: '#00522f'
  background: '#0f141b'
  on-background: '#dee2ee'
  surface-variant: '#30353e'
typography:
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Lexend
    fontSize: 24px
    fontWeight: '400'
    lineHeight: 36px
  body-md:
    fontFamily: Lexend
    fontSize: 20px
    fontWeight: '400'
    lineHeight: 30px
  label-lg:
    fontFamily: Lexend
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  tap-target-min: 64px
  gutter: 24px
  margin-page: 32px
  stack-gap: 16px
---

## Brand & Style

The design system is centered on emotional regulation, safety, and cognitive ease. Designed specifically for young users with neurodivergent needs, the brand personality is "The Quiet Friend"—supportive, predictable, and calm.

The UI style utilizes **Soft Minimalism with Tactile Cues**. It avoids the "flat" look which can sometimes make interactive elements hard to identify, instead using soft depth to indicate "tappability." By removing thin lines, complex borders, and unnecessary decorative elements, the system reduces visual noise to help the user maintain focus on a single task at hand. The atmosphere is nocturnal and soothing, intended to lower sensory input while maintaining high functional contrast.

## Colors

The palette is anchored by a deep **Charcoal Navy (#12171F)** background to eliminate screen glare and provide a stable visual foundation. 

- **Primary Action:** A soft Sky Blue (#72C0FF) is used for main interaction points. It is vibrant enough to be seen easily against the dark background but lacks the harshness of high-saturation blues.
- **Surface:** Secondary containers use a slightly lighter Slate (#2A313D) to create a gentle hierarchy without needing borders.
- **Success & Feedback:** A Gentle Green (#82D6A2) provides positive reinforcement that is clearly distinguishable from the primary blue, ensuring the user feels rewarded and guided.
- **High Contrast:** All text is rendered in high-contrast off-whites to ensure maximum legibility for children who may have visual processing differences.

## Typography

Typography in the design system focuses on character recognition and reduced crowding. 

**Plus Jakarta Sans** is used for headlines to provide a friendly, rounded geometric feel that looks approachable. **Lexend** is utilized for all body and label text; it was specifically designed to improve reading rate and is ideal for educational and health contexts. 

Large font sizes (minimum 20px for body text) are mandated to ensure content is accessible from various viewing distances and to accommodate motor-control challenges where the user might be holding the device closer or further away. Tight tracking is avoided to prevent letters from "merging."

## Layout & Spacing

The layout philosophy follows a **Contextual Fluid Grid** with generous safe zones. 

- **Tap Targets:** Every interactive element must be a minimum of 64x64px. This exceeds standard guidelines to accommodate the developing fine motor skills and occupational therapy needs of a 6-year-old.
- **Information Density:** Content is spaced using a "One-Thought-At-A-Time" principle. Only one primary action and its supporting text should occupy a vertical viewport segment.
- **Rhythm:** A 16px base unit scales up to 32px margins. This wide "breathing room" prevents the user from accidentally triggering the wrong element while navigating.

## Elevation & Depth

Depth is used as a functional tool rather than decoration. The design system avoids complex multi-layered shadows, opting instead for **Soft Tonal Layers and Ambient Shadows**.

- **Elevated States:** Interactive cards and buttons use a very soft, diffused shadow (0px 8px 24px) with a dark tint to lift them from the background.
- **Tactile Feedback:** When pressed, elements should visually "sink" or flatten slightly, providing a clear physical metaphor for a successful interaction.
- **Anti-Distraction:** Do not use glowing effects, flickering animations, or high-frequency patterns. Surfaces should feel matte and stable.

## Shapes

The shape language is strictly **extra-rounded**. Hard corners are completely avoided as they can appear "sharp" or "aggressive" in a sensory-sensitive context.

- **Base Radius:** Standard components (Inputs, Chips) use a 16px radius.
- **Large Components:** Cards and primary containers use a 24px or 32px radius to create a "bubble-like" safety.
- **Pill Shapes:** Small buttons and indicators are fully pill-shaped to maximize the friendly aesthetic and distinguish them clearly from content containers.

## Components

### Buttons
Primary buttons are large, Sky Blue, and pill-shaped. They contain high-contrast white text. Icons used within buttons must be simple, thick-stroked, and represent one clear action.

### Cards
Cards are the primary container for information. They feature a Slate background (#2A313D) and a 32px corner radius. There are no borders; depth is suggested through the tonal difference from the dark background and a subtle bottom shadow.

### Chips & Selectors
Used for simple choices. These must be large enough to tap easily (56px+ height). Active states are highlighted with the primary blue, while inactive states remain neutral slate.

### Feedback Indicators
Success states (completion of a task) use the Gentle Green. These should be accompanied by a large, friendly icon (like a checkmark or a star) to provide a clear sense of achievement.

### Input Fields
Inputs are simplified. They use large text and a solid background color. To reduce cognitive load, use labels above the field rather than floating placeholders which can be confusing once they disappear.

### Progress Visuals
Use thick, rounded progress bars. The motion should be slow and linear to avoid over-stimulating the user. Avoid "spinner" animations; use "filling" animations instead, which feel more grounded and less anxious.