# Dynamic Font Size Plugin for Obsidian

A custom Obsidian plugin that allows you to dynamically adjust the font size of note content through frontmatter properties with an intuitive slider interface.

## Features

- **Property-based font sizing**: Set font size using the `font-size` property in note frontmatter
- **Real-time updates**: Font size changes are applied immediately when you modify the property
- **Interactive slider**: Toggle a slider UI for easy font size adjustment
- **Status bar indicator**: Shows current font size in the status bar
- **Configurable ranges**: Customize minimum, maximum, and default font size values
- **Smooth transitions**: Font size changes animate smoothly for better UX

## Usage

### Method 1: Manual Property Setting

Add a `font-size` property to your note's frontmatter:

```yaml
---
font-size: 1.5rem
---
Your note content will render at 1.5rem font size.
```

You can use either:

- String format with unit: `"1.5rem"`
- Numeric format: `1.5`

### Method 2: Slider Interface

1. Open a note
2. Run the command "Toggle font size slider" (Ctrl/Cmd + P, then search for it)
3. A slider will appear in the view header
4. Adjust the slider to change the font size
5. The frontmatter will be updated automatically

## Installation

### Development Setup

1. Navigate to the plugin directory:

   ```bash
   cd .obsidian/plugins/dynamic-font-size
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Build the plugin:

   ```bash
   npm run build
   ```

4. For development with auto-rebuild:

   ```bash
   npm run dev
   ```

5. Enable the plugin in Obsidian:
   - Go to Settings → Community plugins
   - Reload plugins
   - Enable "Dynamic Font Size"

## Configuration

The plugin provides several configurable settings:

- **Minimum font size**: The smallest allowed font size (default: 0.5rem)
- **Maximum font size**: The largest allowed font size (default: 3.0rem)
- **Default font size**: The default value when using the slider (default: 1.0rem)

Access these settings in Settings → Dynamic Font Size.

## Commands

- **Toggle font size slider**: Show or hide the font size adjustment slider in the current note

## How It Works

The plugin:

1. Monitors the active note for changes
2. Reads the `font-size` property from the note's frontmatter
3. Applies the font size to the note's content area using CSS
4. Updates the display when you switch between notes or modify the property
5. Cleans up styles when you close notes or disable the plugin

## Technical Details

- Font sizes are specified in `rem` units (relative to root font size)
- Values are clamped between the configured minimum and maximum
- The plugin uses Obsidian's MetadataCache API for efficient frontmatter reading
- CSS transitions provide smooth font size changes

## Support

For issues or feature requests, please open an issue in the repository.

## License

MIT
